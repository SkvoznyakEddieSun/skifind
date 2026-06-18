// ── Shared master-class data ───────────────────────────────────────────────
// Единый источник данных для каталога и деталей МК.

export type McLevel = 'beginner' | 'advanced' | 'all';
export type McSport = 'ski' | 'board';
export type McAvatarColor = 'ice' | 'mint' | 'purple' | 'straw' | 'blue';
export type McLevelColor  = 'mint' | 'straw' | 'purple';

// ── Participant registry ───────────────────────────────────────────────────
// Используется для отображения имён/аватаров в списке участников (инструктор).

export interface McParticipant {
  name:     string;
  initials: string;
  color:    McAvatarColor;
}

export const MC_PARTICIPANTS: Record<string, McParticipant> = {
  roman:    { name: 'Роман Ефимов',     initials: 'РЕ', color: 'ice'    },
  anna:     { name: 'Анна Краснова',    initials: 'АК', color: 'mint'   },
  kirill:   { name: 'Кирилл Волков',    initials: 'КВ', color: 'straw'  },
  maria:    { name: 'Мария Смирнова',   initials: 'МС', color: 'purple' },
  igor:     { name: 'Игорь Петров',     initials: 'ИП', color: 'blue'   },
  olga:     { name: 'Ольга Дмитриева',  initials: 'ОД', color: 'mint'   },
  pavel:    { name: 'Павел Соколов',    initials: 'ПС', color: 'straw'  },
  natalia:  { name: 'Наталья Иванова',  initials: 'НИ', color: 'ice'    },
  dmitr_v:  { name: 'Дмитрий Волков',   initials: 'ДВ', color: 'blue'   },
  elena:    { name: 'Елена Попова',     initials: 'ЕП', color: 'mint'   },
  alexey_k: { name: 'Алексей Козлов',   initials: 'АК', color: 'straw'  },
  inna:     { name: 'Инна Новикова',    initials: 'ИН', color: 'purple' },
  boris:    { name: 'Борис Морозов',    initials: 'БМ', color: 'ice'    },
  yulia:    { name: 'Юлия Соколова',    initials: 'ЮС', color: 'mint'   },
  sergei_p: { name: 'Сергей Попов',     initials: 'СП', color: 'straw'  },
  vitaly:   { name: 'Виталий Зайцев',   initials: 'ВЗ', color: 'ice'    },
  guest:    { name: 'Вы',              initials: 'ГО', color: 'ice'    },
};

// ── Interface ─────────────────────────────────────────────────────────────

export interface MasterClass {
  id: string;
  title: string;
  sport: McSport;
  level: McLevel;
  levelLabel: string;
  levelColor: McLevelColor;
  instructorId: string;
  instructorName: string;
  instructorInitials: string;
  instructorAvatarColor: McAvatarColor;
  instructorRating: number;
  weekday: string;          // 'сб'
  date: string;             // '17 мая'
  time: string;             // '11:00 — 13:00'
  location: string;
  price: number;
  maxParticipants: number;
  minParticipants: number;  // если не наберётся — МК отменяется
  /** Массив ID участников. participants.length === текущее число записавшихся */
  participants: string[];
  description: string;
  bookingDeadlineHours: number; // за сколько часов до события закрывается запись
  eventDateISO: string;         // ISO timestamp события (для расчёта дедлайна)
}

// ── Mock data ─────────────────────────────────────────────────────────────
// Даты вычисляются ОТНОСИТЕЛЬНО сегодня (new Date()), чтобы мок-МК всегда
// были предстоящими и не протухали со временем. Дисплейные строки
// (weekday/date) тоже выводятся из этой же даты — без расхождений.

const _WD  = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const _MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

/** Поля даты МК относительно сегодня.
 *  offsetDays — смещение в днях (отрицательное = прошедший МК),
 *  startHHMM  — час начала ('11:00'); фиксируется в eventDateISO для дедлайна. */
function relDate(offsetDays: number, startHHMM: string) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const [h, m] = startHHMM.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return {
    weekday:      _WD[d.getDay()],
    date:         `${d.getDate()} ${_MON[d.getMonth()]}`,
    eventDateISO: d.toISOString(),
  };
}

