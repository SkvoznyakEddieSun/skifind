import { getDb } from './db';
import { verifyToken } from './auth';
import { sheregeshToday, toMinutes } from './availability';
import type {
  BookingRow, BookingDTO, CreateBookingResult, BookingsResult,
  AcceptBookingResult, DeclineBookingResult,
} from './types';

const BOOKING_HORIZON_DAYS = 7;   // today .. today+6
const COMMISSION_RATE = 0.05;

// Длительность полного дня (часы) — при необходимости менять тут.
// Должно совпадать с FULL_DAY_HOURS на фронте (BookSlotScreen).
const FULL_DAY_HOURS = 6;

// Individual duration key → minutes + the instructors price column (canon).
const DURATIONS: Record<string, { minutes: number; column: string }> = {
  '1h':       { minutes: 60,                 column: 'price_individual_1h' },
  '2h':       { minutes: 120,                column: 'price_individual_2h' },
  '3h':       { minutes: 180,                column: 'price_individual_3h' },
  '4h':       { minutes: 240,                column: 'price_individual_4h' },
  'full_day': { minutes: FULL_DAY_HOURS * 60, column: 'price_individual_full_day' },
};

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function hhmm(t: string): string {
  return t.slice(0, 5);   // "HH:MM:SS" → "HH:MM"
}

function err(code: string, error: string): { ok: false; error: string; code: string } {
  return { ok: false, error, code };
}

type WeekWindow = { start: string; end: string; breaks?: { start: string; end: string }[]; off?: boolean };

function rowToDTO(b: BookingRow, counterpartyName: string | null, counterpartyPhone: string | null): BookingDTO {
  return {
    id: b.id,
    instructorId: b.instructor_id,
    studentId: b.student_id,
    date: b.date,
    startTime: hhmm(b.start_time),
    endTime: hhmm(b.end_time),
    format: b.format,
    status: b.status,
    price: b.price,
    commission: b.commission,
    createdAt: b.created_at,
    counterpartyName,
    counterpartyPhone,
  };
}

// ── CREATE ────────────────────────────────────────────────────────────────────

interface CreateBody {
  instructorId?: unknown;
  date?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  format?: unknown;
  durationKey?: unknown;
  groupSize?: unknown;
}

/**
 * Create a booking. student_id is taken ONLY from the JWT (never the body).
 * Price/commission are recomputed server-side from the instructors row — the
 * body's price (if any) is ignored. Overlap is enforced by a DB trigger; we
 * translate its exception into a clean 409 SLOT_TAKEN.
 */
