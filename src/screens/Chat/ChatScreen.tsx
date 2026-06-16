import { useEffect, useRef, useState } from 'react';
import styles from './ChatScreen.module.css';
import { useTranslation } from '@/i18n/useTranslation';
import { Icon } from '@/components/Icon/Icon';

// ── Types ──────────────────────────────────────────────────────────────────

type MsgType = 'text' | 'card';

interface Message {
  id: string;
  /** Stable sender identity — 'aleksey' for instructor, 'student' for guest */
  sender: string;
  type: MsgType;
  text?: string;
  time: string;
  ticks?: string;
  card?: {
    date: string;
    format: string;
    place: string;
    price: string;
    accepted?: boolean;
  };
}

interface DaySep { kind: 'sep'; label: string; id: string; }
type ChatItem = Message | DaySep;

// ── Constants ──────────────────────────────────────────────────────────────

const PREVIEW_LIMIT = 3;

/**
 * Стабильные идентификаторы отправителей (прототип).
 * Исходящее сообщение = msg.sender === currentUserId.
 */
const INSTR_ID   = 'aleksey'; // matches INSTRUCTORS[0].id
const STUDENT_ID = 'student';

/**
 * Определяет, содержит ли строка российский номер телефона.
 *
 * Поддерживаемые форматы:
 *   +79821231212   79821231212   89821231212   9821231212
 *   +7 982 123 12 12   7-982-123-12-12   8 (982) 123-12-12
 *   982 123 12 12   9821231212   и любые их комбинации
 *
 * Алгоритм:
 *   1. Ищем любые «числоподобные» куски текста (цифры + разделители +/-/( ))
 *   2. Вырываем только цифры из каждого куска
 *   3. Проверяем, является ли результат валидным RU-номером:
 *      — 10 цифр, начинается с 9  (мобильный без кода)
 *      — 11 цифр, начинается с 7 или 8
 */
function hasPhone(text: string): boolean {
  const chunks = text.match(/[\+\d][\d\s\-\(\)\.]{6,18}\d/g) ?? [];
  return chunks.some(chunk => {
    const d = chunk.replace(/\D/g, '');
    return (
      (d.length === 10 && d[0] === '9') ||
      (d.length === 11 && (d[0] === '7' || d[0] === '8'))
    );
  });
}

/** Парсит "14:35" → минуты от полуночи (для группировки сообщений). */
function toMin(t: string): number {
  const m = /(\d{1,2}):(\d{2})/.exec(t);
  return m ? (+m[1]) * 60 + (+m[2]) : 0;
}

/**
 * Русское склонение существительного по числу.
 * forms = [одно (1, 21…), два-четыре (2-4, 22-24…), много (0, 5-20, 25-30…)]
 *   plural(1,  …) → forms[0]   ·  plural(2,  …) → forms[1]
 *   plural(0,  …) → forms[2]   ·  plural(5,  …) → forms[2]
 *   plural(11, …) → forms[2]   ·  plural(21, …) → forms[0]
 */
function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const d = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (d === 1) return forms[0];
  if (d >= 2 && d <= 4) return forms[1];
  return forms[2];
}

/**
 * Истории переписки по chatId — у каждого собеседника свой диалог.
 *
 * sender: INSTR_ID = реплика инструктора, STUDENT_ID = реплика ученика/гостя.
 * Направление в UI определяется сравнением sender с currentUserId, поэтому
 * один и тот же массив корректно отображается с обеих сторон.
 *
 * Имена собеседников НЕ хардкодятся в тексте — обращения нейтральные/безымянные,
 * чтобы реплики оставались валидными для любого участника диалога.
 *
 * Содержание подобрано под дисциплину инструктора: сноубордисты говорят о доске
 * и парке, лыжники — о трассах, карвинге и детских занятиях.
 */

// ── Истории на стороне ГОСТЯ (собеседник = инструктор) ─────────────────────

