import { useState } from 'react';
import styles from './CatalogScreen.module.css';
import { useTranslation } from '@/i18n/useTranslation';

type SportType = 'all' | 'ski' | 'board';
type Level = 'all' | 'beginner' | 'advanced' | 'kids' | 'freeride';
type SortKey = 'rating' | 'price-asc' | 'price-desc' | 'experience';

export interface Instructor {
  id: string;
  name: string;
  initials: string;
  avatarColor: 'ice' | 'mint' | 'purple' | 'straw' | 'blue';
  resort: string;
  type: SportType[];
  level: Level[];
  rating: number;
  price: number;
  miniGroupBasePrice?: number;  // цена мини-группы за 2 человека
  miniGroupExtraPrice?: number; // доплата за каждого следующего участника
  exp: number;
  onMountain: boolean;
  hasFreeSlotsToday: boolean;
  gender: 'male' | 'female';
  busyUntil?: string;
  nextSlot?: string;
  tags: { label: string; color: 'blue' | 'mint' | 'straw' | 'purple' | 'gray' }[];
}

// Активные курорты — сейчас только Шерегеш. Когда добавим Розу Хутор,
// уберём константу и заменим на запрос /resorts — фильтр появится автоматически.
export const ACTIVE_RESORTS = ['Шерегеш'] as const;

export const INSTRUCTORS: Instructor[] = [
  {
    id: 'aleksey', name: 'Алексей Морозов', initials: 'АМ', avatarColor: 'ice',
    resort: 'Шерегеш', type: ['board'], level: ['beginner', 'advanced'],
    rating: 4.9, price: 3500, miniGroupBasePrice: 7000, miniGroupExtraPrice: 2300,
    exp: 8, onMountain: true, hasFreeSlotsToday: true,
    gender: 'male', nextSlot: 'сегодня 14:00',
    tags: [{ label: 'Сноуборд', color: 'blue' }, { label: 'Новички', color: 'mint' }],
  },
  {
    id: 'natalya', name: 'Наталья Петрова', initials: 'НП', avatarColor: 'mint',
    resort: 'Шерегеш', type: ['ski'], level: ['kids'],
    rating: 5.0, price: 2800, miniGroupBasePrice: 5500, miniGroupExtraPrice: 1800,
    exp: 6, onMountain: false, hasFreeSlotsToday: false,
    gender: 'female', nextSlot: 'завтра 10:00',
    tags: [{ label: 'Горные лыжи', color: 'blue' }, { label: 'Дети', color: 'purple' }],
  },
  {
    id: 'dmitry', name: 'Дмитрий Захаров', initials: 'ДЗ', avatarColor: 'purple',
    resort: 'Шерегеш', type: ['ski', 'board'], level: ['advanced', 'freeride'],
    rating: 4.7, price: 4200, miniGroupBasePrice: 8000, miniGroupExtraPrice: 2800,
    exp: 10, onMountain: true, hasFreeSlotsToday: true,
    gender: 'male', busyUntil: '15:00',
    tags: [{ label: 'Сноуборд', color: 'blue' }, { label: 'Фрирайд', color: 'straw' }],
  },
  {
    id: 'marina', name: 'Марина Волкова', initials: 'МВ', avatarColor: 'straw',
    resort: 'Шерегеш', type: ['ski'], level: ['beginner', 'kids'],
    rating: 4.8, price: 2500, miniGroupBasePrice: 5000, miniGroupExtraPrice: 1600,
    exp: 5, onMountain: false, hasFreeSlotsToday: true,
    gender: 'female', nextSlot: 'сегодня 16:00',
    tags: [{ label: 'Горные лыжи', color: 'blue' }, { label: 'Новички', color: 'mint' }, { label: 'Дети', color: 'purple' }],
  },
  {
    id: 'sergey', name: 'Сергей Лебедев', initials: 'СЛ', avatarColor: 'blue',
    resort: 'Шерегеш', type: ['ski'], level: ['advanced', 'freeride'],
    rating: 5.0, price: 5000, miniGroupBasePrice: 9000, miniGroupExtraPrice: 3000,
    exp: 12, onMountain: true, hasFreeSlotsToday: true,
    gender: 'male', nextSlot: 'сегодня 15:30',
    tags: [{ label: 'Горные лыжи', color: 'blue' }, { label: 'Фрирайд', color: 'straw' }],
  },
];

interface CatalogScreenProps {
  onProfile: (id: string) => void;
  onBook: (id: string) => void;
  onNotifications: () => void;
  onBecomeInstructor: () => void;
  onMasterClasses: () => void;
}