export async function createBooking(authHeader: string | undefined, body: CreateBody): Promise<CreateBookingResult> {
  const auth = verifyToken(authHeader);
  if (!auth) return err('UNAUTHORIZED', 'Требуется авторизация');

  const instructorId = typeof body.instructorId === 'string' ? body.instructorId : '';
  const date         = typeof body.date === 'string' ? body.date : '';
  const startTime    = typeof body.startTime === 'string' ? body.startTime : '';
  const endTime      = typeof body.endTime === 'string' ? body.endTime : '';
  const format       = body.format === 'mini_group' ? 'mini_group' : body.format === 'individual' ? 'individual' : null;
  const durationKey  = typeof body.durationKey === 'string' ? body.durationKey : '';
  const groupSize    = typeof body.groupSize === 'number' ? body.groupSize : 2;

  if (!instructorId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime) || !format) {
    return err('INVALID_BODY', 'Некорректные данные брони');
  }

  const startMin = toMinutes(startTime);
  const endMin   = toMinutes(endTime);
  if (endMin <= startMin) return err('INVALID_TIME', 'Время окончания должно быть позже начала');

  // ── Instructor must exist and actually be an instructor (have a row) ────────
  const db = getDb();
  const { data: instr, error: instrErr } = await db
    .from('instructors')
    .select('profile_id, price_individual_1h, price_individual_2h, price_individual_3h, price_individual_4h, price_individual_full_day, price_mini_group_base, price_mini_group_extra, mini_group_max, week_schedule')
    .eq('profile_id', instructorId)
    .maybeSingle();
  if (instrErr) { console.error('[createBooking] instr error:', instrErr); throw new Error('DB error reading instructor'); }
  if (!instr) return err('INSTRUCTOR_NOT_FOUND', 'Инструктор не найден');

  // ── Date within horizon, not in the past (Sheregesh tz) ─────────────────────
  const today = sheregeshToday();
  if (date < today.dateISO) return err('DATE_IN_PAST', 'Дата уже прошла');
  if (date > addDaysISO(today.dateISO, BOOKING_HORIZON_DAYS - 1)) {
    return err('DATE_OUT_OF_RANGE', `Запись доступна на ближайшие ${BOOKING_HORIZON_DAYS} дней`);
  }
  if (date === today.dateISO && startMin <= today.nowMinutes) {
    return err('TIME_IN_PAST', 'Это время уже прошло');
  }

  // ── Inside the instructor's working window for that weekday ──────────────────
  const weekSchedule = (instr.week_schedule ?? {}) as Record<string, WeekWindow>;
  const dayKey = DAY_KEYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
  const win = weekSchedule[dayKey];
  if (!win || win.off) return err('OUTSIDE_WORKING_HOURS', 'В этот день инструктор не работает');
  if (startMin < toMinutes(win.start) || endMin > toMinutes(win.end)) {
    return err('OUTSIDE_WORKING_HOURS', 'Вне рабочего времени инструктора');
  }
  for (const br of win.breaks ?? []) {
    if (startMin < toMinutes(br.end) && endMin > toMinutes(br.start)) {
      return err('OUTSIDE_WORKING_HOURS', 'Это время приходится на перерыв');
    }
  }

  // ── Server-computed price (body price is never trusted) ─────────────────────
  let price: number;
  if (format === 'individual') {
    const dur = DURATIONS[durationKey];
    if (!dur) return err('INVALID_DURATION', 'Некорректная длительность');
    if (endMin - startMin !== dur.minutes) return err('INVALID_DURATION', 'Длительность не совпадает с интервалом');
    const colVal = (instr as Record<string, unknown>)[dur.column] as number | null;
    if (colVal == null) return err('PRICE_UNAVAILABLE', 'Цена для этой длительности не указана');
    price = colVal;
  } else {
    const base = instr.price_mini_group_base as number | null;
    if (base == null) return err('PRICE_UNAVAILABLE', 'Цена мини-группы не указана');
    const max = (instr.mini_group_max as number | null) ?? 2;
    const size = Math.max(2, Math.min(groupSize, max));
    price = base + ((instr.price_mini_group_extra as number | null) ?? 0) * (size - 2);
  }
  const commission = Math.round(price * COMMISSION_RATE);

  // ── Insert (student_id from token only) ─────────────────────────────────────
  const { data: created, error: insErr } = await db
    .from('bookings')
    .insert({
      instructor_id: instructorId,
      student_id:    auth.userId,        // from JWT, never the body
      date,
      start_time:    startTime,
      end_time:      endTime,
      format,
      status:        'PENDING',
      price,
      commission,
    })
    .select()
    .single();

  if (insErr) {
    // Overlap trigger raises P0001 with "занят". Под маркетплейс-моделью триггер
    // блокирует только пересечение с ПОДТВЕРЖДЁННОЙ (ACCEPTED) бронью или МК —
    // конкурирующие PENDING-заявки разрешены. SLOT_TAKEN = слот уже подтверждён.
    if (insErr.code === 'P0001' || /занят/i.test(insErr.message ?? '')) {
      return err('SLOT_TAKEN', 'Это время уже подтверждено у инструктора — выберите другое');
    }
    console.error('[createBooking] insert error:', insErr);
    throw new Error('DB error creating booking');
  }

  return { ok: true, booking: rowToDTO(created as BookingRow, null, null) };
}

// ── LIST ──────────────────────────────────────────────────────────────────────

/**
 * Bookings for the current user. Student → own bookings (student_id); instructor
 * → incoming requests (instructor_id). Counterparty name resolved via profiles
 * (both instructor_id and student_id reference profiles.id).
 */
export async function listBookings(authHeader: string | undefined): Promise<BookingsResult> {
  const auth = verifyToken(authHeader);
  if (!auth) return err('UNAUTHORIZED', 'Требуется авторизация');

  const db = getDb();
  const asInstructor = auth.role === 'instructor';
  const column = asInstructor ? 'instructor_id' : 'student_id';

  const { data, error } = await db
    .from('bookings')
    .select('*')
    .eq(column, auth.userId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });
  if (error) { console.error('[listBookings] error:', error); throw new Error('DB error reading bookings'); }

  const rows = (data ?? []) as BookingRow[];
  // counterparty = the OTHER party's profile id
  const otherIds = [...new Set(rows.map(r => asInstructor ? r.student_id : r.instructor_id))];

  const nameById = new Map<string, { name: string | null; phone: string | null }>();
  if (otherIds.length > 0) {
    const { data: profs, error: pErr } = await db
      .from('profiles')
      .select('id, name, phone')
      .in('id', otherIds);
    if (pErr) { console.error('[listBookings] profiles error:', pErr); throw new Error('DB error reading profiles'); }
    for (const p of (profs ?? []) as { id: string; name: string | null; phone: string | null }[]) {
      nameById.set(p.id, { name: p.name, phone: p.phone });
    }
  }

  const bookings = rows.map(r => {
    const cp = nameById.get(asInstructor ? r.student_id : r.instructor_id);
    return rowToDTO(r, cp?.name ?? null, cp?.phone ?? null);
  });
  return { ok: true, bookings };
}

