import { useState, useRef, useCallback } from 'react';
import styles from './CatalogScreen.module.css';
import { useTranslation } from '@/i18n/useTranslation';
import { Icon } from '@/components/Icon/Icon';

type SportType = 'all' | 'ski' | 'board';
type Level = 'all' | 'beginner' | 'advanced' | 'kids' | 'freeride';
type SortKey = 'rating' | 'price-asc' | 'price-desc' | 'experience';

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
  miniGroupBasePrice?: number;
  miniGroupExtraPrice?: number;
  miniGroupMaxParticipants?: number;
  worksWithKids: boolean;
  bio?: string;
  exp: number;
  onMountain: boolean;
  hasFreeSlotsToday: boolean;
  gender: 'male' | 'female';
  busyUntil?: string;
  nextSlot?: string;
  tags: { label: string; color: 'blue' | 'mint' | 'straw' | 'purple' | 'gray' }[];
  // Расширенные данные профиля
  skills?: InstructorSkill[];
  schedule?: InstructorScheduleDay[];
  prices?: InstructorPriceRow[];
  reviews?: InstructorReview[];
  students?: number;
  reviewsCount?: number;
}

export const ACTIVE_RESORTS = ['Шерегеш'] as const;

export const INSTRUCTORS: Instructor[] = [
  {
    id: 'aleksey', name: 'Алексей Морозов', initials: 'АМ', avatarColor: 'ice',
    resort: 'Шерегеш', type: ['board'], level: ['beginner', 'advanced'],
    rating: 4.9, price: 3500,
    miniGroupBasePrice: 7000, miniGroupExtraPrice: 2300, miniGroupMaxParticipants: 5,
    worksWithKids: false,
    bio: 'Катаюсь с 14 лет, преподаю с 2016 года. Специализируюсь на обучении взрослых с нуля и улучшении техники. Умею объяснить сложное просто — каждому подбираю свой темп.',
    exp: 8, onMountain: true, hasFreeSlotsToday: true,
    gender: 'male', nextSlot: 'сегодня 14:00',
    tags: [{ label: 'Сноуборд', color: 'blue' }, { label: 'Новички', color: 'mint' }],
    students: 127, reviewsCount: 48,
    skills: [
      { name: 'Новички',     pct: 100, color: 'steel' },
      { name: 'Продвинутые', pct: 85,  color: 'steel' },
      { name: 'Фрирайд',     pct: 72,  color: 'leaf'  },
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
    rating: 5.0, price: 2800,
    miniGroupBasePrice: 5500, miniGroupExtraPrice: 1800, miniGroupMaxParticipants: 6,
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
    miniGroupBasePrice: 8000, miniGroupExtraPrice: 2800, miniGroupMaxParticipants: 4,
    worksWithKids: false,
    bio: '10 лет на склонах Шерегеша. Мастер спорта по горным лыжам, опыт фрирайда в Альпах. Обучаю технике параллельного ведения и навыкам бэккантри.',
    exp: 10, onMountain: true, hasFreeSlotsToday: true,
    gender: 'male', busyUntil: '15:00',
    tags: [{ label: 'Сноуборд', color: 'blue' }, { label: 'Фрирайд', color: 'straw' }],
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
    miniGroupBasePrice: 5000, miniGroupExtraPrice: 1600, miniGroupMaxParticipants: 6,
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
    miniGroupBasePrice: 9000, miniGroupExtraPrice: 3000, miniGroupMaxParticipants: 4,
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
  onProfile: (id: string) => void;
  onBook: (id: string) => void;
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
  const [level, setLevel]             = useState<Level>('all');
  const [sort, setSort]               = useState<SortKey>('rating');
  const [onlyFreeToday] = useState(false);
  const [localFavorites, setLocalFavorites] = useState<Set<string>>(new Set());
  const favorites = favoritesProp ?? localFavorites;
  const contentRef                    = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);



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

  const filtered = INSTRUCTORS
    .filter(i => {
      if (blockedIds?.has(i.id)) return false;
      if (onlyFreeToday && !i.hasFreeSlotsToday) return false;
      if (type !== 'all' && !i.type.some(t => t === type)) return false;
      if (level !== 'all' && !i.level.includes(level)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!i.name.toLowerCase().includes(q) && !i.resort.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      return b.exp - a.exp;
    });

  const LEVELS: { key: Level; label: string }[] = [
    { key: 'all',       label: t('catalog.levelAll') },
    { key: 'beginner',  label: t('catalog.levelBeginner') },
    { key: 'advanced',  label: t('catalog.levelAdvanced') },
    { key: 'kids',      label: t('catalog.levelKids') },
    { key: 'freeride',  label: t('catalog.levelFreeride') },
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
                  onClick={() => { setType(tab); scrollToTop(); }}
                >
                  {tab === 'all' ? t('catalog.filterAll') : tab === 'ski' ? t('catalog.filterAlpine') : t('catalog.filterSnowboard')}
                </button>
              ))}
            </div>
            <div className={`${styles.sortIconBtn} ${sort !== 'rating' ? styles.sortIconBtnActive : ''}`}>
              <svg viewBox="0 0 16 16">
                <line x1="2" y1="4" x2="14" y2="4"/>
                <line x1="4" y1="8" x2="12" y2="8"/>
                <line x1="6" y1="12" x2="10" y2="12"/>
              </svg>
              <select
                value={sort}
                onChange={e => { setSort(e.target.value as SortKey); scrollToTop(); }}
              >
                <option value="rating">{t('catalog.sortByRating')}</option>
                <option value="price-asc">{t('catalog.sortByPriceAsc')}</option>
                <option value="price-desc">{t('catalog.sortByPriceDesc')}</option>
                <option value="experience">{t('catalog.sortByExp')}</option>
              </select>
            </div>
          </div>

          <div className={styles.levelChips}>
            {LEVELS.map(({ key, label }) => (
              <button
                key={key}
                className={`${styles.chip} ${level === key ? styles.chipActive : ''}`}
                onClick={() => { setLevel(key); scrollToTop(); }}
              >
                {label}
              </button>
            ))}
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
          {filtered.map(instr => (
            <div
              key={instr.id}
              className={styles.instrCard}
              role="button"
              tabIndex={0}
              onClick={() => onProfile(instr.id)}
              onKeyDown={e => e.key === 'Enter' && onProfile(instr.id)}
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
                    {instr.tags.map(tag => (
                      <span key={tag.label} className={`${styles.tag} ${styles[`tag-${tag.color}`]}`}>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                  {instr.onMountain && (
                    <div className={styles.onMountainBadge}>{t('catalog.onMountainNow')}</div>
                  )}
                </div>
                <div className={styles.icRating}>
                  <Icon name="star" size={12} />
                  {instr.rating.toFixed(1)}
                </div>
              </div>

              {/* Bottom */}
              <div className={styles.icBot}>
                <div>
                  <div className={styles.icPrice}>{instr.price.toLocaleString('ru')} ₽</div>
                  <div className={styles.icPriceSub}>{t('catalog.perHour')}</div>
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
                  onClick={e => { e.stopPropagation(); onBook(instr.id); }}
                >
                  Записаться →
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 32 }} />
      </div>{/* /content */}
    </div>
  );
}
