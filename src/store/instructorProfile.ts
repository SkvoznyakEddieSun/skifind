/**
 * Настройки профиля инструктора — цены и расписание.
 * Module-level mutable state (как остальные store).
 */

// ── Цены ──────────────────────────────────────────────────────────────────

export interface PriceRow {
  format:  'individual' | 'miniGroup' | 'kids';
  label:   string;
  emoji:   string;
  price:   number;   // ₽
  unit:    string;   // "₽ / час" и т.д.
  hint:    string;
}

export const INSTRUCTOR_PRICES: PriceRow[] = [
  {
    format: 'individual',
    label:  'Индивидуальное',
    emoji:  '🎿',
    price:  3500,
    unit:   '₽ / час',
    hint:   'Один ученик, ваш темп',
  },
  {
    format: 'miniGroup',
    label:  'Мини-группа',
    emoji:  '👥',
    price:  7000,
    unit:   '₽ / группа',
    hint:   'До 5 человек',
  },
  {
    format: 'kids',
    label:  'Детское',
    emoji:  '🧒',
    price:  2800,
    unit:   '₽ / занятие',
    hint:   '45–60 мин, до 8 лет',
  },
];

export function updatePrice(format: PriceRow['format'], price: number): void {
  const row = INSTRUCTOR_PRICES.find(r => r.format === format);
  if (row && price > 0) row.price = price;
}

// ── Расписание ─────────────────────────────────────────────────────────────

export interface ScheduleConfig {
  /** Рабочие дни: числа getDay() (0=Вс, 1=Пн … 6=Сб) */
  workDays:  Set<number>;
  startTime: string;  // "09:00"
  endTime:   string;  // "18:00"
  breakEnabled: boolean;
  breakStart:   string;
  breakEnd:     string;
}

export const INSTRUCTOR_SCHEDULE: ScheduleConfig = {
  workDays:     new Set([1, 2, 3, 4, 5, 6]),  // Пн–Сб
  startTime:    '09:00',
  endTime:      '18:00',
  breakEnabled: true,
  breakStart:   '13:00',
  breakEnd:     '14:00',
};

export function updateSchedule(patch: Partial<Omit<ScheduleConfig, 'workDays'>> & { workDays?: number[] }): void {
  if (patch.workDays !== undefined)  INSTRUCTOR_SCHEDULE.workDays  = new Set(patch.workDays);
  if (patch.startTime !== undefined) INSTRUCTOR_SCHEDULE.startTime = patch.startTime;
  if (patch.endTime   !== undefined) INSTRUCTOR_SCHEDULE.endTime   = patch.endTime;
  if (patch.breakEnabled !== undefined) INSTRUCTOR_SCHEDULE.breakEnabled = patch.breakEnabled;
  if (patch.breakStart !== undefined)   INSTRUCTOR_SCHEDULE.breakStart   = patch.breakStart;
  if (patch.breakEnd   !== undefined)   INSTRUCTOR_SCHEDULE.breakEnd     = patch.breakEnd;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export const DAY_CHIPS: { label: string; short: string; dow: number }[] = [
  { label: 'Понедельник', short: 'Пн', dow: 1 },
  { label: 'Вторник',     short: 'Вт', dow: 2 },
  { label: 'Среда',       short: 'Ср', dow: 3 },
  { label: 'Четверг',     short: 'Чт', dow: 4 },
  { label: 'Пятница',     short: 'Пт', dow: 5 },
  { label: 'Суббота',     short: 'Сб', dow: 6 },
  { label: 'Воскресенье', short: 'Вс', dow: 0 },
];

const TIMES: string[] = [];
for (let h = 6; h <= 22; h++) {
  TIMES.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 22) TIMES.push(`${String(h).padStart(2, '0')}:30`);
}
export const TIME_OPTIONS = TIMES;
