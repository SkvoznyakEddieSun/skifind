import { getDb } from './db';
import { verifyToken } from './auth';
import type { InstructorsResult, InstructorDTO } from './types';
import {
  sheregeshToday, computeAvailability, toMinutes,
  type Interval, type DayWindow,
} from './availability';

/**
 * Public catalog list — every profile that has an instructors row (i.e. an
 * actually set-up instructor), joined with profiles for the name.
 *
 * Reading is public to any logged-in user, but a valid JWT is still required
 * (login is mandatory for everyone). Invalid token → ok:false → caller maps 401.
 * DB problems throw → wrapper returns 500.
 */
export async function listInstructors(authHeader: string | undefined): Promise<InstructorsResult> {
  const auth = verifyToken(authHeader);
  if (!auth) return { ok: false, error: 'Требуется авторизация', code: 'UNAUTHORIZED' };

  const db = getDb();
  // inner join on profiles → only instructors whose profile exists.
  const { data, error } = await db
    .from('instructors')
    .select(
      'profile_id, discipline, tags, price_individual, ' +
      'price_individual_1h, price_individual_2h, price_individual_3h, ' +
      'price_individual_4h, price_individual_full_day, ' +
      'price_mini_group_base, price_mini_group_extra, mini_group_max, ' +
      'week_schedule, bio, photo_url, profiles!inner(name)'
    );

  if (error) {
    console.error('[listInstructors] db error:', error);
    throw new Error('DB error reading instructors');
  }

  // supabase-js infers a parser type for embedded selects without generated DB
  // types — cast rows to a plain record shape before mapping.
  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const ids = rows.map(r => r.profile_id as string);

  // ── Today's busy intervals per instructor (Sheregesh tz) ──────────────────
  const today = sheregeshToday();
  const busyByInstructor = await loadTodayBusy(db, ids, today.dateISO);

  const instructors: InstructorDTO[] = rows.map((row) => {
    const profile = row.profiles as { name: string | null } | null;
    const id = row.profile_id as string;

    const weekSchedule = (row.week_schedule as InstructorDTO['weekSchedule']) ?? null;
    const todayWindow = weekSchedule?.[today.dayKey] as DayWindow | undefined;
    const { hasFreeToday, nextSlot } = computeAvailability(
      todayWindow,
      busyByInstructor.get(id) ?? [],
      today.nowMinutes,
    );

    return {
      id,
      name:                profile?.name ?? null,
      discipline:          (row.discipline as InstructorDTO['discipline']) ?? null,
      tags:                (row.tags as string[] | null) ?? [],
      priceIndividual:        (row.price_individual as number | null) ?? null,
      priceIndividual1h:      (row.price_individual_1h as number | null) ?? null,
      priceIndividual2h:      (row.price_individual_2h as number | null) ?? null,
      priceIndividual3h:      (row.price_individual_3h as number | null) ?? null,
      priceIndividual4h:      (row.price_individual_4h as number | null) ?? null,
      priceIndividualFullDay: (row.price_individual_full_day as number | null) ?? null,
      priceMiniGroupBase:     (row.price_mini_group_base as number | null) ?? null,
      priceMiniGroupExtra: (row.price_mini_group_extra as number | null) ?? null,
      miniGroupMax:        (row.mini_group_max as number | null) ?? null,
      weekSchedule,
      bio:                 (row.bio as string | null) ?? null,
      photoUrl:            (row.photo_url as string | null) ?? null,
      hasFreeToday,
      nextSlot,
    };
  });

  return { ok: true, instructors };
}

/**
 * Load today's busy intervals (bookings PENDING/ACCEPTED + masterclasses) for
 * a set of instructors, grouped by instructor id. Two batched queries, not N+1.
 */
async function loadTodayBusy(
  db: ReturnType<typeof getDb>,
  ids: string[],
  dateISO: string,
): Promise<Map<string, Interval[]>> {
  const byId = new Map<string, Interval[]>();
  if (ids.length === 0) return byId;

  const push = (id: string, iv: Interval) => {
    const list = byId.get(id) ?? [];
    list.push(iv);
    byId.set(id, list);
  };

  const { data: bookings, error: bErr } = await db
    .from('bookings')
    .select('instructor_id, start_time, end_time')
    .in('instructor_id', ids)
    .eq('date', dateISO)
    .in('status', ['PENDING', 'ACCEPTED']);
  if (bErr) { console.error('[listInstructors] bookings error:', bErr); throw new Error('DB error reading bookings'); }
  for (const b of (bookings ?? []) as { instructor_id: string; start_time: string; end_time: string }[]) {
    push(b.instructor_id, { start: toMinutes(b.start_time), end: toMinutes(b.end_time) });
  }

  const { data: mcs, error: mErr } = await db
    .from('masterclasses')
    .select('instructor_id, start_time, duration_minutes')
    .in('instructor_id', ids)
    .eq('date', dateISO);
  if (mErr) { console.error('[listInstructors] masterclasses error:', mErr); throw new Error('DB error reading masterclasses'); }
  for (const mc of (mcs ?? []) as { instructor_id: string; start_time: string; duration_minutes: number }[]) {
    const start = toMinutes(mc.start_time);
    push(mc.instructor_id, { start, end: start + (mc.duration_minutes ?? 0) });
  }

  return byId;
}