// ── ACCEPT / DECLINE (instructor only) ────────────────────────────────────────

/** Fetch one booking as a DTO with the student as counterparty (instructor view). */
async function loadInstructorBookingDTO(
  db: ReturnType<typeof getDb>,
  id: string,
): Promise<BookingDTO | null> {
  const { data: row } = await db.from('bookings').select('*').eq('id', id).maybeSingle();
  if (!row) return null;
  const b = row as BookingRow;
  const { data: prof } = await db.from('profiles').select('name, phone').eq('id', b.student_id).maybeSingle();
  const p = prof as { name: string | null; phone: string | null } | null;
  return rowToDTO(b, p?.name ?? null, p?.phone ?? null);
}

/**
 * Accept a PENDING booking and auto-decline overlapping PENDING ones — atomically
 * via the accept_booking_tx RPC (one transaction, row locked FOR UPDATE).
 * Ownership (JWT userId === instructor_id) and the PENDING precondition are
 * checked inside the function. Returns the updated booking + auto-declined ids.
 */
export async function acceptBookingRequest(authHeader: string | undefined, bookingId: string): Promise<AcceptBookingResult> {
  const auth = verifyToken(authHeader);
  if (!auth) return err('UNAUTHORIZED', 'Требуется авторизация');
  if (!bookingId) return err('INVALID_BODY', 'Не указана бронь');

  const db = getDb();
  const { data, error } = await db.rpc('accept_booking_tx', {
    p_booking_id:    bookingId,
    p_instructor_id: auth.userId,   // from JWT, never the body
  });
  if (error) { console.error('[acceptBooking] rpc error:', error); throw new Error('DB error accepting booking'); }

  const res = data as { ok: boolean; code?: string; declinedIds?: string[] };
  if (!res.ok) {
    if (res.code === 'NOT_FOUND')             return err('NOT_FOUND', 'Бронь не найдена');
    if (res.code === 'FORBIDDEN')             return err('FORBIDDEN', 'Нет доступа к этой брони');
    if (res.code === 'SLOT_ALREADY_ACCEPTED') return err('SLOT_ALREADY_ACCEPTED', 'На это время уже есть подтверждённая бронь');
    return err('NOT_PENDING', 'Заявку уже обработали');
  }

  const booking = await loadInstructorBookingDTO(db, bookingId);
  if (!booking) return err('NOT_FOUND', 'Бронь не найдена');
  return { ok: true, booking, declinedIds: res.declinedIds ?? [] };
}

/** Decline a PENDING booking (instructor only). Others untouched. */
export async function declineBookingRequest(authHeader: string | undefined, bookingId: string): Promise<DeclineBookingResult> {
  const auth = verifyToken(authHeader);
  if (!auth) return err('UNAUTHORIZED', 'Требуется авторизация');
  if (!bookingId) return err('INVALID_BODY', 'Не указана бронь');

  const db = getDb();
  const { data: row, error } = await db.from('bookings').select('*').eq('id', bookingId).maybeSingle();
  if (error) { console.error('[declineBooking] read error:', error); throw new Error('DB error reading booking'); }
  if (!row) return err('NOT_FOUND', 'Бронь не найдена');

  const b = row as BookingRow;
  if (b.instructor_id !== auth.userId) return err('FORBIDDEN', 'Нет доступа к этой брони');
  if (b.status !== 'PENDING')          return err('NOT_PENDING', 'Заявку уже обработали');

  // Conditional update guards against a concurrent transition (idempotent).
  const { error: upErr } = await db
    .from('bookings')
    .update({ status: 'DECLINED' })
    .eq('id', bookingId)
    .eq('status', 'PENDING');
  if (upErr) { console.error('[declineBooking] update error:', upErr); throw new Error('DB error declining booking'); }

  const booking = await loadInstructorBookingDTO(db, bookingId);
  if (!booking) return err('NOT_FOUND', 'Бронь не найдена');
  return { ok: true, booking };
}