/**
 * Экран каталога инструкторов.
 * 1-в-1 копия из прототипа PROTOTYPE.html, секция scr-catalog.
 * НИКАКИХ изменений дизайна без согласования.
 */
export function CatalogScreen({ onProfile, onBook, onNotifications, onBecomeInstructor, onMasterClasses }: CatalogScreenProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<SportType>('all');
  const [level, setLevel] = useState<Level>('all');
  const [sort, setSort] = useState<SortKey>('rating');
  const [onlyFreeToday, setOnlyFreeToday] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const freeTodayCount = INSTRUCTORS.filter(i => i.hasFreeSlotsToday).length;
  const avgRating = (INSTRUCTORS.reduce((sum, i) => sum + i.rating, 0) / INSTRUCTORS.length).toFixed(1);

  function toggleFav(id: string) {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const filtered = INSTRUCTORS
    .filter(i => {
      if (onlyFreeToday && !i.hasFreeSlotsToday) return false;
      if (type !== 'all' && !i.type.includes(type)) return false;
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
      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.tbRow}>
          <div className={styles.titleBlock}>
            <h1 className={styles.heroTitle}>
              {t('catalog.titleLine')} <span>{t('catalog.titleAccent')}</span>
            </h1>
            <div className={styles.heroStats}>
              <span className={styles.heroStat}>
                {t('catalog.statInstructors', { count: INSTRUCTORS.length })}
              </span>
              <span className={styles.heroStatSep}>·</span>
              <span className={styles.heroStat}>
                {t('catalog.statRating', { rating: avgRating })}
              </span>
            </div>
          </div>
          <div className={styles.topActions}>
            <button className={styles.bellBtn} onClick={onNotifications} aria-label="Уведомления">
              <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              <div className={styles.notifDot} />
            </button>
            <button className={styles.becomeBtn} onClick={onBecomeInstructor}>
              {t('catalog.becomeInstructor')}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            type="search"
            placeholder={t('catalog.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Type tabs */}
        <div className={styles.typeTabs}>
          {(['all', 'ski', 'board'] as SportType[]).map(tab => (
            <button
              key={tab}
              className={`${styles.typeTab} ${type === tab ? styles.typeTabActive : ''}`}
              onClick={() => setType(tab)}
            >
              {tab === 'all' ? t('catalog.filterAll') : tab === 'ski' ? t('catalog.filterAlpine') : t('catalog.filterSnowboard')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Avail toggle ── */}
      <button
        className={`${styles.availBtn} ${onlyFreeToday ? styles.availBtnActive : ''}`}
        onClick={() => setOnlyFreeToday(v => !v)}
      >
        <span className={styles.availPulse} />
        <span className={styles.availLabel}>
          {onlyFreeToday
            ? t('catalog.showFreeToday', { count: freeTodayCount })
            : t('catalog.showAll')}
        </span>
        <span className={styles.availCount}>
          {t('catalog.showFreeToday', { count: freeTodayCount })}
        </span>
      </button>

      {/* ── Sort row ── */}
      <div className={styles.sortRow}>
        <div className={styles.sortLabel}>{t('catalog.sortLabel')}</div>
        <select
          className={styles.sortSelect}
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
        >
          <option value="rating">{t('catalog.sortByRating')}</option>
          <option value="price-asc">{t('catalog.sortByPriceAsc')}</option>
          <option value="price-desc">{t('catalog.sortByPriceDesc')}</option>
          <option value="experience">{t('catalog.sortByExp')}</option>
        </select>
      </div>

      {/* ── Level chips ── */}
      <div className={styles.levelChips}>
        {LEVELS.map(({ key, label }) => (
          <button
            key={key}
            className={`${styles.chip} ${level === key ? styles.chipActive : ''}`}
            onClick={() => setLevel(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Cards ── */}
      <div className={styles.scroll}>
        {/* Master classes banner */}
        <div className={styles.mcBanner} onClick={onMasterClasses}>
          <div className={styles.mcBannerLeft}>
            <div className={styles.mcBannerIcon}>🎿</div>
            <div>
              <div className={styles.mcBannerTitle}>Мастер-классы</div>
              <div className={styles.mcBannerSub}>Групповые занятия · от 2 800 ₽ · 3 ближайших</div>
            </div>
          </div>
          <span className={styles.mcBannerArrow}>→</span>
        </div>

        <div className={styles.instrList}>
          {filtered.map(instr => (
            <div
              key={instr.id}
              className={styles.instrCard}
              onClick={() => onProfile(instr.id)}
            >
              {/* Fav button */}
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
                  <div className={styles.icResort}>📍 {instr.resort}</div>
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
                  <span className={styles.icStar}>★</span>
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
      </div>
    </div>
  );
}