// Алексей Морозов — сноуборд, мини-группа, заявка принята (ACCEPTED).
const HIST_ALEKSEY: ChatItem[] = [
  { kind: 'sep', label: '25 апреля', id: 'sep1' },
  { id: 'al1', sender: INSTR_ID,   type: 'text', text: 'Привет! Увидел вашу заявку — рад помочь с обучением 🏂 Вы совсем новички или уже пробовали кататься?', time: '14:12' },
  { id: 'al2', sender: STUDENT_ID, type: 'text', text: 'Привет! Мы с женой абсолютные новички, никогда не стояли на доске.', time: '14:15', ticks: '✓✓' },
  {
    id: 'al3', sender: INSTR_ID, type: 'card', time: '14:18',
    card: { date: '28 апреля, 10:00–12:00', format: 'Мини-группа (2 чел.)', place: 'Касса Шерегеш, вход А', price: '7 000 ₽' },
  },
  { id: 'al4', sender: STUDENT_ID, type: 'text', text: 'Отлично! Снаряжение нам нужно брать в аренду?', time: '14:31', ticks: '✓✓' },
  { id: 'al5', sender: INSTR_ID,   type: 'text', text: 'Да, помогу подобрать доску и ботинки в прокате на месте. Приходите за 20 минут до начала.', time: '14:35' },
  { kind: 'sep', label: 'Сегодня', id: 'sep2' },
  { id: 'al6', sender: STUDENT_ID, type: 'text', text: 'Добрый день! Всё в силе на завтра, 10:00?', time: '09:14', ticks: '✓✓' },
];

// Наталья Петрова — горные лыжи, детское занятие, заявка принята (ACCEPTED).
const HIST_NATALYA: ChatItem[] = [
  { kind: 'sep', label: 'Сегодня', id: 'sep1' },
  { id: 'na1', sender: STUDENT_ID, type: 'text', text: 'Здравствуйте! Хотим записать дочку на лыжное занятие в четверг.', time: '10:00', ticks: '✓✓' },
  { id: 'na2', sender: INSTR_ID,   type: 'text', text: 'Добрый день! Беру с радостью. Сколько лет ребёнку и есть ли опыт на лыжах?', time: '10:12' },
  { id: 'na3', sender: STUDENT_ID, type: 'text', text: 'Шесть лет, на лыжах первый раз.', time: '10:15', ticks: '✓✓' },
  { id: 'na4', sender: INSTR_ID,   type: 'text', text: 'Прекрасный возраст для старта! Начнём с пологого учебного склона, всё снаряжение поможем подобрать. 🎿', time: '10:18' },
];

// Дмитрий Захаров — инструктор, заявки нет (NONE) → режим превью.
const HIST_DMITRY_GUEST: ChatItem[] = [
  { kind: 'sep', label: '20 апреля', id: 'sep1' },
  { id: 'dg1', sender: STUDENT_ID, type: 'text', text: 'Здравствуйте! Подскажите, вы работаете с детьми? Сыну 7 лет, очень активный.', time: '11:05', ticks: '✓✓' },
  { id: 'dg2', sender: INSTR_ID,   type: 'text', text: 'Да, работаю с детьми от 6 лет, в том числе с гиперактивными — строю занятие через игру. Пишите, подберём время. 🎿', time: '11:20' },
];

// Марина Волкова — инструктор, заявки нет (NONE) → режим превью.
const HIST_MARINA_GUEST: ChatItem[] = [
  { kind: 'sep', label: '14 апреля', id: 'sep1' },
  { id: 'mg1', sender: STUDENT_ID, type: 'text', text: 'Добрый день! Хотела записаться на карвинг в эти выходные.', time: '16:40', ticks: '✓✓' },
  { id: 'mg2', sender: INSTR_ID,   type: 'text', text: 'Здравствуйте! К сожалению, эта дата уже занята. Могу предложить следующую субботу — напишите, подойдёт ли.', time: '17:02' },
];

// Сергей Лебедев — горные лыжи, фрирайд, заявка принята (ACCEPTED).
const HIST_SERGEY: ChatItem[] = [
  { kind: 'sep', label: '8 апреля', id: 'sep1' },
  { id: 'sg1', sender: STUDENT_ID, type: 'text', text: 'Добрый день! Хочу подтянуть технику на красных трассах, присматриваюсь к фрирайду.', time: '09:30', ticks: '✓✓' },
  { id: 'sg2', sender: INSTR_ID,   type: 'text', text: 'Отлично! Поработаем над ведением и закантовкой, потом выйдем на целину. Снаряжение своё или аренда?', time: '09:41' },
  { id: 'sg3', sender: STUDENT_ID, type: 'text', text: 'Своё, всё есть.', time: '09:44', ticks: '✓✓' },
  { id: 'sg4', sender: INSTR_ID,   type: 'text', text: 'Супер. Тогда жду вас в субботу у канатки! 🎿', time: '09:46' },
];

