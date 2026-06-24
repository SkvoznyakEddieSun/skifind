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
