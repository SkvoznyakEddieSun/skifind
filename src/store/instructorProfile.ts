/**
 * Настройки профиля инструктора — цены и расписание.
 * Module-level mutable state (как остальные store).
 */

import { INSTRUCTORS } from '@/screens/Catalog/CatalogScreen';

// ── Цены ──────────────────────────────────────────────────────────────────
//
// Живая ссылка на pricing первого инструктора (Алексей Морозов).
// Мутации здесь отражаются и в каталоге, и в форме записи.

export const INSTR_PRICING           = INSTRUCTORS[0].pricing;
export const INSTR_WORKS_WITH_KIDS:  boolean = !!INSTRUCTORS[0].worksWithKids;
export const INSTR_ALLOWS_SHORT_SLOTS: boolean = !!INSTRUCTORS[0].allowsShortSlots;

/**
 * Обновить цену.
 * path без точки → top-level поле INSTR_PRICING (напр. "shortSlotPrice").
 * path с точкой  → вложенное поле (напр. "individual.h1", "miniGroup.extraPersonPrice").
 */
export function updateInstrPrice(path: string, value: number): void {
  if (!path.includes('.')) {
    (INSTR_PRICING as unknown as Record<string, number>)[path] = value;
    return;
  }
  const [format, key] = path.split('.') as [string, string];
  const section = (INSTR_PRICING as unknown as Record<string, Record<string, number>>)[format];
  if (section && key in section) section[key] = value;
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