// ── Истории на стороне ИНСТРУКТОРА (собеседник = ученик/коллега) ───────────

// Роман Ефимов — ученик, сноуборд-фристайл, заявка ожидает (PENDING).
const HIST_ROMAN: ChatItem[] = [
  { kind: 'sep', label: 'Сегодня', id: 'sep1' },
  { id: 'rm1', sender: STUDENT_ID, type: 'text', text: 'Здравствуйте! Катаюсь второй сезон на сноуборде, хочу освоить прыжки в парке.', time: '13:50', ticks: '✓✓' },
  {
    id: 'rm2', sender: INSTR_ID, type: 'card', time: '14:05',
    card: { date: '28 апреля, 11:00–13:00', format: 'Индивидуально', place: 'Сектор Е, вход в парк', price: '5 000 ₽' },
  },
  { id: 'rm3', sender: STUDENT_ID, type: 'text', text: 'Подтверждаете завтра в 10:00?', time: '14:35', ticks: '✓✓' },
];

// Анна Белова — ученица, сноуборд, занятие подтверждено (ACCEPTED).
const HIST_ANNA: ChatItem[] = [
  { kind: 'sep', label: '12 апреля', id: 'sep1' },
  { id: 'an1', sender: STUDENT_ID, type: 'text', text: 'Спасибо за прошлое занятие! Хочу закрепить повороты на заднем канте.', time: '11:50', ticks: '✓✓' },
  { id: 'an2', sender: INSTR_ID,   type: 'text', text: 'Отлично, продолжим с этого. В четверг в 10:00 на том же месте?', time: '12:00' },
  { id: 'an3', sender: STUDENT_ID, type: 'text', text: 'Да, всё отлично! Жду четверга 🏂', time: '12:08', ticks: '✓✓' },
];

// Михаил Орлов — ученик, сноуборд, заявка отклонена (DECLINED).
const HIST_MIKHAIL: ChatItem[] = [
  { kind: 'sep', label: 'вчера', id: 'sep1' },
  { id: 'mk1', sender: STUDENT_ID, type: 'text', text: 'Здравствуйте! Возьмёте ребёнка 5 лет на сноуборд?', time: '18:20', ticks: '✓✓' },
  { id: 'mk2', sender: INSTR_ID,   type: 'text', text: 'К сожалению, на сноуборд беру детей с 8 лет. Для пятилетки безопаснее начать с лыж.', time: '18:35' },
];

// Кирилл Волков — ученик, сноуборд, занятие подтверждено (ACCEPTED).
const HIST_KIRILL: ChatItem[] = [
  { kind: 'sep', label: '10 апреля', id: 'sep1' },
  { id: 'kr1', sender: STUDENT_ID, type: 'text', text: 'Можем перенести занятие на понедельник? В выходные не получается.', time: '19:10', ticks: '✓✓' },
  { id: 'kr2', sender: INSTR_ID,   type: 'text', text: 'Конечно, понедельник 14:00 свободен — записал вас.', time: '19:22' },
  { id: 'kr3', sender: STUDENT_ID, type: 'text', text: 'Тогда увидимся в понедельник 👍', time: '19:25', ticks: '✓✓' },
];

// Дмитрий Захаров — коллега-инструктор (NONE).
const HIST_DMITRY_COLL: ChatItem[] = [
  { kind: 'sep', label: 'Сегодня', id: 'sep1' },
  { id: 'dc1', sender: STUDENT_ID, type: 'text', text: 'Кинул методичку по работе с СДВГ, посмотри на досуге.', time: '13:20', ticks: '✓✓' },
  { id: 'dc2', sender: INSTR_ID,   type: 'text', text: 'О, спасибо! Как раз есть пара таких ребят в группе — изучу.', time: '13:31' },
];

// Марина Волкова — коллега-инструктор (NONE).
const HIST_MARINA_COLL: ChatItem[] = [
  { kind: 'sep', label: 'вчера', id: 'sep1' },
  { id: 'mc1', sender: STUDENT_ID, type: 'text', text: 'Как успехи с тем сложным учеником?', time: '16:00', ticks: '✓✓' },
  { id: 'mc2', sender: INSTR_ID,   type: 'text', text: 'Спасибо большое за совет — стало гораздо лучше, заходит через боковое соскальзывание.', time: '16:12' },
];

