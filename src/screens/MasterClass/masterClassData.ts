// ── Shared master-class data ───────────────────────────────────────────────
// Единый источник данных для каталога и деталей МК.

export type McLevel = 'beginner' | 'advanced' | 'all';
export type McSport = 'ski' | 'board';
export type McAvatarColor = 'ice' | 'mint' | 'purple' | 'straw' | 'blue';
export type McLevelColor  = 'mint' | 'straw' | 'purple';

export interface MasterClass {
  id: string;
  title: string;
  sport: McSport;
  level: McLevel;
  levelLabel: string;
  levelColor: McLevelColor;
  instructorName: string;
  instructorInitials: string;
  instructorAvatarColor: McAvatarColor;
  instructorRating: number;
  weekday: string;   // 'сб'
  date: string;      // '17 мая'
  time: string;      // '11:00 — 13:00'
  location: string;
  price: number;
  maxParticipants: number;
  currentParticipants: number;
  description: string;
}

export const MASTER_CLASSES: MasterClass[] = [
  {
    id: 'mc1',
    title: 'Техника карвинга',
    sport: 'ski',
    level: 'advanced',
    levelLabel: 'Продвинутые',
    levelColor: 'straw',
    instructorName: 'Алексей Морозов',
    instructorInitials: 'АМ',
    instructorAvatarColor: 'ice',
    instructorRating: 4.9,
    weekday: 'сб',
    date: '17 мая',
    time: '11:00 — 13:00',
    location: 'Касса Шерегеш, вход А',
    price: 3500,
    maxParticipants: 12,
    currentParticipants: 8,
    description:
      'Разберём технику карвинговых поворотов на жёстком снегу. Поставим правильное давление на кант, работу корпуса и рук. Подходит тем, кто уже уверенно едет параллельным ведением.',
  },
  {
    id: 'mc2',
    title: 'Фрирайд для начинающих',
    sport: 'board',
    level: 'beginner',
    levelLabel: 'Начинающие',
    levelColor: 'mint',
    instructorName: 'Дмитрий Захаров',
    instructorInitials: 'ДЗ',
    instructorAvatarColor: 'purple',
    instructorRating: 4.7,
    weekday: 'вс',
    date: '18 мая',
    time: '10:00 — 12:30',
    location: 'Склон Е2, Шерегеш',
    price: 2800,
    maxParticipants: 10,
    currentParticipants: 5,
    description:
      'Введение во внетрассовое катание: оценка лавинной опасности, чтение рельефа, выбор линии, первые шаги за пределами трасс. Нужен базовый навык катания на сноуборде.',
  },
  {
    id: 'mc3',
    title: 'Прыжки в сноупарке',
    sport: 'board',
    level: 'advanced',
    levelLabel: 'Продвинутые',
    levelColor: 'straw',
    instructorName: 'Сергей Лебедев',
    instructorInitials: 'СЛ',
    instructorAvatarColor: 'blue',
    instructorRating: 5.0,
    weekday: 'пн',
    date: '19 мая',
    time: '14:00 — 16:00',
    location: 'Сноупарк Шерегеш',
    price: 4200,
    maxParticipants: 8,
    currentParticipants: 3,
    description:
      'Работа с кикерами и боксами: заход, отрыв, базовые грэбы, корректное приземление. Разберём ошибки в замедленной съёмке. Нужен опыт катания не менее 2 сезонов.',
  },
];
