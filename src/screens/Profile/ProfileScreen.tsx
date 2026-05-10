import { useState } from 'react';
import styles from './ProfileScreen.module.css';
import { useTranslation } from '@/i18n/useTranslation';

interface PriceRow {
  label: string;
  duration: string;
  price: string;
}

interface Review {
  initials: string;
  avatarColor: string;
  name: string;
  date: string;
  text: string;
}

interface SkillItem {
  name: string;
  pct: number;
  color: 'steel' | 'leaf';
}

interface ProfileData {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  sub: string;
  tags: string[];
  rating: number;
  students: number;
  reviewsCount: number;
  about: string;
  skills: SkillItem[];
  schedule: { day: string; status: 'free' | 'busy' | 'today' }[];
  prices: PriceRow[];
  reviews: Review[];
  onMountain: boolean;
}

const MOCK_PROFILE: ProfileData = {
  id: 'aleksey',
  name: 'Алексей Морозов',
  initials: 'АМ',
  avatarColor: 'blue',
  sub: 'Сноуборд · 8 лет опыта',
  tags: ['Сноуборд', 'Фрирайд', 'Дети'],
  rating: 4.9,
  students: 127,
  reviewsCount: 48,
  about: 'Катаюсь с 14 лет, преподаю с 2016 года. Специализируюсь на обучении взрослых с нуля и улучшении техники у тех, кто уже катается. Умею объяснить сложное просто — каждому подбираю индивидуальный темп.',
  skills: [
    { name: 'Новички',      pct: 100, color: 'steel' },
    { name: 'Продвинутые',  pct: 85,  color: 'steel' },
    { name: 'Фрирайд',      pct: 90,  color: 'leaf' },
    { name: 'Дети',         pct: 75,  color: 'leaf' },
  ],
  schedule: [
    { day: 'Пн', status: 'free' },
    { day: 'Вт', status: 'today' },
    { day: 'Ср', status: 'free' },
    { day: 'Чт', status: 'busy' },
    { day: 'Пт', status: 'free' },
    { day: 'Сб', status: 'busy' },
    { day: 'Вс', status: 'free' },
  ],
  prices: [
    { label: 'Индивидуальное', duration: '1 ч',    price: '3 500 ₽' },
    { label: 'Полдня',         duration: '4 ч',    price: '10 000 ₽' },
    { label: 'Мини-группа',    duration: '2 ч',    price: '5 000 ₽' },
    { label: 'Детское',        duration: '45 мин', price: '2 800 ₽' },
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
  onMountain: true,
};

interface ProfileScreenProps {
  instructorId?: string;
  onBack: () => void;
  onBook: () => void;
  onAskQuestion: () => void;
  onChat: (id: string) => void;
  onAllReviews: () => void;
}

/**
 * Экран профиля инструктора.
 * 1-в-1 копия из прототипа PROTOTYPE.html, секция scr-profile.
 * НИКАКИХ изменений дизайна без согласования.
 */
export function ProfileScreen({ onBack, onBook, onAskQuestion, onAllReviews }: ProfileScreenProps) {
  const { t } = useTranslation();
  const p = MOCK_PROFILE;
  const [expanded, setExpanded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const ABOUT_LIMIT = 120;
  const shortAbout = p.about.slice(0, ABOUT_LIMIT) + '…';

  return (
    <div className={styles.screen}>
      {/* ── Hero ── */}
      <div className={styles.profHero}>
        <div className={styles.tbRow}>
          <button className={styles.tbBack} onClick={onBack} aria-label="Назад">‹</button>
          <div className={styles.spacer} />
          <button className={styles.shareBtn} aria-label="Поделиться" onClick={() => { if (navigator.share) { navigator.share({ title: 'SkiFind', url: window.location.href }); } else { navigator.clipboard?.writeText(window.location.href); alert('Ссылка скопирована'); } }}>
            <svg viewBox="0 0 24 24">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
        <div className={styles.profAvRow}>
          <div className={styles.profAvWrap}>
            <div className={`${styles.av} ${styles.avLg} ${styles[`av-${p.avatarColor}`]}`}>
              {p.initials}
            </div>
            {p.onMountain && <div className={styles.profAvDot} />}
          </div>
          <div className={styles.profInfo}>
            <div className={styles.profName}>{p.name}</div>
            <div className={styles.profSub}>{p.sub}</div>
            <div className={styles.profTags}>
              {p.tags.map(tag => (
                <span key={tag} className={styles.profTag}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className={styles.profStats}>
        <div className={styles.profStat}>
          <div className={`${styles.psVal} ${styles.psValGold}`}>{p.rating}★</div>
          <div className={styles.psLbl}>{t('profile.rating')}</div>
        </div>
        <div className={`${styles.profStat} ${styles.profStatBorder}`}>
          <div className={styles.psVal}>{p.students}</div>
          <div className={styles.psLbl}>{t('profile.students')}</div>
        </div>
        <div className={styles.profStat}>
          <div className={styles.psVal}>{p.reviewsCount}</div>
          <div className={styles.psLbl}>{t('profile.reviews')}</div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className={styles.profActions}>
        <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ flex: 1 }} onClick={onBook}>
          Записаться
        </button>
        <button className={`${styles.btn} ${styles.btnSecondary}`} style={{ flex: 1 }} onClick={onAskQuestion}>
          Задать вопрос
        </button>
      </div>

      {/* ── Scroll content ── */}
      <div className={styles.scroll}>

        {/* About */}
        <div className={styles.sec}>
          <div className={styles.secT}>{t('profile.about')}</div>
          <div className={styles.aboutText}>
            {expanded ? p.about : shortAbout}
          </div>
          <button className={styles.readMore} onClick={() => setExpanded(v => !v)}>
            {expanded ? t('profile.collapse') + ' ↑' : t('profile.readMore') + ' ↓'}
          </button>
        </div>

        {/* Gallery */}
        <div className={styles.sec}>
          <div className={styles.secHeader}>
            <div className={styles.secT} style={{ marginBottom: 0 }}>{t('profile.gallery')}</div>
            <span className={styles.galleryCount}>5 фото · 1 видео</span>
          </div>
          <div className={styles.galleryStrip}>
            <div className={`${styles.galleryItem} ${styles.gallerySnow}`}>❄</div>
            <div className={`${styles.galleryItem} ${styles.galleryMountain} ${styles.video}`}>⛰</div>
            <div className={`${styles.galleryItem} ${styles.galleryAction}`}>🏂</div>
            <div className={`${styles.galleryItem} ${styles.galleryClass}`}>👥</div>
            <div className={styles.galleryItem}>🎿</div>
            <div className={`${styles.galleryItem} ${styles.gallerySnow}`}>⛷</div>
          </div>
        </div>

        {/* Skills */}
        <div className={styles.sec}>
          <div className={styles.secT}>{t('profile.skills')}</div>
          <div className={styles.skillsGrid}>
            {p.skills.map(s => (
              <div key={s.name} className={styles.skillItem}>
                <div className={styles.skillName}>{s.name}</div>
                <div className={styles.skillBar}>
                  <div
                    className={styles.skillFill}
                    style={{
                      width: `${s.pct}%`,
                      background: s.color === 'leaf' ? 'var(--leaf)' : 'var(--steel)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className={styles.sec}>
          <div className={styles.secT}>{t('profile.schedule')}</div>
          <div className={styles.weekGrid}>
            {p.schedule.map(({ day, status }) => (
              <div key={day} className={styles.dayCell}>
                <div className={styles.dayN}>{day}</div>
                <div className={`${styles.dayD} ${
                  status === 'free'  ? styles.dayFree  :
                  status === 'today' ? styles.dayToday :
                  styles.dayBusy
                }`}>
                  {status === 'free' ? '✓' : status === 'today' ? 'СГ' : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prices */}
        <div className={styles.sec}>
          <div className={styles.secT}>{t('profile.prices')}</div>
          <div className={styles.priceRows}>
            {p.prices.map(row => (
              <div key={row.label} className={styles.priceRow}>
                <div>
                  <div className={styles.prType}>{row.label} · {row.duration}</div>
                </div>
                <div className={styles.prVal}>{row.price}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className={`${styles.sec} ${styles.secLast}`}>
          <div className={styles.secT}>{t('profile.reviewsTitle')}</div>
          {p.reviews.map((rev, i) => (
            <div key={i} className={styles.reviewCard}>
              <div className={styles.revTop}>
                <div className={`${styles.av} ${styles.avSm} ${styles[`av-${rev.avatarColor}`]}`}>
                  {rev.initials}
                </div>
                <div>
                  <div className={styles.revName}>{rev.name}</div>
                  <div className={styles.revDate}>{rev.date}</div>
                </div>
                <div className={styles.revStars}>★★★★★</div>
              </div>
              <div className={styles.revText}>{rev.text}</div>
            </div>
          ))}
          <button
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnBlock}`}
            style={{ marginTop: 12 }}
            onClick={onAllReviews}
          >
            {t('profile.allReviews').replace('{count}', String(p.reviewsCount))} →
          </button>
          <div className={styles.modActions}>
            <button
              className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
              style={{ flex: 1 }}
              onClick={() => showToast('⚠ Жалоба отправлена на проверку')}
            >
              ⚠ {t('profile.report')}
            </button>
            <button
              className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm} ${styles.btnDanger}`}
              style={{ flex: 1 }}
              onClick={() => { setBlocked(b => !b); showToast(blocked ? 'Инструктор разблокирован' : '🚫 Инструктор заблокирован'); }}
            >
              {blocked ? '✓ Заблокирован' : `🚫 ${t('profile.block')}`}
            </button>
          </div>
        </div>

      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