// Татьяна Новикова — ученица, детское занятие (ACCEPTED).
const HIST_TATYANA: ChatItem[] = [
  { kind: 'sep', label: '22 апреля', id: 'sep1' },
  { id: 'ta1', sender: STUDENT_ID, type: 'text', text: 'Дочка в восторге от занятия, спасибо большое!', time: '17:40', ticks: '✓✓' },
  { id: 'ta2', sender: INSTR_ID,   type: 'text', text: 'Очень рад! Равновесие держит уже уверенно — приходите ещё. 🏂', time: '17:52' },
];

// Игорь Соколов — коллега-инструктор (NONE).
const HIST_IGOR: ChatItem[] = [
  { kind: 'sep', label: '21 апреля', id: 'sep1' },
  { id: 'ig1', sender: STUDENT_ID, type: 'text', text: 'Привет! Можешь поделиться шаблоном программы для новичков?', time: '12:15', ticks: '✓✓' },
  { id: 'ig2', sender: INSTR_ID,   type: 'text', text: 'Привет! Конечно, скину вечером свой план на первые три занятия.', time: '12:28' },
];

// Елена Соболева — ученица (ACCEPTED).
const HIST_ELENA: ChatItem[] = [
  { kind: 'sep', label: '19 апреля', id: 'sep1' },
  { id: 'el1', sender: STUDENT_ID, type: 'text', text: 'Очень понравилось занятие, запишусь ещё!', time: '15:30', ticks: '✓✓' },
  { id: 'el2', sender: INSTR_ID,   type: 'text', text: 'Спасибо! Буду рад продолжить — напишите, когда удобно.', time: '15:41' },
];

// Андрей Павлов — ученик (ACCEPTED).
const HIST_ANDREY: ChatItem[] = [
  { kind: 'sep', label: '15 апреля', id: 'sep1' },
  { id: 'ad1', sender: STUDENT_ID, type: 'text', text: 'Можем в субботу утром?', time: '09:50', ticks: '✓✓' },
  { id: 'ad2', sender: INSTR_ID,   type: 'text', text: 'Хорошо, тогда жду в субботу в 10:00.', time: '10:03' },
];

// Ольга Кузнецова — коллега-инструктор (NONE).
const HIST_OLGA: ChatItem[] = [
  { kind: 'sep', label: '12 апреля', id: 'sep1' },
  { id: 'ol1', sender: STUDENT_ID, type: 'text', text: 'Можешь подменить меня в субботу? У меня клиент сорвался.', time: '14:20', ticks: '✓✓' },
  { id: 'ol2', sender: INSTR_ID,   type: 'text', text: 'Посмотрю расписание и отпишусь к вечеру.', time: '14:35' },
];

// Виктор Соколов — ученик (ACCEPTED).
const HIST_VIKTOR: ChatItem[] = [
  { kind: 'sep', label: '10 апреля', id: 'sep1' },
  { id: 'vk1', sender: STUDENT_ID, type: 'text', text: 'Отличное занятие, спасибо!', time: '13:00', ticks: '✓✓' },
  { id: 'vk2', sender: INSTR_ID,   type: 'text', text: 'Спасибо вам! Прогресс заметный — до встречи на следующем. 🏂', time: '13:14' },
];

// Запасной диалог для новых/неизвестных чатов (нейтральный, безымянный).
const HIST_DEFAULT: ChatItem[] = [
  { kind: 'sep', label: 'Сегодня', id: 'sep1' },
  { id: 'df1', sender: STUDENT_ID, type: 'text', text: 'Здравствуйте! Хотел бы записаться на занятие.', time: '10:00', ticks: '✓✓' },
  { id: 'df2', sender: INSTR_ID,   type: 'text', text: 'Добрый день! Конечно — расскажите про ваш уровень, подберём программу.', time: '10:11' },
];

const GUEST_HISTORIES: Record<string, ChatItem[]> = {
  aleksey: HIST_ALEKSEY,
  natalya: HIST_NATALYA,
  dmitry:  HIST_DMITRY_GUEST,
  marina:  HIST_MARINA_GUEST,
  sergey:  HIST_SERGEY,
};

const INSTR_HISTORIES: Record<string, ChatItem[]> = {
  roman:   HIST_ROMAN,
  anna:    HIST_ANNA,
  mikhail: HIST_MIKHAIL,
  kirill:  HIST_KIRILL,
  dmitry:  HIST_DMITRY_COLL,
  marina:  HIST_MARINA_COLL,
  tatyana: HIST_TATYANA,
  igor:    HIST_IGOR,
  elena:   HIST_ELENA,
  andrey:  HIST_ANDREY,
  olga:    HIST_OLGA,
  viktor:  HIST_VIKTOR,
};

