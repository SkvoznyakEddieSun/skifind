import { useState, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import styles from './CatalogScreen.module.css';
import { useTranslation } from '@/i18n/useTranslation';
import { Icon } from '@/components/Icon/Icon';
import { getInstructors, type InstructorDTO } from '@/lib/api';

type SportType = 'all' | 'ski' | 'board';
type Level = 'all' | 'beginner' | 'intermediate' | 'advanced' | 'kids' | 'freeride' | 'freestyle';
type SortKey = 'random' | 'rating' | 'price-asc' | 'price-desc' | 'experience';

/** Фиксированный порядок тегов на карточке: дисциплина → уровень → стиль → Дети.
 *  straw = Фрирайд, cyan = Фристайл (оба относятся к «стилю»). */
const TAG_ORDER: Record<string, number> = { blue: 0, mint: 1, straw: 2, cyan: 3, purple: 4, gray: 5 };
function orderedTags(tags: Instructor['tags']): Instructor['tags'] {
  return [...tags].sort((a, b) => (TAG_ORDER[a.color] ?? 9) - (TAG_ORDER[b.color] ?? 9));
}

export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DayAvailability {
  start: string;   // "09:00"
  end:   string;   // "17:00"
  breaks?: { start: string; end: string }[];
}

export interface HourlyPricing {
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  /** Тариф «Весь день» — если не задан, опция не отображается ученику */
  fullDay?: number;
}

export interface GroupHourlyPricing extends HourlyPricing {
  extraPersonPrice: number;
  maxParticipants:  number;
}

export interface InstructorPricing {
  individual:     HourlyPricing;
  miniGroup:      GroupHourlyPricing;
  /** Цена за 45-мин слот (только если allowsShortSlots: true) */
  shortSlotPrice?: number;
}

export interface InstructorSkill {
  name: string;
  pct: number;
  color: 'steel' | 'leaf';
}

export interface InstructorPriceRow {
  label: string;
  duration: string;
  price: string;
}

export interface InstructorScheduleDay {
  day: string;
  status: 'free' | 'busy' | 'today';
}

export interface InstructorReview {
  initials: string;
  avatarColor: string;
  name: string;
  date: string;
  text: string;
}

export interface Instructor {
  id: string;
  name: string;
  initials: string;
  avatarColor: 'ice' | 'mint' | 'purple' | 'straw' | 'blue';
  resort: string;
  type: ('ski' | 'board')[];
  level: Level[];
  rating: number;
  price: number;
  allowsShortSlots?: boolean;  // only relevant when worksWithKids: true
  weekSchedule: Partial<Record<WeekDay, DayAvailability>>;
  pricing: InstructorPricing;
  worksWithKids: boolean;
  bio?: string;
  exp: number;
  onMountain: boolean;
  hasFreeSlotsToday: boolean;
  gender: 'male' | 'female';
  busyUntil?: string;
  nextSlot?: string;
  tags: { label: string; color: 'blue' | 'mint' | 'straw' | 'cyan' | 'purple' | 'gray' }[];
  // Расширенные данные профиля
  skills?: InstructorSkill[];
  schedule?: InstructorScheduleDay[];
  prices?: InstructorPriceRow[];
  reviews?: InstructorReview[];
  students?: number;
  reviewsCount?: number;
  // Дополнительные поля (заполняются при регистрации/редактировании)
  certificates?: string;
  photoUrl?: string;
  worksWithGroups?: boolean;
}

export const ACTIVE_RESORTS = ['Шерегеш'] as const;

// ── Маппинг серверного DTO → view-model Instructor ───────────────────────────
// БД хранит теги как человекочитаемые ярлыки; словарь связывает ярлык с ключом
// фильтра (level) и цветом чипа. Ярлык на карточке = строка из БД как есть.
type TagColor = Instructor['tags'][number]['color'];
const TAG_DICT: Record<string, { level: Level; color: TagColor }> = {
  'Новички':     { level: 'beginner',  color: 'mint'   },
  'Продвинутые': { level: 'advanced',  color: 'gray'   },
  'Дети':        { level: 'kids',      color: 'purple' },
  'Фрирайд':     { level: 'freeride',  color: 'straw'  },
  'Фристайл':    { level: 'freestyle', color: 'cyan'   },
};

const AVATAR_PALETTE: Instructor['avatarColor'][] = ['ice', 'mint', 'purple', 'straw', 'blue'];

function initialsOf(name: string): string {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?';
}
function hashIdx(s: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % mod;
}

/** DTO с сервера → Instructor. Поля, которых нет в БД (rating/exp/onMountain/
 *  nextSlot), получают нейтральные дефолты — см. отчёт о пробелах. */
export function mapApiInstructor(dto: InstructorDTO): Instructor {
  const name = dto.name ?? 'Инструктор';
  const type: ('ski' | 'board')[] =
    dto.discipline === 'snowboard' ? ['board'] : dto.discipline === 'ski' ? ['ski'] : [];
  const disciplineTag =
    dto.discipline === 'snowboard' ? { label: 'Сноуборд', color: 'blue' as const }
    : dto.discipline === 'ski'     ? { label: 'Горные лыжи', color: 'blue' as const }
    : null;

  const levels: Level[] = [];
  const specTags = dto.tags.map(tag => {
    const d = TAG_DICT[tag];
    if (d) levels.push(d.level);
    return { label: tag, color: (d?.color ?? 'gray') as TagColor };
  });

  const pricing: InstructorPricing = {
    individual: { h1: dto.priceIndividual ?? 0, h2: 0, h3: 0, h4: 0 },
    miniGroup: {
      h1: dto.priceMiniGroupBase ?? 0, h2: 0, h3: 0, h4: 0,
      extraPersonPrice: dto.priceMiniGroupExtra ?? 0,
      maxParticipants: dto.miniGroupMax ?? 0,
    },
  };

  return {
    id: dto.id,
    name,
    initials: initialsOf(name),
    avatarColor: AVATAR_PALETTE[hashIdx(dto.id, AVATAR_PALETTE.length)],
    resort: ACTIVE_RESORTS[0],
    type,
    level: levels,
    rating: 0,                  // нет в БД — карточка прячет рейтинг при 0
    price: dto.priceIndividual ?? 0,
    weekSchedule: (dto.weekSchedule ?? {}) as unknown as Instructor['weekSchedule'],
    pricing,
    worksWithKids: dto.tags.includes('Дети'),
    bio: dto.bio ?? undefined,
    exp: 0,                     // нет в БД
    onMountain: false,          // нет в БД (live-статус)
    hasFreeSlotsToday: false,   // фильтр «Сегодня» считает по weekSchedule
    gender: 'male',
    tags: disciplineTag ? [disciplineTag, ...specTags] : specTags,
    photoUrl: dto.photoUrl ?? undefined,
  };
}

export const INSTRUCTORS: Instructor[] = [
  {
    id: 'aleksey', name: 'Алексей Морозов', initials: 'АМ', avatarColor: 'ice',
    resort: 'Шерегеш', type: ['board'], level: ['beginner', 'advanced', 'freestyle'],
    rating: 4.9, price: 3500,
    weekSchedule: {
      mon: { start: '09:00', end: '17:00', breaks: [{ start: '13:00', end: '14:00' }] },
      tue: { start: '09:00', end: '17:00', breaks: [{ start: '13:00', end: '14:00' }] },
      wed: { start: '09:00', end: '17:00', breaks: [{ start: '13:00', end: '14:00' }] },
      thu: { start: '09:00', end: '17:00', breaks: [{ start: '13:00', end: '14:00' }] },
      fri: { start: '09:00', end: '17:00', breaks: [{ start: '13:00', end: '14:00' }] },
      sat: { start: '10:00', end: '16:00' },
    },
    pricing: {
      individual: { h1: 3500, h2: 6500, h3: 9000,  h4: 11000, fullDay: 16500 },
      miniGroup:  { h1: 5500, h2: 9000, h3: 12500, h4: 15500, fullDay: 23000, extraPersonPrice: 1500, maxParticipants: 5 },
    },
    worksWithKids: false,
    bio: 'Катаюсь с 14 лет, преподаю с 2016 года. Специализируюсь на обучении взрослых с нуля и улучшении техники. Умею объяснить сложное просто — каждому подбираю свой темп.',
    exp: 8, onMountain: true, hasFreeSlotsToday: true,
    gender: 'male', nextSlot: 'сегодня 14:00',
    tags: [{ label: 'Сноуборд', color: 'blue' }, { label: 'Новички', color: 'mint' }, { label: 'Фристайл', color: 'cyan' }],
    students: 127, reviewsCount: 48,
    skills: [
      { name: 'Новички',     pct: 100, color: 'steel' },
      { name: 'Продвинутые', pct: 85,  color: 'steel' },
      { name: 'Фристайл',    pct: 80,  color: 'leaf'  },
      { name: 'Психология',  pct: 90,  color: 'leaf'  },
    ],
    schedule: [
      { day: 'Пн', status: 'free' }, { day: 'Вт', status: 'free' },
      { day: 'Ср', status: 'free' }, { day: 'Чт', status: 'today' },
      { day: 'Пт', status: 'free' }, { day: 'Сб', status: 'busy' },
      { day: 'Вс', status: 'free' },
    ],
    prices: [
      { label: 'Индивидуальное', duration: '1 ч',    price: '3 500 ₽'  },
      { label: 'Полдня',         duration: '4 ч',    price: '10 000 ₽' },
      { label: 'Мини-группа',    duration: '2 ч',    price: '5 000 ₽'  },
    ],
    reviews: [
      {
        initials: 'КВ', avatarColor: 'ice', name: 'Кирилл Волков', date: '12 января 2025',
        text: 'Брал 3 занятия для себя и жены. Очень терпеливый, объясняет чётко. Жена теперь уверенно спускается с синих трасс.',
      },
      {
        initials: 'ТН', avatarColor: 'mint', name: 'Татьяна Н.', date: '28 декабря 2024',
        text: 'Записала сына 9 лет. За 4 занятия катается сам. Нашёл подход к ребёнку, весело и без нервов.',
      },
    ],
  },
  {
    id: 'natalya', name: 'Наталья Петрова', initials: 'НП', avatarColor: 'mint',
    resort: 'Шерегеш', type: ['ski'], level: ['kids'],
    rating: 5.0, price: 3200,
    allowsShortSlots: true,
    weekSchedule: {
      mon: { start: '09:00', end: '16:00', breaks: [{ start: '12:00', end: '13:00' }] },
      wed: { start: '09:00', end: '16:00', breaks: [{ start: '12:00', end: '13:00' }] },
      thu: { start: '09:00', end: '16:00', breaks: [{ start: '12:00', end: '13:00' }] },
      fri: { start: '09:00', end: '16:00', breaks: [{ start: '12:00', end: '13:00' }] },
      sat: { start: '10:00', end: '15:00' },
    },
    pricing: {
      individual:     { h1: 3200, h2: 6000,  h3: 8500,  h4: 10500, fullDay: 16000 },
      miniGroup:      { h1: 5500, h2: 9000,  h3: 12500, h4: 15500, fullDay: 23000, extraPersonPrice: 1800, maxParticipants: 6 },
      shortSlotPrice: 1800,
    },
    worksWithKids: true,
    bio: '6 лет работаю с детьми от 3 до 12 лет. Нашла подход к самым непоседливым — занятия в игровой форме, без страха, с результатом.',
    exp: 6, onMountain: false, hasFreeSlotsToday: false,
    gender: 'female', nextSlot: 'завтра 10:00',
    tags: [{ label: 'Горные лыжи', color: 'blue' }, { label: 'Дети', color: 'purple' }],
    students: 83, reviewsCount: 31,
    skills: [
      { name: 'Дети 3–7 лет',  pct: 100, color: 'leaf'  },
      { name: 'Дети 8–12 лет', pct: 95,  color: 'leaf'  },
      { name: 'Новички',       pct: 90,  color: 'steel' },
      { name: 'Мини-группы',   pct: 85,  color: 'steel' },
    ],
    schedule: [
      { day: 'Пн', status: 'busy' }, { day: 'Вт', status: 'free' },
      { day: 'Ср', status: 'free' }, { day: 'Чт', status: 'today' },
      { day: 'Пт', status: 'free' }, { day: 'Сб', status: 'free' },
      { day: 'Вс', status: 'busy' },
    ],
    prices: [
      { label: 'Детское',                    duration: '45 мин', price: '2 800 ₽' },
      { label: 'Индивидуальное',             duration: '1 ч',    price: '3 200 ₽' },
      { label: 'Мини-группа (дети)',         duration: '2 ч',    price: '5 500 ₽' },
    ],
    reviews: [
      {
        initials: 'ОС', avatarColor: 'purple', name: 'Ольга Смирнова', date: '3 февраля 2025',
        text: 'Привела дочку 5 лет. Наташа нашла подход моментально — занимались в игровой форме, никаких слёз. За три урока дочка поехала сама!',
      },
      {
        initials: 'ПК', avatarColor: 'straw', name: 'Пётр К.', date: '14 января 2025',
        text: 'Взял урок для себя как полного новичка. Терпеливый педагог, объясняет доступно. Уже на второй день уверенно съехал с зелёной.',
      },
    ],
  },
  {
    id: 'dmitry', name: 'Дмитрий Захаров', initials: 'ДЗ', avatarColor: 'purple',
    resort: 'Шерегеш', type: ['ski', 'board'], level: ['advanced', 'freeride'],
    rating: 4.7, price: 4200,
    weekSchedule: {
      mon: { start: '09:00', end: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      tue: { start: '09:00', end: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      wed: { start: '09:00', end: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      thu: { start: '09:00', end: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      fri: { start: '09:00', end: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      sat: { start: '09:00', end: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
    },
    pricing: {
      individual: { h1: 4200, h2: 8000,  h3: 11000, h4: 14000, fullDay: 21000 },
      miniGroup:  { h1: 6500, h2: 11000, h3: 15000, h4: 18000, fullDay: 27000, extraPersonPrice: 2000, maxParticipants: 4 },
    },
    worksWithKids: false,
    bio: '10 лет на склонах Шерегеша. Мастер спорта по горным лыжам, опыт фрирайда в Альпах. Обучаю технике параллельного ведения и навыкам бэккантри.',
    exp: 10, onMountain: true, hasFreeSlotsToday: true,
    gender: 'male', busyUntil: '15:00',
    tags: [{ label: 'Горные лыжи', color: 'blue' }, { label: 'Сноуборд', color: 'blue' }, { label: 'Фрирайд', color: 'straw' }],
    students: 64, reviewsCount: 22,
    skills: [
      { name: 'Фрирайд',            pct: 100, color: 'leaf'  },
      { name: 'Бэккантри',          pct: 95,  color: 'leaf'  },
      { name: 'Продвинутые',        pct: 100, color: 'steel' },
      { name: 'Технический карвинг', pct: 90, color: 'steel' },
    ],
    schedule: [
      { day: 'Пн', status: 'free' }, { day: 'Вт', status: 'free' },
      { day: 'Ср', status: 'busy' }, { day: 'Чт', status: 'today' },
      { day: 'Пт', status: 'free' }, { day: 'Сб', status: 'free' },
      { day: 'Вс', status: 'busy' },
    ],
    prices: [
      { label: 'Индивидуальное', duration: '1 ч',    price: '4 200 ₽'  },
      { label: 'Полдня',         duration: '4 ч',    price: '14 000 ₽' },
      { label: 'Мини-группа',    duration: '2 ч',    price: '8 000 ₽'  },
    ],
    reviews: [
      {
        initials: 'АН', avatarColor: 'blue', name: 'Антон Нестеров', date: '5 марта 2025',
        text: 'Катаю 7 лет, хотел поставить фрирайд-технику. Дмитрий быстро определил слабые места и дал конкретные упражнения. Прогресс за 2 дня ощутимый.',
      },
      {
        initials: 'ВП', avatarColor: 'ice', name: 'Вадим П.', date: '18 февраля 2025',
        text: 'Приехал с опытом, но боялся целины. После занятия с Дмитрием вышел на внетрассовые склоны. Профессионал с чувством юмора.',
      },
    ],
  },
  {
    id: 'marina', name: 'Марина Волкова', initials: 'МВ', avatarColor: 'straw',
    resort: 'Шерегеш', type: ['ski'], level: ['beginner', 'kids'],
    rating: 4.8, price: 2500,
    // allowsShortSlots не задан → false: работает с детьми, но только часовые слоты
    weekSchedule: {
      mon: { start: '09:00', end: '16:00' },
      tue: { start: '09:00', end: '16:00' },
      wed: { start: '09:00', end: '16:00' },
      thu: { start: '09:00', end: '16:00' },
      fri: { start: '09:00', end: '16:00' },
      sat: { start: '10:00', end: '15:00' },
    },
    pricing: {
      individual: { h1: 2500, h2: 4800, h3: 6800, h4: 8500,  fullDay: 13000 },
      miniGroup:  { h1: 4500, h2: 7500, h3: 10000, h4: 12500, fullDay: 19000, extraPersonPrice: 1500, maxParticipants: 6 },
    },
    worksWithKids: true,
    bio: 'Работаю с новичками и детьми 5 лет. Умею мотивировать и поддерживать уверенность — даже самые осторожные гости начинают кататься самостоятельно.',
    exp: 5, onMountain: false, hasFreeSlotsToday: true,
    gender: 'female', nextSlot: 'сегодня 16:00',
    tags: [{ label: 'Горные лыжи', color: 'blue' }, { label: 'Новички', color: 'mint' }, { label: 'Дети', color: 'purple' }],
    students: 95, reviewsCount: 38,
    skills: [
      { name: 'Дети',                pct: 100, color: 'leaf'  },
      { name: 'Взрослые с нуля',     pct: 95,  color: 'steel' },
      { name: 'Новички',             pct: 90,  color: 'steel' },
      { name: 'Мини-группы',         pct: 80,  color: 'leaf'  },
    ],
    schedule: [
      { day: 'Пн', status: 'free' }, { day: 'Вт', status: 'free' },
      { day: 'Ср', status: 'free' }, { day: 'Чт', status: 'today' },
      { day: 'Пт', status: 'busy' }, { day: 'Сб', status: 'free' },
      { day: 'Вс', status: 'busy' },
    ],
    prices: [
      { label: 'Детское',        duration: '45 мин', price: '2 500 ₽' },
      { label: 'Индивидуальное', duration: '1 ч',    price: '2 500 ₽' },
      { label: 'Мини-группа',    duration: '2 ч',    price: '5 000 ₽' },
    ],
    reviews: [
      {
        initials: 'НК', avatarColor: 'mint', name: 'Наталья К.', date: '20 февраля 2025',
        text: 'Привела дочку 7 лет. Марина — просто волшебник с детьми: спокойная, весёлая, нашла подход мгновенно. Дочка хочет ещё!',
      },
      {
        initials: 'ИВ', avatarColor: 'straw', name: 'Ирина Васильева', date: '9 января 2025',
        text: 'Боялась высоты и скорости. После первого же занятия с Мариной поехала сама. Очень поддерживающий и терпеливый инструктор.',
      },
    ],
  },
  {
    id: 'sergey', name: 'Сергей Лебедев', initials: 'СЛ', avatarColor: 'blue',
    resort: 'Шерегеш', type: ['ski'], level: ['advanced', 'freeride'],
    rating: 5.0, price: 5000,
    weekSchedule: {
      mon: { start: '08:00', end: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      tue: { start: '08:00', end: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      wed: { start: '08:00', end: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      thu: { start: '08:00', end: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      fri: { start: '08:00', end: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      sat: { start: '09:00', end: '17:00', breaks: [{ start: '13:00', end: '14:00' }] },
    },
    pricing: {
      individual: { h1: 5000, h2: 9500,  h3: 13500, h4: 17000, fullDay: 25500 },
      miniGroup:  { h1: 7500, h2: 13000, h3: 18000, h4: 22000, fullDay: 33000, extraPersonPrice: 2500, maxParticipants: 4 },
    },
    worksWithKids: false,
    bio: '12 лет инструкторского опыта, международный сертификат ISIA. Специализируюсь на продвинутых райдерах и фрирайде — помогу выйти на новый уровень.',
    exp: 12, onMountain: true, hasFreeSlotsToday: true,
    gender: 'male', nextSlot: 'сегодня 15:30',
    tags: [{ label: 'Горные лыжи', color: 'blue' }, { label: 'Фрирайд', color: 'straw' }],
    students: 41, reviewsCount: 15,
    skills: [
      { name: 'Карвинг',     pct: 100, color: 'steel' },
      { name: 'Фрирайд',     pct: 100, color: 'leaf'  },
      { name: 'Бэккантри',   pct: 90,  color: 'leaf'  },
      { name: 'Продвинутые', pct: 95,  color: 'steel' },
    ],
    schedule: [
      { day: 'Пн', status: 'free' }, { day: 'Вт', status: 'free' },
      { day: 'Ср', status: 'free' }, { day: 'Чт', status: 'today' },
      { day: 'Пт', status: 'free' }, { day: 'Сб', status: 'busy' },
      { day: 'Вс', status: 'busy' },
    ],
    prices: [
      { label: 'Индивидуальное', duration: '1 ч',    price: '5 000 ₽'  },
      { label: 'Полдня',         duration: '4 ч',    price: '16 000 ₽' },
      { label: 'Мини-группа',    duration: '2 ч',    price: '9 000 ₽'  },
    ],
    reviews: [
      {
        initials: 'ДМ', avatarColor: 'purple', name: 'Дмитрий М.', date: '15 марта 2025',
        text: 'Катаю 15 лет, думал уже всё знаю. Сергей показал нюансы карвинга, о которых не подозревал. Занятие изменило ощущение от езды полностью.',
      },
      {
        initials: 'АС', avatarColor: 'ice', name: 'Алёна С.', date: '2 февраля 2025',
        text: 'ISIA сертификат — это чувствуется. Чёткая методика, конкретные упражнения. За один день прокачала технику поворотов.',
      },
    ],
  },
];

interface CatalogScreenProps {
  onProfile: (instr: Instructor) => void;
  onBook: (instr: Instructor) => void;
  onNotifications: () => void;
  onBecomeInstructor: () => void;
  onMasterClasses: () => void;
  blockedIds?: Set<string>;
  favorites?: Set<string>;
  onToggleFavorite?: (id: string) => void;
}

/**
 * Экран каталога инструкторов.
 *
 * Структура (сверху вниз):
 *  1. Заголовок + кнопки (скроллится и уходит)
 *  2. Поиск + чипы дисциплин (position:sticky — всегда видны)
 *  3. Фильтры + баннер МК + карточки (скроллятся под sticky-блоком)
 *
 * Никакого JS для анимации — только CSS sticky.
 */
export function CatalogScreen({ onProfile, onBook, onNotifications, onMasterClasses, blockedIds, favorites: favoritesProp, onToggleFavorite }: CatalogScreenProps) {
  const { t } = useTranslation();
  const [search, setSearch]           = useState('');
  const [type, setType]               = useState<SportType>('all');
  // Теги-специализации — multi-select. Пустой набор = «Все» (показать всех).
  const [levels, setLevels]           = useState<Set<Level>>(new Set());
  const [sort, setSort]               = useState<SortKey>('random');
  const [onlyFreeToday, setOnlyFreeToday] = useState(false);

  // Данные каталога — с сервера через react-query (loading/error/cache).
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['instructors'],
    queryFn: getInstructors,
  });
  const instructors = useMemo<Instructor[]>(() => (data ?? []).map(mapApiInstructor), [data]);

  /** Случайный порядок (Fisher-Yates) — карта id → позиция, чтобы никто не был
   *  всегда наверху. Перетасовывается один раз при изменении набора данных. */
  const randomOrder = useMemo<Record<string, number>>(() => {
    const ids = instructors.map(i => i.id);
    for (let k = ids.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [ids[k], ids[j]] = [ids[j], ids[k]];
    }
    return Object.fromEntries(ids.map((id, idx) => [id, idx]));
  }, [instructors]);

  const [localFavorites, setLocalFavorites] = useState<Set<string>>(new Set());
  const favorites = favoritesProp ?? localFavorites;
  const contentRef                    = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /** Реальная проверка свободного времени на сегодня по weekSchedule */
  function hasFreeToday(instr: Instructor): boolean {
    const dow = new Date().getDay();
    const key = (['sun','mon','tue','wed','thu','fri','sat'] as WeekDay[])[dow];
    const sched = instr.weekSchedule?.[key];
    if (!sched) return false;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const [h, m] = sched.end.split(':').map(Number);
    return (h * 60 + m) > nowMin + 60; // хотя бы 1 ч до конца рабочего дня
  }

  function toggleFav(id: string) {
    if (onToggleFavorite) {
      onToggleFavorite(id);
    } else {
      setLocalFavorites(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    }
  }

  const filtered = instructors
    .filter(i => {
      if (blockedIds?.has(i.id)) return false;
      if (onlyFreeToday && !hasFreeToday(i)) return false;
      if (type !== 'all' && !i.type.some(t => t === type)) return false;
      // ИЛИ-семантика: инструктор проходит, если у него есть хотя бы один из выбранных тегов.
      if (levels.size > 0 && !i.level.some(l => levels.has(l))) return false;
      if (search) {
        const q = search.toLowerCase();
        const sports = i.type.map(s => s === 'ski' ? 'горные лыжи' : 'сноуборд').join(' ');
        const tags   = i.tags.map(tag => tag.label.toLowerCase()).join(' ');
        if (
          !i.name.toLowerCase().includes(q) &&
          !i.resort.toLowerCase().includes(q) &&
          !sports.includes(q) &&
          !tags.includes(q)
        ) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'experience') return b.exp - a.exp;
      return (randomOrder[a.id] ?? 0) - (randomOrder[b.id] ?? 0);
    });

  const LEVELS: { key: Level; label: string }[] = [
    { key: 'all',       label: t('catalog.levelAll') },
    { key: 'beginner',  label: t('catalog.levelBeginner') },
    { key: 'advanced',  label: t('catalog.levelAdvanced') },
    { key: 'kids',      label: t('catalog.levelKids') },
    { key: 'freeride',  label: t('catalog.levelFreeride') },
    { key: 'freestyle', label: t('catalog.levelFreestyle') },
  ];

  return (
    <div className={styles.screen}>

      {/* ── Фиксированная шапка: заголовок + поиск ── */}
      <div className={styles.header}>
        <div className={styles.tbRow}>
          <div className={styles.titleBlock}>
            <h1 className={styles.heroTitle}>
              {t('catalog.titleLine')} <span>{t('catalog.titleAccent')}</span>
            </h1>
          </div>
          <div className={styles.topActions}>
            <button className={styles.bellBtn} onClick={onNotifications} aria-label="Уведомления">
              <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              <div className={styles.notifDot} />
            </button>
          </div>
        </div>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            type="search"
            placeholder={t('catalog.searchPlaceholder')}
            value={search}
            onChange={e => { setSearch(e.target.value); scrollToTop(); }}
          />
        </div>
      </div>{/* /header */}

      {/* ── Скроллируемый контент ── */}
      <div className={styles.content} ref={contentRef}>

        {/* ── Фильтры (уезжают при скролле) ── */}
        <div className={styles.filtersSection}>
          <div className={styles.typeTabsRow}>
            <div className={styles.typeTabs}>
              {(['all', 'ski', 'board'] as SportType[]).map(tab => (
                <button
                  key={tab}
                  className={`${styles.typeTab} ${type === tab ? styles.typeTabActive : ''}`}
                  onClick={() => {
                    // Повторный тап по активной дисциплине сбрасывает к «Все».
                    // «Все» — состояние «без фильтра», снять нельзя (тап по активному «Все» = no-op).
                    setType(prev => (prev === tab && tab !== 'all') ? 'all' : tab);
                    scrollToTop();
                  }}
                >
                  {tab === 'all' ? t('catalog.filterAll') : tab === 'ski' ? t('catalog.filterAlpine') : t('catalog.filterSnowboard')}
                </button>
              ))}
            </div>
            <div className={`${styles.sortIconBtn} ${sort !== 'random' ? styles.sortIconBtnActive : ''}`}>
              <svg viewBox="0 0 16 16">
                <line x1="2" y1="4" x2="14" y2="4"/>
                <line x1="4" y1="8" x2="12" y2="8"/>
                <line x1="6" y1="12" x2="10" y2="12"/>
              </svg>
              <select
                value={sort}
                onChange={e => { setSort(e.target.value as SortKey); scrollToTop(); }}
              >
                <option value="random">По умолчанию</option>
                <option value="rating">{t('catalog.sortByRating')}</option>
                <option value="price-asc">{t('catalog.sortByPriceAsc')}</option>
                <option value="price-desc">{t('catalog.sortByPriceDesc')}</option>
                <option value="experience">{t('catalog.sortByExp')}</option>
              </select>
            </div>
          </div>

          <div className={styles.levelChips}>
            {LEVELS.map(({ key, label }) => {
              const isAll = key === 'all';
              // «Все» подсвечен, когда не выбрано ни одного тега.
              const active = isAll ? levels.size === 0 : levels.has(key);
              return (
                <button
                  key={key}
                  className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                  onClick={() => {
                    setLevels(prev => {
                      if (isAll) return new Set();        // «Все» очищает набор
                      const next = new Set(prev);
                      next.has(key) ? next.delete(key) : next.add(key); // независимый тоггл
                      return next;
                    });
                    scrollToTop();
                  }}
                >
                  {label}
                </button>
              );
            })}
            <button
              className={`${styles.chip} ${onlyFreeToday ? styles.chipActive : ''}`}
              onClick={() => { setOnlyFreeToday(v => !v); scrollToTop(); }}
            >
              Сегодня
            </button>
          </div>

          {/* ── Баннер мастер-классов ── */}
          <div className={styles.mcBanner} onClick={onMasterClasses}>
            <div className={styles.mcBannerLeft}>
              <div className={styles.mcBannerIcon}><Icon name="ski" size={28} /></div>
              <div>
                <div className={styles.mcBannerTitle}>Мастер-классы</div>
                <div className={styles.mcBannerSub}>Групповые занятия · от 2 800 ₽ · 3 ближайших</div>
              </div>
            </div>
            <span className={styles.mcBannerArrow}>→</span>
          </div>
        </div>

        {/* ── Карточки инструкторов ── */}
        <div className={styles.instrList}>
          {isLoading ? (
            <div className={styles.stateBlock} role="status" aria-label="Загрузка">
              <div className={styles.spinner} />
            </div>
          ) : isError ? (
            <div className={styles.stateBlock}>
              <div className={styles.stateText}>Не удалось загрузить инструкторов</div>
              <button className={styles.retryBtn} onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? 'Загрузка…' : 'Повторить'}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>Никого не найдено</div>
          ) : (
            filtered.map(instr => (
            <div
              key={instr.id}
              className={styles.instrCard}
              role="button"
              tabIndex={0}
              onClick={() => onProfile(instr)}
              onKeyDown={e => e.key === 'Enter' && onProfile(instr)}
            >
              {/* Fav */}
              <button
                className={`${styles.favBtn} ${favorites.has(instr.id) ? styles.favBtnOn : ''}`}
                onClick={e => { e.stopPropagation(); toggleFav(instr.id); }}
                aria-label="В избранное"
              >
                <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              </button>

              {/* Top */}
              <div className={styles.icTop}>
                <div className={`${styles.av} ${styles.avMd} ${styles[`av-${instr.avatarColor}`]}`}>
                  {instr.initials}
                </div>
                <div className={styles.icInfo}>
                  <div className={styles.icName}>{instr.name}</div>
                  <div className={styles.icResort}><Icon name="map-pin" size={11} /> {instr.resort}</div>
                  <div className={styles.icTags}>
                    {orderedTags(instr.tags).map(tag => (
                      <span key={tag.label} className={`${styles.tag} ${styles[`tag-${tag.color}`]}`}>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                  {instr.onMountain && (
                    <div className={styles.onMountainBadge}>{t('catalog.onMountainNow')}</div>
                  )}
                </div>
                {instr.rating > 0 && (
                  <div className={styles.icRating}>
                    <Icon name="star" size={12} />
                    {instr.rating.toFixed(1)}
                  </div>
                )}
              </div>

              {/* Bottom */}
              <div className={styles.icBot}>
                <div>
                  {instr.price ? (
                    <>
                      <div className={styles.icPrice}>{instr.price.toLocaleString('ru')} ₽</div>
                      <div className={styles.icPriceSub}>{t('catalog.perHour')}</div>
                    </>
                  ) : (
                    <div className={styles.icPrice}>Цена не указана</div>
                  )}
                </div>
                <div className={styles.icSlot}>
                  {instr.nextSlot ? (
                    <>
                      <span className={styles.icSlotLabel}>Ближайший слот:</span>
                      <span className={styles.icSlotTime}>{instr.nextSlot}</span>
                    </>
                  ) : (
                    <span className={styles.icSlotNone}>Свяжитесь для уточнения</span>
                  )}
                </div>
              </div>
              <div className={styles.icBookRow}>
                <button
                  className={styles.icBookBtn}
                  onClick={e => { e.stopPropagation(); onBook(instr); }}
                >
                  Записаться →
                </button>
              </div>
            </div>
            ))
          )}
        </div>

        <div style={{ height: 32 }} />
      </div>{/* /content */}
    </div>
  );
}