const _mc1 = relDate(2, '11:00');  // через 2 дня — открыт
const _mc2 = relDate(4, '10:00');  // через 4 дня — открыт
const _mc3 = relDate(7, '14:00');  // через 7 дней — открыт
const _mc4 = relDate(-3, '12:00'); // 3 дня назад — «Запись закрыта»

export const MASTER_CLASSES: MasterClass[] = [
  {
    id: 'mc1',
    title: 'Техника карвинга',
    sport: 'ski',
    level: 'advanced',
    levelLabel: 'Продвинутые',
    levelColor: 'straw',
    instructorId: 'aleksey',
    instructorName: 'Алексей Морозов',
    instructorInitials: 'АМ',
    instructorAvatarColor: 'ice',
    instructorRating: 4.9,
    weekday: _mc1.weekday,
    date: _mc1.date,
    time: '11:00 — 13:00',
    location: 'Касса Шерегеш, вход А',
    price: 3500,
    maxParticipants: 12,
    minParticipants: 4,
    // 8 участников — все >= minParticipants, группа подтверждена
    participants: ['roman', 'anna', 'kirill', 'maria', 'igor', 'olga', 'pavel', 'natalia'],
    bookingDeadlineHours: 12,
    eventDateISO: _mc1.eventDateISO, // через 2 дня — запись открыта
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
    instructorId: 'dmitry',
    instructorName: 'Дмитрий Захаров',
    instructorInitials: 'ДЗ',
    instructorAvatarColor: 'purple',
    instructorRating: 4.7,
    weekday: _mc2.weekday,
    date: _mc2.date,
    time: '10:00 — 12:30',
    location: 'Склон Е2, Шерегеш',
    price: 2800,
    maxParticipants: 10,
    minParticipants: 3,
    // 5 участников
    participants: ['dmitr_v', 'elena', 'alexey_k', 'inna', 'boris'],
    bookingDeadlineHours: 12,
    eventDateISO: _mc2.eventDateISO, // через 4 дня — запись открыта
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
    instructorId: 'sergey',
    instructorName: 'Сергей Лебедев',
    instructorInitials: 'СЛ',
    instructorAvatarColor: 'blue',
    instructorRating: 5.0,
    weekday: _mc3.weekday,
    date: _mc3.date,
    time: '14:00 — 16:00',
    location: 'Сноупарк Шерегеш',
    price: 4200,
    maxParticipants: 8,
    minParticipants: 3,
    // 3 участника — ровно minParticipants, группа подтверждена
    participants: ['yulia', 'sergei_p', 'vitaly'],
    bookingDeadlineHours: 12,
    eventDateISO: _mc3.eventDateISO, // через 7 дней — запись открыта
    description:
      'Работа с кикерами и боксами: заход, отрыв, базовые грэбы, корректное приземление. Разберём ошибки в замедленной съёмке. Нужен опыт катания не менее 2 сезонов.',
  },
  {
    id: 'mc4',
    title: 'Базовая техника на синих склонах',
    sport: 'ski',
    level: 'beginner',
    levelLabel: 'Начинающие',
    levelColor: 'mint',
    instructorId: 'natalya',
    instructorName: 'Наталья Петрова',
    instructorInitials: 'НП',
    instructorAvatarColor: 'mint',
    instructorRating: 4.8,
    weekday: _mc4.weekday,
    date: _mc4.date,
    time: '12:00 — 14:00',
    location: 'Учебный склон, Шерегеш',
    price: 2500,
    maxParticipants: 10,
    minParticipants: 3,
    // 4 участника
    participants: ['elena', 'boris', 'inna', 'olga'],
    bookingDeadlineHours: 12,
    eventDateISO: _mc4.eventDateISO, // 3 дня назад — запись закрыта (демо состояния)
    description:
      'Уверенное прохождение синих трасс: контроль скорости, плуг и первые параллельные повороты, безопасное торможение. Для тех, кто уже встал на лыжи и хочет закрепить базу.',
  },
];