// ── Кэш историй (живёт всю сессию) ─────────────────────────────────────────
// Ключ: `${role}:${chatId}` — один и тот же id (например, dmitry/marina)
// может встречаться и у гостя (как инструктор), и у инструктора (как коллега),
// поэтому роль входит в ключ, чтобы истории не пересекались.
const HISTORY_CACHE = new Map<string, ChatItem[]>();

function getOrInitHistory(chatId?: string, role: 'instructor' | 'guest' = 'guest'): ChatItem[] {
  const id = chatId ?? '__default';
  const cacheKey = `${role}:${id}`;
  if (!HISTORY_CACHE.has(cacheKey)) {
    const table = role === 'instructor' ? INSTR_HISTORIES : GUEST_HISTORIES;
    const initial = table[id] ?? HIST_DEFAULT;
    HISTORY_CACHE.set(cacheKey, [...initial]);
  }
  return HISTORY_CACHE.get(cacheKey)!;
}

const QUICK_REPLIES = [
  'Аренда снаряжения?',
  'Как добраться?',
  'Можно перенести?',
  'До встречи 👋',
];

// ── Props ──────────────────────────────────────────────────────────────────

export type BookingStatus = 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';

interface ChatScreenProps {
  onBack: () => void;
  onProfile?: () => void;
  onBook?: () => void;
  bookingStatus?: BookingStatus;   // default: 'PENDING'
  instructorPhone?: string;
  personName?: string;
  personInitials?: string;
  personAvColor?: string;          // 'ice' | 'mint' | 'blue' | 'straw' | 'purple' | 'coral'
  /** Роль текущего пользователя. Определяет sender новых сообщений и направление истории. */
  role?: 'instructor' | 'guest';  // default: 'guest'
  onAcceptBooking?: () => void;    // инструктор принимает заявку из чата
  onDeclineBooking?: () => void;   // инструктор отклоняет заявку из чата
  /** Ключ истории в HISTORY_CACHE: instructorId (гость) или bookingId (инструктор). */
  chatId?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * Экран приватного чата.
 * Preview-режим: максимум 3 исходящих сообщения суммарно (включая INITIAL),
 * затем — стена с кнопкой «Записаться».
 * Фильтр: телефонные номера блокируются до записи.
 * DECLINED: чат закрыт, показывается баннер «Заявка отклонена».
 * ACCEPTED: полный чат, кнопка «Позвонить» активна.
 *
 * Направление сообщения определяется через sender:
 *   msg.sender === currentUserId → исходящее (справа, голубое)
 *   иначе                        → входящее  (слева, серое)
 */
export function ChatScreen({
  onBack,
  onProfile,
  onBook,
  bookingStatus = 'PENDING',
  instructorPhone,
  personName = 'Собеседник',
  personInitials = '?',
  personAvColor = 'ice',
  role = 'guest',
  onAcceptBooking,
  onDeclineBooking,
  chatId,
}: ChatScreenProps) {
  const { t } = useTranslation();

  /**
   * ID текущего пользователя:
   *   instructor → INSTR_ID ('aleksey')
   *   guest      → STUDENT_ID ('student')
   *
   * Используется для определения направления каждого сообщения.
   */
  const currentUserId = role === 'instructor' ? INSTR_ID : STUDENT_ID;
  const isInstructor  = role === 'instructor';

  const [items, setItems] = useState<ChatItem[]>(() => getOrInitHistory(chatId, role));
  const [inputVal, setInputVal] = useState('');
  const [bookingVisible, setBookingVisible] = useState(true);
  const [typing, setTyping] = useState(false);
  // Если бронирование уже принято — карточка предложения сразу в состоянии «Принято»
  const [cardAccepted, setCardAccepted] = useState(() => bookingStatus === 'ACCEPTED');
  const [phoneBlocked, setPhoneBlocked] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Считаем только сообщения, отправленные текущим пользователем
  const outMsgCount = items.filter(
    i => !('kind' in i) && (i as Message).sender === currentUserId
  ).length;

  // ── Единственный источник истины для «Подтверждено» ──────────────────────
  // confirmed === true → превью завершено, замок звонка снят, контакт открыт.
  // Учитывает и проп bookingStatus (гость), и локальное принятие инструктором
  // (cardAccepted), чтобы обе стороны разблокировались без рассинхрона.
  const confirmed = bookingStatus === 'ACCEPTED' || cardAccepted;
  const isDeclined = bookingStatus === 'DECLINED';
  // PENDING значит заявка уже отправлена — превью не исчерпывается, гость может писать свободно.
  // CANCELLED — гость отменил заявку: превью возобновляется как при NONE.
  const hasActiveBooking = confirmed || bookingStatus === 'PENDING';
  // Preview restrictions apply only to guest side; instructors always have full access
  const previewExhausted = !isInstructor && !hasActiveBooking && outMsgCount >= PREVIEW_LIMIT;
  const remaining = Math.max(0, PREVIEW_LIMIT - outMsgCount);

  function fireToast(msg: string) {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2500);
  }

