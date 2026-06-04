export interface LessonRecord {
  id: string;
  date: string;       // "24 апр"
  discipline: 'ski' | 'board';
  timeStart: string;
  timeEnd: string;
  topic: string;
  instructorNote?: string;
  rating?: number;    // оценка от ученика 1–5
}

export interface StudentProfile {
  id: string;
  name: string;
  initials: string;
  avColor: string;
  role: 'ученик' | 'ученица';
  since: string;      // "март 2024"
  phone?: string;
  disciplines: string[];
  level: string;
  totalHours: number;
  about?: string;     // заметки инструктора (приватно)
  history: LessonRecord[];
}

const PROFILES: StudentProfile[] = [
  // ── Роман Ефимов — новый запрос, занятий ещё не было ──────────────────────
  {
    id: 'roman',
    name: 'Роман Ефимов',
    initials: 'РЕ',
    avColor: 'coral',
    role: 'ученик',
    since: 'апрель 2026',
    disciplines: ['Сноуборд'],
    level: 'Новичок',
    totalHours: 0,
    about: 'Хочет записаться с женой, оба с нуля',
    history: [],
  },

  // ── Анна Белова — 2 занятия, ждёт четверга ────────────────────────────────
  {
    id: 'anna',
    name: 'Анна Белова',
    initials: 'АБ',
    avColor: 'purple',
    role: 'ученица',
    since: 'март 2026',
    phone: '+7 905 123 45 67',
    disciplines: ['Сноуборд'],
    level: 'Средний',
    totalHours: 4,
    about: 'Быстро прогрессирует, хорошо чувствует доску',
    history: [
      {
        id: 'ab-2',
        date: '18 апр',
        discipline: 'board',
        timeStart: '11:00',
        timeEnd: '13:00',
        topic: 'Параллельные повороты',
        instructorNote: 'Хорошо держит кант, работаем над загрузкой',
        rating: 5,
      },
      {
        id: 'ab-1',
        date: '11 апр',
        discipline: 'board',
        timeStart: '10:00',
        timeEnd: '12:00',
        topic: 'Базовые повороты, стойка',
        instructorNote: 'Первое занятие — схватывает быстро',
        rating: 5,
      },
    ],
  },

  // ── Михаил Орлов — 5 занятий, сноуборд ───────────────────────────────────
  {
    id: 'mikhail',
    name: 'Михаил Орлов',
    initials: 'МО',
    avColor: 'straw',
    role: 'ученик',
    since: 'февраль 2026',
    phone: '+7 925 567 89 01',
    disciplines: ['Сноуборд'],
    level: 'Средний',
    totalHours: 10,
    about: 'Работает с детьми отдельно, занимается сам по выходным',
    history: [
      {
        id: 'mo-5',
        date: '20 апр',
        discipline: 'board',
        timeStart: '09:00',
        timeEnd: '11:00',
        topic: 'Карвинг на крутяке',
        rating: 4,
      },
      {
        id: 'mo-4',
        date: '5 апр',
        discipline: 'board',
        timeStart: '10:00',
        timeEnd: '12:00',
        topic: 'Освоение бугров',
        instructorNote: 'Боится бугров, нужно больше практики',
        rating: 4,
      },
      {
        id: 'mo-3',
        date: '22 мар',
        discipline: 'board',
        timeStart: '10:00',
        timeEnd: '12:00',
        topic: 'Прыжки с малого трамплина',
        rating: 5,
      },
      {
        id: 'mo-2',
        date: '8 мар',
        discipline: 'board',
        timeStart: '11:00',
        timeEnd: '13:00',
        topic: 'Параллельные повороты',
        rating: 5,
      },
      {
        id: 'mo-1',
        date: '22 фев',
        discipline: 'board',
        timeStart: '10:00',
        timeEnd: '12:00',
        topic: 'Первое занятие: стойка, скольжение',
        instructorNote: 'Быстро встал на доску',
        rating: 5,
      },
    ],
  },

  // ── Кирилл Волков — 3 занятия, сноуборд ──────────────────────────────────
  {
    id: 'kirill',
    name: 'Кирилл Волков',
    initials: 'КВ',
    avColor: 'ice',
    role: 'ученик',
    since: 'март 2026',
    phone: '+7 916 234 56 78',
    disciplines: ['Сноуборд'],
    level: 'Средний',
    totalHours: 6,
    history: [
      {
        id: 'kv-3',
        date: '15 апр',
        discipline: 'board',
        timeStart: '10:00',
        timeEnd: '12:00',
        topic: 'Резаные повороты',
        rating: 5,
      },
      {
        id: 'kv-2',
        date: '1 апр',
        discipline: 'board',
        timeStart: '10:00',
        timeEnd: '12:00',
        topic: 'Скоростной спуск, торможение',
        rating: 4,
      },
      {
        id: 'kv-1',
        date: '20 мар',
        discipline: 'board',
        timeStart: '10:00',
        timeEnd: '12:00',
        topic: 'Первое занятие: основы',
        rating: 5,
      },
    ],
  },

  // ── Татьяна Новикова — лыжи с дочкой ─────────────────────────────────────
  {
    id: 'tatyana',
    name: 'Татьяна Новикова',
    initials: 'ТН',
    avColor: 'mint',
    role: 'ученица',
    since: 'март 2026',
    phone: '+7 903 456 78 90',
    disciplines: ['Горные лыжи'],
    level: 'Новичок',
    totalHours: 2,
    about: 'Занимается вместе с дочкой 8 лет',
    history: [
      {
        id: 'tn-1',
        date: '22 мар',
        discipline: 'ski',
        timeStart: '10:00',
        timeEnd: '12:00',
        topic: 'Плуг, первые спуски',
        instructorNote: 'Дочка освоилась быстрее — обе молодцы',
        rating: 5,
      },
    ],
  },

  // ── Елена Соболева ────────────────────────────────────────────────────────
  {
    id: 'elena',
    name: 'Елена Соболева',
    initials: 'ЕС',
    avColor: 'ice',
    role: 'ученица',
    since: 'апрель 2026',
    disciplines: ['Сноуборд'],
    level: 'Новичок',
    totalHours: 2,
    history: [
      {
        id: 'es-1',
        date: '19 апр',
        discipline: 'board',
        timeStart: '12:00',
        timeEnd: '14:00',
        topic: 'Первое занятие: падения, подъёмы, скольжение',
        rating: 5,
      },
    ],
  },

  // ── Андрей Павлов ─────────────────────────────────────────────────────────
  {
    id: 'andrey',
    name: 'Андрей Павлов',
    initials: 'АП',
    avColor: 'purple',
    role: 'ученик',
    since: 'март 2026',
    disciplines: ['Сноуборд', 'Горные лыжи'],
    level: 'Средний',
    totalHours: 8,
    history: [
      {
        id: 'ap-4',
        date: '15 апр',
        discipline: 'ski',
        timeStart: '11:00',
        timeEnd: '13:00',
        topic: 'Параллельные повороты на лыжах',
        rating: 4,
      },
      {
        id: 'ap-3',
        date: '5 апр',
        discipline: 'board',
        timeStart: '10:00',
        timeEnd: '12:00',
        topic: 'Карвинг',
        rating: 5,
      },
      {
        id: 'ap-2',
        date: '22 мар',
        discipline: 'board',
        timeStart: '10:00',
        timeEnd: '12:00',
        topic: 'Прыжки',
        rating: 5,
      },
      {
        id: 'ap-1',
        date: '8 мар',
        discipline: 'board',
        timeStart: '10:00',
        timeEnd: '12:00',
        topic: 'Параллельные повороты',
        rating: 5,
      },
    ],
  },

  // ── Виктор Соколов ────────────────────────────────────────────────────────
  {
    id: 'viktor',
    name: 'Виктор Соколов',
    initials: 'ВС',
    avColor: 'straw',
    role: 'ученик',
    since: 'март 2026',
    disciplines: ['Сноуборд'],
    level: 'Продвинутый',
    totalHours: 6,
    about: 'Опытный райдер, хочет улучшить технику фрирайда',
    history: [
      {
        id: 'vs-3',
        date: '10 апр',
        discipline: 'board',
        timeStart: '09:00',
        timeEnd: '11:00',
        topic: 'Фрирайд: целина, разбор трасс',
        rating: 5,
      },
      {
        id: 'vs-2',
        date: '25 мар',
        discipline: 'board',
        timeStart: '10:00',
        timeEnd: '12:00',
        topic: 'Бэккантри-техника',
        rating: 5,
      },
      {
        id: 'vs-1',
        date: '10 мар',
        discipline: 'board',
        timeStart: '10:00',
        timeEnd: '12:00',
        topic: 'Оценка уровня, сложные трассы',
        instructorNote: 'Сильный технический уровень',
        rating: 5,
      },
    ],
  },
];

export function getStudentProfile(id: string): StudentProfile | undefined {
  return PROFILES.find(p => p.id === id);
}

export function getAllStudents(): StudentProfile[] {
  return PROFILES;
}
