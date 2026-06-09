import { pushNotification } from './notifications';

/**
 * Единое хранилище бронирований — общий источник данных
 * для экранов гостя (BookingsScreen) и инструктора (RequestsScreen, ScheduleScreen, Dashboard).
 *
 * Используем module-level mutable array (как MASTER_CLASSES) — без Redux, без сложностей.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type BookingStatus  = 'pending' | 'accepted' | 'declined' | 'completed';
export type BookingFormat  = 'individual' | 'miniGroup' | 'kids';
export type BookingDiscipline = 'ski' | 'board';

export interface Booking {
  id: string;

  // Ученик
  studentName:     string;
  studentInitials: string;
  studentColor:    'ice' | 'mint' | 'straw' | 'purple';

  // Инструктор
  instructorId:          string;
  instructorName:        string;
  instructorInitials:    string;
  instructorAvatarColor: 'ice' | 'mint' | 'straw' | 'blue' | 'purple';
  instructorSpec:        string;   // "Сноуборд · Шерегеш"
  instructorRating:      number;

  // Занятие
  dateISO:     string;   // "2026-04-28"
  dayNum:      string;   // "28"
  dayMon:      string;   // "апр"
  timeStart:   string;   // "10:00"
  timeEnd:     string;   // "11:30"
  discipline:  BookingDiscipline;
  format:      BookingFormat;
  formatLabel: string;   // "Мини-группа · 2 чел."
  level:       string;   // "Новичок" / "Продвинутый" / "Дети"
  groupSize?:  number;
  price:       number;   // рублей

  // Сообщение ученика
  message: string;

  // Мета
  status:    BookingStatus;
  createdAt: string;     // "сегодня 11:42"

  /** true — бронь текущего гостя (показывается в BookingsScreen) */
  isGuestBooking: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export const MONTH_SHORT = [
  'янв','фев','мар','апр','мая','июн',
  'июл','авг','сен','окт','ноя','дек',
];

export function getCommission(price: number): number {
  return Math.round(price * 0.05);
}

function nowLabel(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `сегодня ${h}:${m}`;
}

// ── Pre-seeded data ────────────────────────────────────────────────────────

