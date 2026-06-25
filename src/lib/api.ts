/**
 * API client — thin wrapper over native fetch (no axios; fewer deps, fetch is
 * enough for our JSON endpoints).
 *
 * - base path: /api  (Vite proxies to the local server in dev; Vercel functions
 *   serve it in prod)
 * - auto-adds Authorization: Bearer <token> when a session token exists
 * - parses JSON and returns a typed result — never throws a raw fetch error
 */
import { getToken, type SessionProfile } from './session';

// ── Result shapes ────────────────────────────────────────────────────────────

export interface ApiError {
  ok: false;
  error: string;
  code: string;
}

export type RequestCodeResponse =
  | { ok: true; devCode: string }   // TODO: devCode disappears once real SMS is wired up
  | ApiError;

export type VerifyResponse =
  | { ok: true; token: string; profile: SessionProfile }
  | ApiError;

/**
 * /me result is classified by *why* it failed so the caller can tell
 * "token invalid" (→ log out) from "couldn't reach/validate" (→ stay in,
 * degraded):
 *   - 'unauthorized' : HTTP 401 — bad/expired token or profile gone → log out
 *   - 'network'      : fetch threw — offline / server down → degraded
 *   - 'server'       : HTTP 5xx or bad body → degraded
 */
export type MeResponse =
  | { ok: true; profile: SessionProfile }
  | { ok: false; reason: 'unauthorized' | 'network' | 'server' };

// ── Core ─────────────────────────────────────────────────────────────────────

async function post<T>(path: string, body: unknown): Promise<T | ApiError> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: 'Нет связи с сервером', code: 'NETWORK_ERROR' };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: 'Некорректный ответ сервера', code: 'BAD_JSON' };
  }

  // Server always returns { ok, ... }; pass it through as the typed result.
  return data as T | ApiError;
}

// ── Endpoints ────────────────────────────────────────────────────────────────

export function requestCode(phone: string): Promise<RequestCodeResponse> {
  return post<RequestCodeResponse>('/auth/request-code', { phone });
}

export function verify(phone: string, code: string): Promise<VerifyResponse> {
  return post<VerifyResponse>('/auth/verify', { phone, code });
}

/** Validate the stored token against the server and get the fresh profile. */
export async function me(): Promise<MeResponse> {
  const token = getToken();
  if (!token) return { ok: false, reason: 'unauthorized' };

  let res: Response;
  try {
    res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return { ok: false, reason: 'network' };   // offline / server unreachable
  }

  if (res.status === 401) return { ok: false, reason: 'unauthorized' };
  if (!res.ok)            return { ok: false, reason: 'server' };

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, reason: 'server' };
  }

  const body = data as { ok?: boolean; profile?: SessionProfile };
  if (body?.ok && body.profile) return { ok: true, profile: body.profile };
  return { ok: false, reason: 'server' };
}
