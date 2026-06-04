import { useState, useRef } from 'react';
import styles from './ProfileScreen.module.css';
import { useTranslation } from '@/i18n/useTranslation';
import type { Instructor } from '@/screens/Catalog/CatalogScreen';

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
  instructor?: Instructor;  // если передан — используем реальные данные
  onBack: () => void;
  onBook: () => void;
  onAskQuestion: () => void;
  onChat?: (id: string) => void;
  onAllReviews: () => void;
  isBlocked?: boolean;
  onToggleBlock?: (instructorId: string, blocked: boolean) => void;
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
}

// Строим sub-строку ("Горные лыжи · Сноуборд · 8 лет опыта") из Instructor
function buildSub(instr: Instructor): string {
  const sports = instr.type.map(t => t === 'ski' ? 'Горные лыжи' : 'Сноуборд').join(' · ');
  return `${sports} · ${instr.exp} ${instr.exp === 1 ? 'год' : instr.exp < 5 ? 'года' : 'лет'} опыта`;
}

/**
 * Экран профиля инструктора (публичный — для гостей).
 * Принимает реальный Instructor и подставляет его данные,
 * для остальных полей (навыки, расписание, отзывы) использует моки.
 */
export function ProfileScreen({ instructor, onBack, onBook, onAskQuestion, onAllReviews, isBlocked: isBlockedProp, onToggleBlock, isOwnProfile, onEditProfile }: ProfileScreenProps) {
  const { t } = useTranslation();

  // Если передан реальный инструктор — подставляем его данные поверх мока
  const p = instructor ? {
    ...MOCK_PROFILE,
    id:           instructor.id,
    name:         instructor.name,
    initials:     instructor.initials,
    avatarColor:  instructor.avatarColor,
    sub:          buildSub(instructor),
    tags:         instructor.tags.map(tg => tg.label),
    rating:       instructor.rating,
    onMountain:   instructor.onMountain,
    about:        instructor.bio ?? MOCK_PROFILE.about,
  } : MOCK_PROFILE;
  const [expanded, setExpanded]       = useState(false);
  const [toast, setToast]             = useState<string | null>(null);
  const [blocked, setBlocked]         = useState(isBlockedProp ?? false);
  const [reportOpen, setReportOpen]   = useState(false);

  // ── Галерея (редактируемая в своём профиле) ──────────────────────────
  const [gallery, setGallery] = useState([
    { id: '1', emoji: '❄', cls: styles.gallerySnow,     isVideo: false },
    { id: '2', emoji: '⛰', cls: styles.galleryMountain, isVideo: true  },
    { id: '3', emoji: '🏂', cls: styles.galleryAction,   isVideo: false },
    { id: '4', emoji: '👥', cls: styles.galleryClass,    isVideo: false },
    { id: '5', emoji: '🎿', cls: '',                     isVideo: false },
    { id: '6', emoji: '⛷', cls: styles.gallerySnow,     isVideo: false },
  ]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportText, setReportText]   = useState('');

  const REPORT_REASONS = [
    'Неверная информация',
    'Мошенничество / обман',
    'Оскорбительное поведение',
    'Нарушение правил сервиса',
    'Фейковый профиль',
    'Другое',
  ];

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleSubmitReport() {
    setReportOpen(false);
    setReportReason('');
    setReportText('');
    showToast('⚠ Жалоба отправлена на проверку');
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
        {isOwnProfile ? (
          <button className={`${styles.btn} ${styles.btnSecondary}`} style={{ flex: 1 }} onClick={onEditProfile}>
            Редактировать профиль →
          </button>
        ) : (
          <>
            <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ flex: 1 }} onClick={onBook}>
              Записаться
            </button>
            <button className={`${styles.btn} ${styles.btnSecondary}`} style={{ flex: 1 }} onClick={onAskQuestion}>
              Задать вопрос
            </button>
          </>
        )}
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
            <span className={styles.galleryCount}>
              {gallery.filter(g => !g.isVideo).length} фото · {gallery.filter(g => g.isVideo).length} видео
            </span>
          </div>
          <div className={styles.galleryStrip}>
            {gallery.map(item => (
              <div
                key={item.id}
                className={`${styles.galleryItem} ${item.cls} ${item.isVideo ? styles.video : ''} ${isOwnProfile ? styles.galleryItemEditable : ''}`}
                style={photoUrls[item.id] ? { backgroundImage: `url(${photoUrls[item.id]})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                {!photoUrls[item.id] && item.emoji}
                {isOwnProfile && (
                  <button
                    className={styles.galleryRemoveBtn}
                    onClick={() => setGallery(prev => prev.filter(g => g.id !== item.id))}
                    aria-label="Удалить"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {isOwnProfile && (
              <button
                className={styles.galleryAddBtn}
                onClick={() => galleryFileRef.current?.click()}
                aria-label="Добавить фото"
              >
                <span className={styles.galleryAddIcon}>+</span>
                <span className={styles.galleryAddLabel}>Добавить</span>
              </button>
            )}
          </div>
          {isOwnProfile && (
            <input
              ref={galleryFileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              onChange={e => {
                const files = Array.from(e.target.files ?? []);
                files.forEach(file => {
                  const id = Date.now().toString() + Math.random();
                  const url = URL.createObjectURL(file);
                  const isVideo = file.type.startsWith('video/');
                  setGallery(prev => [...prev, { id, emoji: '', cls: '', isVideo }]);
                  setPhotoUrls(prev => ({ ...prev, [id]: url }));
                });
                e.target.value = '';
              }}
            />
          )}
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
          {!isOwnProfile && (
            <div className={styles.modActions}>
              <button
                className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                style={{ flex: 1 }}
                onClick={() => setReportOpen(true)}
              >
                ⚠ {t('profile.report')}
              </button>
              <button
                className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm} ${styles.btnDanger}`}
                style={{ flex: 1 }}
                onClick={() => {
                  const next = !blocked;
                  setBlocked(next);
                  onToggleBlock?.(p.id, next);
                  showToast(next ? '🚫 Инструктор скрыт из каталога' : '✓ Инструктор снова виден в каталоге');
                }}
              >
                {blocked ? '✓ Заблокирован' : `🚫 ${t('profile.block')}`}
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ── Report bottom sheet ── */}
      {reportOpen && (
        <div className={styles.reportOverlay} onClick={() => setReportOpen(false)}>
          <div className={styles.reportBox} onClick={e => e.stopPropagation()}>
            <div className={styles.reportTitle}>Пожаловаться на инструктора</div>
            <div className={styles.reportSectionLabel}>Причина</div>
            <div className={styles.reportReasons}>
              {REPORT_REASONS.map(reason => (
                <button
                  key={reason}
                  className={`${styles.reportReason} ${reportReason === reason ? styles.reportReasonActive : ''}`}
                  onClick={() => setReportReason(reason)}
                >
                  {reportReason === reason ? '● ' : '○ '}{reason}
                </button>
              ))}
            </div>
            <div className={styles.reportSectionLabel}>Комментарий <span className={styles.reportOptional}>(необязательно)</span></div>
            <textarea
              className={styles.reportTextarea}
              placeholder="Опишите ситуацию подробнее..."
              value={reportText}
              onChange={e => setReportText(e.target.value)}
              rows={3}
            />
            <div className={styles.reportActions}>
              <button
                className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                style={{ flex: 1 }}
                onClick={() => setReportOpen(false)}
              >
                Отмена
              </button>
              <button
                className={`${styles.btn} ${styles.btnSm} ${reportReason ? styles.btnWarn : styles.btnDisabled}`}
                style={{ flex: 1 }}
                onClick={handleSubmitReport}
                disabled={!reportReason}
              >
                Отправить жалобу
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