export const BOOKINGS: Booking[] = [

  // ────── Брони гостя (isGuestBooking: true) ──────────────────────────────

  {
    id: 'b1',
    studentName: 'Вы',
    studentInitials: 'ГО',
    studentColor: 'ice',
    instructorId: 'aleksey',
    instructorName: 'Алексей Морозов',
    instructorInitials: 'АМ',
    instructorAvatarColor: 'ice',
    instructorSpec: 'Сноуборд · Шерегеш',
    instructorRating: 4.9,
    dateISO: '2026-04-28',
    dayNum: '28', dayMon: 'апр',
    timeStart: '10:00', timeEnd: '12:00',
    discipline: 'board',
    format: 'miniGroup',
    formatLabel: 'Мини-группа · 2 чел.',
    level: 'Новичок',
    groupSize: 2,
    price: 7000,
    message: 'Хотим с женой научиться с нуля.',
    status: 'accepted',
    createdAt: '28 апр, 09:00',
    isGuestBooking: true,
  },
  {
    id: 'b2',
    studentName: 'Вы',
    studentInitials: 'ГО',
    studentColor: 'ice',
    instructorId: 'natalya',
    instructorName: 'Наталья Петрова',
    instructorInitials: 'НП',
    instructorAvatarColor: 'mint',
    instructorSpec: 'Горные лыжи · Шерегеш',
    instructorRating: 5.0,
    dateISO: '2026-05-03',
    dayNum: '3', dayMon: 'мая',
    timeStart: '11:00', timeEnd: '11:45',
    discipline: 'ski',
    format: 'kids',
    formatLabel: 'Детское занятие',
    level: 'Дети',
    price: 2800,
    message: '',
    status: 'pending',
    createdAt: 'сегодня, 10:00',
    isGuestBooking: true,
  },
  {
    id: 'b3',
    studentName: 'Вы',
    studentInitials: 'ГО',
    studentColor: 'ice',
    instructorId: 'marina',
    instructorName: 'Марина Волкова',
    instructorInitials: 'МВ',
    instructorAvatarColor: 'straw',
    instructorSpec: 'Горные лыжи · Шерегеш',
    instructorRating: 4.8,
    dateISO: '2026-03-15',
    dayNum: '15', dayMon: 'мар',
    timeStart: '14:00', timeEnd: '15:00',
    discipline: 'ski',
    format: 'individual',
    formatLabel: 'Индивидуальное занятие',
    level: 'Продвинутый',
    price: 2500,
    message: '',
    status: 'completed',
    createdAt: '15 мар, 14:00',
    isGuestBooking: true,
  },

  // ────── Принятые уроки инструктора Алексея (собственные ученики) ──────────

  {
    id: 'l1',
    studentName: 'Кирилл Волков',
    studentInitials: 'КВ',
    studentColor: 'ice',
    instructorId: 'aleksey',
    instructorName: 'Алексей Морозов',
    instructorInitials: 'АМ',
    instructorAvatarColor: 'ice',
    instructorSpec: 'Сноуборд · Шерегеш',
    instructorRating: 4.9,
    dateISO: '2026-04-27',
    dayNum: '27', dayMon: 'апр',
    timeStart: '10:00', timeEnd: '12:00',
    discipline: 'board',
    format: 'individual',
    formatLabel: 'Индивидуальное занятие',
    level: 'Средний',
    price: 7000,
    message: '',
    status: 'accepted',
    createdAt: '25 апр, 14:00',
    isGuestBooking: false,
  },
  {
    id: 'l2',
    studentName: 'Татьяна Новикова',
    studentInitials: 'ТН',
    studentColor: 'mint',
    instructorId: 'aleksey',
    instructorName: 'Алексей Морозов',
    instructorInitials: 'АМ',
    instructorAvatarColor: 'ice',
    instructorSpec: 'Горные лыжи · Шерегеш',
    instructorRating: 4.9,
    dateISO: '2026-04-29',
    dayNum: '29', dayMon: 'апр',
    timeStart: '14:00', timeEnd: '14:45',
    discipline: 'ski',
    format: 'kids',
    formatLabel: 'Детское занятие',
    level: 'Дети',
    price: 2800,
    message: '',
    status: 'accepted',
    createdAt: '22 апр, 11:00',
    isGuestBooking: false,
  },

  // ────── Заявки к инструктору Алексею (isGuestBooking: false) ─────────────

  {
    id: 'req-roman',
    studentName: 'Роман Ефимов',
    studentInitials: 'РЕ',
    studentColor: 'ice',
    instructorId: 'aleksey',
    instructorName: 'Алексей Морозов',
    instructorInitials: 'АМ',
    instructorAvatarColor: 'ice',
    instructorSpec: 'Сноуборд · Шерегеш',
    instructorRating: 4.9,
    dateISO: '2026-04-28',
    dayNum: '28', dayMon: 'апр',
    timeStart: '10:00', timeEnd: '12:00',
    discipline: 'board',
    format: 'miniGroup',
    formatLabel: 'Мини-группа · 2 чел.',
    level: 'Новичок',
    groupSize: 2,
    price: 7000,
    message: 'Хотим с женой научиться с нуля. Можете взять сразу двоих? Снаряжение возьмём в прокате.',
    status: 'pending',
    createdAt: 'сегодня 11:42',
    isGuestBooking: false,
  },
  {
    id: 'req-anna',
    studentName: 'Анна Белова',
    studentInitials: 'АБ',
    studentColor: 'straw',
    instructorId: 'aleksey',
    instructorName: 'Алексей Морозов',
    instructorInitials: 'АМ',
    instructorAvatarColor: 'ice',
    instructorSpec: 'Горные лыжи · Шерегеш',
    instructorRating: 4.9,
    dateISO: '2026-04-30',
    dayNum: '30', dayMon: 'апр',
    timeStart: '09:00', timeEnd: '12:00',
    discipline: 'ski',
    format: 'individual',
    formatLabel: 'Индивидуальное занятие',
    level: 'Продвинутый',
    price: 10500,
    message: 'Хочу поработать над техникой карвинга на красных трассах.',
    status: 'pending',
    createdAt: 'вчера 19:05',
    isGuestBooking: false,
  },
  {
    id: 'req-mikhail',
    studentName: 'Михаил Орлов',
    studentInitials: 'МО',
    studentColor: 'purple',
    instructorId: 'aleksey',
    instructorName: 'Алексей Морозов',
    instructorInitials: 'АМ',
    instructorAvatarColor: 'ice',
    instructorSpec: 'Сноуборд · Шерегеш',
    instructorRating: 4.9,
    dateISO: '2026-05-01',
    dayNum: '1', dayMon: 'мая',
    timeStart: '11:00', timeEnd: '12:30',
    discipline: 'board',
    format: 'kids',
    formatLabel: 'Детское занятие',
    level: 'Дети · 8 лет',
    price: 2800,
    message: 'Сын первый раз на горе. Работаете с такими маленькими?',
    status: 'pending',
    createdAt: 'вчера 14:30',
    isGuestBooking: false,
  },
];

