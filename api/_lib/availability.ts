// Pure availability math for "free today" + "next slot".
// No DB access here — callers pass the day window + busy intervals.

// Sheregesh (Tashtagol, Kemerovo Oblast / Kuzbass) runs on Krasnoyarsk Time,
// UTC+7 year-round (no DST in Russia). Hardcoded — verify if this ever moves.
export const SHEREGESH_UTC_OFFSET_HOURS = 7;

// Minimum bookable free block to count an instructor as "free today" and to
// surface a next slot — one short individual lesson.
const MIN_FREE_MINUTES = 60;
const SLOT_ROUND_MINUTES = 30;

export interface Interval { start: number; end: number; } // minutes from 00:00

export interface DayWindow {
  start: string;                                   // "09:00"
  end: string;                                     // "18:00"
  breaks?: { start: string; end: string }[];
  off?: boolean;
}

export interface TodayContext {
  /** weekday key for today in Sheregesh tz: 'mon'..'sun' */
  dayKey: string;
  /** today's date in Sheregesh tz, "YYYY-MM-DD" (for DB date filters) */
  dateISO: string;
  /** minutes-from-midnight "now" in Sheregesh tz */
  nowMinutes: number;
}

/** Current date/time projected into Sheregesh local wall-clock. */
export function sheregeshToday(now: Date = new Date()): TodayContext {
  const shifted = new Date(now.getTime() + SHEREGESH_UTC_OFFSET_HOURS * 3600_000);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth() + 1;
  const d = shifted.getUTCDate();
  const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][shifted.getUTCDay()];
  const dateISO = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const nowMinutes = shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  return { dayKey, dateISO, nowMinutes };
}

/** "HH:MM[:SS]" → minutes from midnight. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function toHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Subtract a set of busy intervals from a single base interval. */
export function subtractIntervals(base: Interval, busy: Interval[]): Interval[] {
  const sorted = busy
    .filter(b => b.end > base.start && b.start < base.end)
    .sort((a, b) => a.start - b.start);

  const free: Interval[] = [];
  let cursor = base.start;
  for (const b of sorted) {
    const s = Math.max(b.start, base.start);
    if (s > cursor) free.push({ start: cursor, end: s });
    cursor = Math.max(cursor, Math.min(b.end, base.end));
    if (cursor >= base.end) break;
  }
  if (cursor < base.end) free.push({ start: cursor, end: base.end });
  return free;
}

export interface Availability {
  hasFreeToday: boolean;
  nextSlot: string | null;   // "HH:MM" in Sheregesh tz, or null
}

/**
 * Compute today's availability from the day window, busy intervals (breaks +
 * bookings + masterclasses, all in minutes) and the current time.
 *
 * - Free = window − busy, then clipped to [now, end] (past time doesn't count).
 * - hasFreeToday = any remaining free block ≥ MIN_FREE_MINUTES.
 * - nextSlot = start of the earliest qualifying block, rounded up to the next
 *   30 min (so a mid-block "now" reads like a real bookable slot).
 */
export function computeAvailability(
  window: DayWindow | undefined,
  busy: Interval[],
  nowMinutes: number,
): Availability {
  if (!window || window.off) return { hasFreeToday: false, nextSlot: null };

  const base: Interval = { start: toMinutes(window.start), end: toMinutes(window.end) };
  if (base.end <= base.start) return { hasFreeToday: false, nextSlot: null };

  const breaks = (window.breaks ?? []).map(b => ({ start: toMinutes(b.start), end: toMinutes(b.end) }));
  const free = subtractIntervals(base, [...breaks, ...busy]);

  for (const iv of free) {
    const start = Math.max(iv.start, nowMinutes);
    if (iv.end - start >= MIN_FREE_MINUTES) {
      const rounded = Math.ceil(start / SLOT_ROUND_MINUTES) * SLOT_ROUND_MINUTES;
      // rounding could push past the block edge — guard
      const slot = rounded + MIN_FREE_MINUTES <= iv.end ? rounded : start;
      return { hasFreeToday: true, nextSlot: toHHMM(slot) };
    }
  }
  return { hasFreeToday: false, nextSlot: null };
}
