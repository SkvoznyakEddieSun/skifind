/**
 * Session storage — token + profile persisted in localStorage.
 *
 * NOTE: restoring a session here only trusts the locally stored profile; the
 * token is NOT yet validated against the server (no GET /api/me route exists).
 * Server-side token validation on boot is the next sub-step.
 */

export interface SessionProfile {
  id: string;
  phone: string;
  name: string | null;
  role: string | null;
}

export interface Session {
  token: string;
  profile: SessionProfile;
}

const STORAGE_KEY = 'skifind-session';

export function saveSession(token: string, profile: SessionProfile): void {
  const session: Session = { token, profile };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.token || !parsed?.profile?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