// ── Selectors ──────────────────────────────────────────────────────────────

/** Все брони текущего гостя */
export function getGuestBookings(): Booking[] {
  return BOOKINGS.filter(b => b.isGuestBooking);
}

/** Входящие заявки инструктора (все pending — и с платформы, и от гостей) */
export function getPendingRequests(instructorId: string): Booking[] {
  return BOOKINGS.filter(
    b => b.instructorId === instructorId && b.status === 'pending',
  );
}

/** Принятые/завершённые уроки инструктора */
export function getAcceptedLessons(instructorId: string): Booking[] {
  return BOOKINGS.filter(
    b => b.instructorId === instructorId &&
         (b.status === 'accepted' || b.status === 'completed'),
  );
}

/** Найти заявку по ID */
export function getBookingById(id: string): Booking | undefined {
  return BOOKINGS.find(b => b.id === id);
}

// ── Mutations ──────────────────────────────────────────────────────────────

let _nextId = 200;

export interface AddBookingParams {
  instructorId:          string;
  instructorName:        string;
  instructorInitials:    string;
  instructorAvatarColor: string;
  instructorSpec:        string;
  instructorRating:      number;
  date:                  Date;
  timeStart:             string;
  timeEnd:               string;
  format:                BookingFormat;
  formatLabel:           string;
  discipline:            BookingDiscipline;
  level:                 string;
  groupSize?:            number;
  price:                 number;
  message:               string;
}

export function addBooking(params: AddBookingParams): Booking {
  const booking: Booking = {
    id: `b-${_nextId++}`,
    studentName:     'Новый ученик',
    studentInitials: 'НУ',
    studentColor:    'ice',
    instructorId:          params.instructorId,
    instructorName:        params.instructorName,
    instructorInitials:    params.instructorInitials,
    instructorAvatarColor: params.instructorAvatarColor as Booking['instructorAvatarColor'],
    instructorSpec:        params.instructorSpec,
    instructorRating:      params.instructorRating,
    dateISO:    params.date.toISOString().slice(0, 10),
    dayNum:     String(params.date.getDate()),
    dayMon:     MONTH_SHORT[params.date.getMonth()],
    timeStart:  params.timeStart,
    timeEnd:    params.timeEnd,
    discipline:  params.discipline,
    format:      params.format,
    formatLabel: params.formatLabel,
    level:       params.level,
    groupSize:   params.groupSize,
    price:       params.price,
    message:     params.message,
    status:      'pending',
    createdAt:   nowLabel(),
    isGuestBooking: true,
  };

  BOOKINGS.push(booking);

  // Уведомление инструктору о новой заявке
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2, '0');
  const mm  = String(now.getMinutes()).padStart(2, '0');
  pushNotification({
    period: 'today',
    icon:   'niBooking',
    emoji:  'sparkles',
    text:   `Новая заявка на <strong>${booking.dayNum} ${booking.dayMon}</strong> — ${booking.formatLabel}`,
    time:   `${hh}:${mm}`,
    unread: true,
  });

  return booking;
}

export function acceptBooking(id: string): void {
  const b = BOOKINGS.find(b => b.id === id);
  if (b) b.status = 'accepted';
}

export function declineBooking(id: string): void {
  const b = BOOKINGS.find(b => b.id === id);
  if (b) b.status = 'declined';
}
