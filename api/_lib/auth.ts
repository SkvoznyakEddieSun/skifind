import jwt from 'jsonwebtoken';
import { getDb } from './db';
import type { Profile, RequestCodeResult, VerifyResult, MeResult } from './types';

const OTP_TTL_MS    = 5 * 60 * 1000;  // 5 minutes
const RATE_LIMIT_MS = 30 * 1000;       // 30 seconds

/** Normalise any Russian phone variant to +7XXXXXXXXXX */
function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) {
    return '+7' + digits.slice(1);
  }
  if (digits.length === 10) {
    return '+7' + digits;
  }
  return null;
}

function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// ---------------------------------------------------------------------------
// TODO: replace body of this function with a real SMS provider
//       (e.g. SMSC, SmsAero, Exolve) when going to production.
//       Only this one function needs to change — callers stay the same.
// ---------------------------------------------------------------------------
async function sendCode(_phone: string, _code: string): Promise<void> {
  // No-op: code is returned as devCode in the API response for dev/testing.
}

// ---------------------------------------------------------------------------

export async function requestCode(rawPhone: string): Promise<RequestCodeResult> {
  const phone = normalisePhone(rawPhone);
  if (!phone) {
    return { ok: false, error: 'Неверный формат телефона', code: 'INVALID_PHONE' };
  }

  const db = getDb();

  // Rate-limit: check when the last code was issued for this phone
  const { data: existing } = await db
    .from('otp_codes')
    .select('created_at')
    .eq('phone', phone)
    .maybeSingle();

  if (existing) {
    const elapsed = Date.now() - new Date(existing.created_at as string).getTime();
    if (elapsed < RATE_LIMIT_MS) {
      const waitSec = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
      return {
        ok: false,
        error: `Повторная отправка через ${waitSec} сек.`,
        code: 'RATE_LIMITED',
      };
    }
  }

  const code      = generateCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  const createdAt = new Date().toISOString();

  const { error: dbErr } = await db
    .from('otp_codes')
    .upsert({ phone, code, expires_at: expiresAt, created_at: createdAt }, { onConflict: 'phone' });

  if (dbErr) {
    console.error('[requestCode] db error:', dbErr);
    return { ok: false, error: 'Ошибка базы данных', code: 'DB_ERROR' };
  }

  await sendCode(phone, code);

  // TODO: remove devCode when real SMS provider is wired up
  return { ok: true, devCode: code };
}

// ---------------------------------------------------------------------------

export async function verifyCode(rawPhone: string, inputCode: string): Promise<VerifyResult> {
  const phone = normalisePhone(rawPhone);
  if (!phone) {
    return { ok: false, error: 'Неверный формат телефона', code: 'INVALID_PHONE' };
  }

  const db = getDb();

  const { data: otp } = await db
    .from('otp_codes')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (!otp) {
    return { ok: false, error: 'Код не найден или уже использован', code: 'CODE_NOT_FOUND' };
  }

  if ((otp as { code: string }).code !== inputCode) {
    return { ok: false, error: 'Неверный код', code: 'WRONG_CODE' };
  }

  if (new Date((otp as { expires_at: string }).expires_at) < new Date()) {
    await db.from('otp_codes').delete().eq('phone', phone);
    return { ok: false, error: 'Срок действия кода истёк', code: 'CODE_EXPIRED' };
  }

  // Consume the OTP — one-time use
  await db.from('otp_codes').delete().eq('phone', phone);

  // Find or create profile
  const { data: existingProfile } = await db
    .from('profiles')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  let profile: Profile;

  if (existingProfile) {
    profile = existingProfile as Profile;
  } else {
    // New users default to 'student' (DB column DEFAULT). 'instructor' is
    // granted manually later — we don't pass role here so the default applies.
    const { data: created, error: insertErr } = await db
      .from('profiles')
      .insert({ phone, name: null })
      .select()
      .single();

    if (insertErr || !created) {
      console.error('[verifyCode] insert profile error:', insertErr);
      return { ok: false, error: 'Ошибка создания профиля', code: 'PROFILE_ERROR' };
    }
    profile = created as Profile;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET env var is not set');

  const token = jwt.sign(
    { userId: profile.id, phone: profile.phone, role: profile.role },
    jwtSecret,
    { expiresIn: '30d' },
  );

  return { ok: true, token, profile };
}

// ---------------------------------------------------------------------------

export interface AuthPayload {
  userId: string;
  phone: string;
  role: string | null;
}

/**
 * Verify a `Authorization: Bearer <jwt>` header. Returns the payload on a valid
 * signature+expiry, or null for missing/invalid/expired token. Shared by every
 * route that needs auth — this is where "защита прав в коде сервера" lives.
 * Throws only if JWT_SECRET is misconfigured (infra problem → 500 upstream).
 */
export function verifyToken(authHeader: string | undefined): AuthPayload | null {
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : null;
  if (!token) return null;

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET env var is not set');

  try {
    const p = jwt.verify(token, jwtSecret) as { userId?: string; phone?: string; role?: string | null };
    if (!p?.userId) return null;
    return { userId: p.userId, phone: p.phone ?? '', role: p.role ?? null };
  } catch {
    return null;
  }
}

/**
 * Validate a session token and return the CURRENT profile from the DB.
 *
 * Returns ok:false (→ caller maps to 401) for auth problems: missing token,
 * bad/expired signature, or a profile that no longer exists. These mean
 * "log out".
 *
 * THROWS for infrastructure problems (DB unreachable, misconfig) — the wrapper
 * catches and returns 500, which the client treats as "degraded, stay in"
 * rather than a logout. This keeps "token invalid" and "couldn't validate"
 * cleanly separated.
 *
 * Role is read fresh from the DB, NOT from the token, so a role change in the
 * DB is picked up on the next start.
 */
export async function getMe(authHeader: string | undefined): Promise<MeResult> {
  const auth = verifyToken(authHeader);
  if (!auth) return { ok: false, error: 'Токен недействителен или истёк', code: 'INVALID_TOKEN' };

  const db = getDb();
  const { data: profile, error } = await db
    .from('profiles')
    .select('*')
    .eq('id', auth.userId)
    .maybeSingle();

  if (error) {
    console.error('[getMe] db error:', error);
    // Infra problem — throw so the wrapper returns 500 (degraded), not 401.
    throw new Error('DB error reading profile');
  }
  if (!profile) {
    return { ok: false, error: 'Профиль не найден', code: 'PROFILE_NOT_FOUND' };
  }

  return { ok: true, profile: profile as Profile };
}