  // Кнопка «вниз» появляется, когда прокрутили вверх больше чем на один экран
  function handleScroll() {
    const el = messagesRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > el.clientHeight);
  }

  function scrollToBottom() {
    const el = messagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }

  function handleCall() {
    if (!confirmed) {
      fireToast('📞 Звонок откроется после подтверждения заявки');
      return;
    }
    const phone = instructorPhone ?? '+79000000000';
    window.location.href = phone.startsWith('tel:') ? phone : `tel:${phone}`;
  }

  // Синхронизируем кэш истории при каждом изменении items
  useEffect(() => {
    HISTORY_CACHE.set(`${role}:${chatId ?? '__default'}`, items);
  }, [chatId, role, items]);

  // Scroll to bottom
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items, typing, previewExhausted]);

  function sendMsg(text?: string) {
    if (previewExhausted || isDeclined) return;
    const msg = (text ?? inputVal).trim();
    if (!msg) return;

    // Phone filter
    if (hasPhone(msg)) {
      setPhoneBlocked(true);
      return;
    }
    setPhoneBlocked(false);

    const newMsg: Message = {
      id: `m${Date.now()}`,
      sender: currentUserId,   // ← роль определяет отправителя
      type: 'text',
      text: msg,
      time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
      ticks: '✓',
    };
    setItems(prev => [...prev, newMsg]);
    setInputVal('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Typing indicator: show for 2-3 seconds after user sends a message
    setTyping(true);
    setTimeout(() => setTyping(false), 2500);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMsg();
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  return (
    <div className={styles.screen}>
      {/* ── Top bar ── */}
      <div className={styles.chatTop}>
        <button className={styles.tbBack} onClick={onBack} aria-label="Назад">‹</button>
        <div className={styles.avatarWrap}>
          <div className={`${styles.av} ${styles.avSm} ${styles[`av-${personAvColor}`]}`}>{personInitials}</div>
          <div className={styles.onlineDot} />
        </div>
        <div className={styles.ctInfo}>
          <div className={styles.ctName}>{personName}</div>
          <div className={styles.ctStatus}>{t('chat.online')} · Шерегеш</div>
        </div>
        <div className={styles.ctActions}>
          {onProfile && (
            <button className={styles.ctBtn} onClick={onProfile} aria-label="Профиль">
              <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/></svg>
            </button>
          )}
          <button
            className={styles.ctBtn}
            aria-label="Позвонить"
            onClick={handleCall}
            style={!confirmed ? { opacity: 0.3 } : undefined}
          >
            <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.22 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.46-.46a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>
          </button>
        </div>
      </div>

      {/* ── Booking strip ── */}
      {bookingVisible && !isDeclined && (
        <div className={styles.bookingStrip}>
          <div className={styles.bsLeft}>
            <div className={styles.bsIcon}><Icon name="calendar" /></div>
            <div>
              <div className={styles.bsTitle}>{t('chat.bookingRequest')}</div>
              <div className={styles.bsSub}>28 апр · 10:00 · 2 ч · 7 000 ₽</div>
            </div>
          </div>
          <button className={styles.bsClose} onClick={() => setBookingVisible(false)}>✕</button>
        </div>
      )}

      {/* ── Preview banner (while not exhausted and not accepted/pending) ── */}
      {!hasActiveBooking && !isDeclined && !previewExhausted && outMsgCount > 0 && (
        <div className={styles.previewBanner}>
          <span className={styles.previewBannerText}>
            Предпросмотр: осталось {remaining} {plural(remaining, ['сообщение', 'сообщения', 'сообщений'])}
          </span>
        </div>
      )}

      {/* ── DECLINED banner ── */}
      {isDeclined ? (
        <div className={styles.declinedBanner}>
          <div className={styles.declinedIcon}>✕</div>
          <div className={styles.declinedTitle}>Заявка отклонена</div>
          <div className={styles.declinedSub}>
            Инструктор не смог принять запрос. Попробуйте найти другого специалиста в каталоге.
          </div>
          <button className={styles.declinedBtn} onClick={onBack}>
            Найти другого →
          </button>
        </div>
      ) : (
        <>
          {/* ── Messages ── */}
          <div className={styles.messages} ref={messagesRef} onScroll={handleScroll}>
            {items.map((item, idx) => {
              if ('kind' in item) {
                return (
                  <div key={item.id} className={styles.daySepWrap}>
                    <span className={styles.daySep}>{item.label}</span>
                  </div>
                );
              }

              const msg = item as Message;

              /**
               * Направление: sender === currentUserId → исходящее (справа).
               * Нет никакого «переворота» — каждый видит своё справа.
               */
              const dir: 'in' | 'out' = msg.sender === currentUserId ? 'out' : 'in';

              // ── Группировка: одинаковый отправитель в пределах 5 минут ──
              const prev = items[idx - 1];
              const next = items[idx + 1];
              const prevMsg = prev && !('kind' in prev) ? prev as Message : undefined;
              const nextMsg = next && !('kind' in next) ? next as Message : undefined;
              const isText = msg.type !== 'card';
              const groupWith = (o?: Message) =>
                !!o && isText && o.type !== 'card' &&
                o.sender === msg.sender &&
                Math.abs(toMin(o.time) - toMin(msg.time)) <= 5;
              const groupedPrev   = groupWith(prevMsg);
              const isLastInGroup = !groupWith(nextMsg);

              if (msg.type === 'card' && msg.card) {
                // Карточка от инструктора (sender === INSTR_ID).
                // Для инструктора — его карточка → справа (out).
                // Для гостя — карточка инструктора → слева (in).
                const cardDir: 'in' | 'out' = msg.sender === currentUserId ? 'out' : 'in';
                return (
                  <div key={msg.id} className={`${styles.mrow} ${cardDir === 'out' ? styles.mrowOut : ''}`}>
                    {cardDir === 'in' && (
                      <div className={`${styles.av} ${styles.avSm} ${styles[`av-${personAvColor}`]}`}>{personInitials}</div>
                    )}
                    <div>
                      <div className={styles.cardBubble}>
                        <div className={styles.cbHead}>
                          <div className={styles.cbHeadT}><Icon name="file-text" size={13} /> {t('chat.lessonProposal')}</div>
                        </div>
                        <div className={styles.cbBody}>
                          <div className={styles.cbRow}><span>{t('chat.date')}</span><span>{msg.card.date}</span></div>
                          <div className={styles.cbRow}><span>{t('chat.format')}</span><span>{msg.card.format}</span></div>
                          <div className={styles.cbRow}><span>{t('chat.place')}</span><span>{msg.card.place}</span></div>
                          <div className={`${styles.cbRow} ${styles.cbRowPrice}`}>
                            <span>{t('chat.cost')}</span>
                            <span className={styles.cbPrice}>{msg.card.price}</span>
                          </div>
                        </div>
                        {isInstructor ? (
                          // ── Инструктор: принять / отклонить ──────────────
                          confirmed ? (
                            <div className={`${styles.cbActions} ${styles.cbAcceptedLabel}`}>
                              ✓ {t('chat.accepted')}
                            </div>
                          ) : (
                            <div className={styles.cbActions}>
                              <button
                                className={`${styles.cbBtn} ${styles.cbAccept}`}
                                onClick={() => {
                                  setCardAccepted(true);
                                  onAcceptBooking?.();
                                  fireToast('✓ Заявка принята');
                                }}
                              >
                                ✓ Принять
                              </button>
                              <button
                                className={`${styles.cbBtn} ${styles.cbDecline}`}
                                onClick={() => {
                                  onDeclineBooking?.();
                                  fireToast('Заявка отклонена');
                                  onBack();
                                }}
                              >
                                Отказать
                              </button>
                            </div>
                          )
                        ) : (
                          // ── Гость: только статус, без кнопок действий ────
                          // (DECLINED уже перехвачен внешним баннером выше)
                          <div className={styles.cbGuestStatus}>
                            {confirmed
                              ? <span className={styles.cbStatusOk}>✓ Подтверждено</span>
                              : <span className={styles.cbStatusWait}>⏳ Ожидает подтверждения</span>
                            }
                          </div>
                        )}
                      </div>
                      <span className={styles.mt}>{msg.time}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`${styles.mrow} ${dir === 'out' ? styles.mrowOut : ''} ${groupedPrev ? styles.mrowGrouped : ''}`}>
                  {dir === 'in' && (
                    // Аватар собеседника — только у последнего сообщения в группе.
                    // У сгруппированных сверху — невидимый спейсер для выравнивания.
                    isLastInGroup ? (
                      <div className={`${styles.av} ${styles.avSm} ${styles[`av-${personAvColor}`]}`}>
                        {personInitials}
                      </div>
                    ) : (
                      <div className={styles.avSpacer} />
                    )
                  )}
                  <div>
                    <div className={`${styles.bubble} ${dir === 'in' ? styles.bubbleIn : styles.bubbleOut} ${isLastInGroup ? styles.bubbleTail : ''}`}>
                      {msg.text}
                      <span className={styles.bubbleTime}>{msg.time}{msg.ticks ? ` ${msg.ticks}` : ''}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typing && !previewExhausted && (
              <div className={styles.mrow}>
                <div className={`${styles.av} ${styles.avSm} ${styles[`av-${personAvColor}`]}`}>
                  {personInitials}
                </div>
                <div className={styles.typingBubble}>
                  <div className={styles.td} /><div className={styles.td} /><div className={styles.td} />
                </div>
              </div>
            )}

            {/* Preview wall */}
            {previewExhausted && (
              <div className={styles.previewWall}>
                <div className={styles.previewWallIcon}><Icon name="lock" size={32} /></div>
                <div className={styles.previewWallTitle}>Предпросмотр завершён</div>
                <div className={styles.previewWallSub}>
                  Запишитесь на занятие, чтобы продолжить общение с инструктором
                </div>
                {onBook && (
                  <button className={styles.previewWallBtn} onClick={onBook}>
                    Записаться →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Scroll-to-bottom button ── */}
          {showScrollBtn && !previewExhausted && (
            <button
              className={styles.scrollBtn}
              onClick={scrollToBottom}
              aria-label="Вниз"
            >
              <Icon name="arrow-down" size={18} />
            </button>
          )}

          {/* ── Quick replies ── */}
          {!previewExhausted && (
            <div className={styles.quickReplies}>
              {QUICK_REPLIES.map(qr => (
                <button key={qr} className={styles.qr} onClick={() => sendMsg(qr)}>
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* ── Phone warning ── */}
          {phoneBlocked && (
            <div className={styles.phoneWarning}>
              📵 Обмен контактами недоступен до записи на занятие
              <button className={styles.phoneWarningClose} onClick={() => setPhoneBlocked(false)}>✕</button>
            </div>
          )}

          {/* ── Input ── */}
          {previewExhausted ? (
            <div className={styles.lockedBar}>
              <div className={styles.lockedBarText}><Icon name="lock" size={14} /> Запишитесь, чтобы продолжить переписку</div>
              {onBook && (
                <button className={styles.lockedBarBtn} onClick={onBook}>Записаться</button>
              )}
            </div>
          ) : (
            <div className={styles.inputWrap}>
              <>
              <input
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                id="chat-attach"
                onChange={e => {
                  if (e.target.files?.[0]) {
                    const name = e.target.files[0].name;
                    fireToast('📎 Прикреплён: ' + name);
                    e.target.value = '';
                  }
                }}
              />
              <button
                className={styles.attachBtn}
                aria-label="Прикрепить"
                onClick={() => document.getElementById('chat-attach')?.click()}
              >
                <svg viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
              </button>
              </>
              <textarea
                ref={textareaRef}
                className={styles.chatInput}
                placeholder={t('chat.placeholder')}
                rows={1}
                value={inputVal}
                onChange={e => {
                  setInputVal(e.target.value);
                  autoResize(e.target);
                  if (phoneBlocked) setPhoneBlocked(false);
                }}
                onKeyDown={handleKeyDown}
              />
              <button className={styles.sendBtn} onClick={() => sendMsg()} aria-label="Отправить">
                <svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
              </button>
            </div>
          )}
        </>
      )}

      {showToast && (
        <div className={styles.toast} onClick={() => setShowToast(null)}>
          {showToast}
        </div>
      )}
    </div>
  );
}
