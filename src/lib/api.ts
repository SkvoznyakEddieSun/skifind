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
import type { BookingStatus } from './bookingStatus';

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

/** Catalog DTO — flat shape from the server (JOIN profiles+instructors). */
export interface InstructorDTO {
  id: string;
  name: string | null;
  discipline: 'ski' | 'snowboard' | null;
  tags: string[];
  priceIndividual: number | null;
  priceIndividual1h: number | null;
  priceIndividual2h: number | null;
  priceIndividual3h: number | null;
  priceIndividual4h: number | null;
  priceIndividualFullDay: number | null;
  priceMiniGroupBase: number | null;
  priceMiniGroupExtra: number | null;
  miniGroupMax: number | null;
  weekSchedule: Record<string, { start: string; end: string; breaks?: { start: string; end: string }[] }> | null;
  bio: string | null;
  photoUrl: string | null;
  hasFreeToday: boolean;
  nextSlot: string | null;   // "HH:MM" (Sheregesh tz) or null
}

/** Booking as returned by the server (counterparty name resolved). */
export interface BookingDTO {
  id: string;
  instructorId: string;
  studentId: string;
  date: string;
  startTime: string;
  endTime: string;
  format: 'individual' | 'mini_group' | null;
  status: BookingStatus;
  price: number | null;
  commission: number | null;
  createdAt: string;
  counterpartyName: string | null;
  counterpartyPhone: string | null;
  chatId: string | null;
}

export interface CreateBookingInput {
  instructorId: string;
  date: string;          // YYYY-MM-DD
  startTime: string;     // HH:MM
  endTime: string;       // HH:MM
  format: 'individual' | 'mini_group';
  durationKey?: '1h' | '2h' | '3h' | '4h' | 'full_day';
  groupSize?: number;
}

export type CreateBookingResponse =
  | { ok: true; booking: BookingDTO }
  | ApiError;

export interface MessageDTO {
  id: string;
  senderId: string | null;
  text: string | null;
  cardData: Record<string, unknown> | null;
  createdAt: string;
}

export type SendMessageResponse =
  | { ok: true; message: MessageDTO }
  | ApiError;

export type AcceptBookingResponse =
  | { ok: true; booking: BookingDTO; declinedIds: string[] }
  | ApiError;

export type DeclineBookingResponse =
  | { ok: true; booking: BookingDTO }
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

/**
 * Catalog list. THROWS on failure (network / 401 / 5xx) so react-query can
 * drive loading/error/retry — that's the react-query idiom, unlike the
 * object-returning auth helpers above.
 */
export async function getInstructors(): Promise<InstructorDTO[]> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch('/api/instructors', { headers });
  } catch {
    throw new Error('Нет связи с сервером');
  }
  if (!res.ok) throw new Error('Не удалось загрузить инструкторов');

  const data = (await res.json()) as { ok?: boolean; instructors?: InstructorDTO[] };
  if (!data?.ok || !data.instructors) throw new Error('Некорректный ответ сервера');
  return data.instructors;
}

/**
 * Create a booking. Returns a typed result (object, not throw) so the form can
 * branch on SLOT_TAKEN / validation errors. student_id & price are decided by
 * the server — anything sent here for them is ignored.
 */
export function createBooking(input: CreateBookingInput): Promise<CreateBookingResponse> {
  return post<CreateBookingResponse>('/bookings', input);
}

/** Instructor accepts a PENDING booking → ACCEPTED (+ auto-declines overlaps). */
export function acceptBooking(bookingId: string): Promise<AcceptBookingResponse> {
  return post<AcceptBookingResponse>('/bookings', { action: 'accept', bookingId });
}

/** Instructor declines a PENDING booking → DECLINED. */
export function declineBooking(bookingId: string): Promise<DeclineBookingResponse> {
  return post<DeclineBookingResponse>('/bookings', { action: 'decline', bookingId });
}

/** Chat messages (oldest first). `since` (ISO created_at) → only newer ones (polling).
 *  THROWS on failure so callers/react-query can handle it. */
export async function getMessages(chatId: string, since?: string): Promise<MessageDTO[]> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const qs = new URLSearchParams({ chatId });
  if (since) qs.set('since', since);

  let res: Response;
  try {
    res = await fetch(`/api/messages?${qs.toString()}`, { headers });
  } catch {
    throw new Error('Нет связи с сервером');
  }
  if (!res.ok) throw new Error('Не удалось загрузить сообщения');
  const data = (await res.json()) as { ok?: boolean; messages?: MessageDTO[] };
  if (!data?.ok || !data.messages) throw new Error('Некорректный ответ сервера');
  return data.messages;
}

/** Send a text message to a chat. Returns a typed result (object, not throw)
 *  so the UI can branch on PHONE_BLOCKED / FORBIDDEN. */
export function sendMessage(chatId: string, text: string): Promise<SendMessageResponse> {
  return post<SendMessageResponse>('/messages', { chatId, text });
}

/** Current user's bookings (student → own, instructor → incoming). THROWS on
 *  failure (react-query idiom). */
export async function getBookings(): Promise<BookingDTO[]> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch('/api/bookings', { headers });
  } catch {
    throw new Error('Нет связи с сервером');
  }
  if (!res.ok) throw new Error('Не удалось загрузить брони');

  const data = (await res.json()) as { ok?: boolean; bookings?: BookingDTO[] };
  if (!data?.ok || !data.bookings) throw new Error('Некорректный ответ сервера');
  return data.bookings;
}
