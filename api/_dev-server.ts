/**
 * Local dev server for the /api routes — NOT deployed.
 * (Vercel ignores files prefixed with _; in production Vercel serves the
 *  functions in api/auth/*.ts directly.)
 *
 * This is a thin Express wrapper that mounts the SAME pure functions from
 * api/_lib — the exact shape we'll use when we migrate off Vercel onto a
 * standalone Express server. Migration = run this file as the prod server.
 *
 * Run:  npm run dev:api      (or: npx tsx api/_dev-server.ts)
 * Vite proxies /api/* here in dev (see vite.config.ts).
 */
import express from 'express';
import { readFileSync } from 'node:fs';
import { requestCode, verifyCode, getMe } from './_lib/auth';
import { listInstructors } from './_lib/instructors';
import { createBooking, listBookings, acceptBookingRequest, declineBookingRequest } from './_lib/bookings';
import { listMessages, sendMessage } from './_lib/messages';

// ── Load .env.local (portable; avoids depending on a runner flag) ────────────
try {
  const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
} catch {
  console.warn('[dev-api] .env.local not found — set env vars manually');
}

const PORT = Number(process.env.API_PORT ?? 3001);

const app = express();
app.use(express.json());

// ── Routes — thin wrappers calling the pure _lib functions ───────────────────
app.post('/api/auth/request-code', async (req, res) => {
  const phone = typeof req.body?.phone === 'string' ? req.body.phone : '';
  if (!phone) {
    return res.status(400).json({ ok: false, error: 'phone is required', code: 'MISSING_PHONE' });
  }
  const result = await requestCode(phone);
  const status = result.ok ? 200 : result.code === 'RATE_LIMITED' ? 429 : 400;
  res.status(status).json(result);
});

app.post('/api/auth/verify', async (req, res) => {
  const phone = typeof req.body?.phone === 'string' ? req.body.phone : '';
  const code  = typeof req.body?.code  === 'string' ? req.body.code  : '';
  if (!phone || !code) {
    return res.status(400).json({ ok: false, error: 'phone and code are required', code: 'MISSING_FIELDS' });
  }
  const result = await verifyCode(phone, code);
  res.status(result.ok ? 200 : 400).json(result);
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const result = await getMe(req.headers.authorization);
    res.status(result.ok ? 200 : 401).json(result);  // ok:false = auth problem → 401
  } catch (e) {
    console.error('[dev-api] /me', e);                 // infra problem → 500 (degraded)
    res.status(500).json({ ok: false, error: 'Server error', code: 'SERVER_ERROR' });
  }
});

app.get('/api/instructors', async (req, res) => {
  try {
    const result = await listInstructors(req.headers.authorization);
    res.status(result.ok ? 200 : 401).json(result);
  } catch (e) {
    console.error('[dev-api] /instructors', e);
    res.status(500).json({ ok: false, error: 'Server error', code: 'SERVER_ERROR' });
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const result = await listBookings(req.headers.authorization);
    res.status(result.ok ? 200 : 401).json(result);
  } catch (e) {
    console.error('[dev-api] GET /bookings', e);
    res.status(500).json({ ok: false, error: 'Server error', code: 'SERVER_ERROR' });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const auth = req.headers.authorization;

    if (body.action === 'accept') {
      const result = await acceptBookingRequest(auth, String(body.bookingId ?? ''));
      return res.status(result.ok ? 200 : statusForCode(result.code)).json(result);
    }
    if (body.action === 'decline') {
      const result = await declineBookingRequest(auth, String(body.bookingId ?? ''));
      return res.status(result.ok ? 200 : statusForCode(result.code)).json(result);
    }

    const result = await createBooking(auth, body);
    return res.status(result.ok ? 201 : statusForCode(result.code)).json(result);
  } catch (e) {
    console.error('[dev-api] POST /bookings', e);
    res.status(500).json({ ok: false, error: 'Server error', code: 'SERVER_ERROR' });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const chatId = String(req.query.chatId ?? '');
    const since  = req.query.since ? String(req.query.since) : undefined;
    const result = await listMessages(req.headers.authorization, chatId, since);
    res.status(result.ok ? 200 : statusForCode(result.code)).json(result);
  } catch (e) {
    console.error('[dev-api] GET /messages', e);
    res.status(500).json({ ok: false, error: 'Server error', code: 'SERVER_ERROR' });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = await sendMessage(req.headers.authorization, String(body.chatId ?? ''), String(body.text ?? ''));
    res.status(result.ok ? 201 : statusForCode(result.code)).json(result);
  } catch (e) {
    console.error('[dev-api] POST /messages', e);
    res.status(500).json({ ok: false, error: 'Server error', code: 'SERVER_ERROR' });
  }
});

function statusForCode(code: string): number {
  switch (code) {
    case 'UNAUTHORIZED':         return 401;
    case 'FORBIDDEN':            return 403;
    case 'NOT_FOUND':            return 404;
    case 'INSTRUCTOR_NOT_FOUND': return 404;
    case 'NOT_PENDING':          return 409;
    case 'SLOT_TAKEN':           return 409;
    case 'SLOT_ALREADY_ACCEPTED': return 409;
    case 'PHONE_BLOCKED':        return 422;
    default:                     return 400;
  }
}

app.listen(PORT, () => {
  console.log(`[dev-api] listening → http://localhost:${PORT}`);
  console.log('  POST /api/auth/request-code  { "phone": "+79991234567" }');
  console.log('  POST /api/auth/verify        { "phone": "...", "code": "..." }');
  console.log('  GET  /api/auth/me            Authorization: Bearer <token>');
  console.log('  GET  /api/instructors        Authorization: Bearer <token>');
  console.log('  GET  /api/bookings           Authorization: Bearer <token>');
  console.log('  POST /api/bookings           Authorization: Bearer <token>');
});
