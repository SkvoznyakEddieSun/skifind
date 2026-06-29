import { useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import styles from './BookingsScreen.module.css';
import { useTranslation } from '@/i18n/useTranslation';
import { Icon } from '@/components/Icon/Icon';
import { MONTH_SHORT } from '@/store/bookings';
import { getBookings, type BookingDTO } from '@/lib/api';
import { type BookingStatus, statusLabel } from '@/lib/bookingStatus';
import { hasRating } from '@/screens/Catalog/CatalogScreen';

interface Booking {
  id: string;
  status: BookingStatus;
  instructorId: string;
  instructorName: string;
  instructorInitials: string;
  instructorAvatarColor: string;
  instructorSpec: string;
  rating: number;
  dayNum: string;
  dayMon: string;
  timeRange: string;
  lessonType: string;
  meta: string;
  price: string;
}

const AV_KEYS = ['ice', 'mint', 'straw', 'purple'] as const;
function initialsOf(name: string): string {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?';
}
function avColorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AV_KEYS[h % AV_KEYS.length];
}

// Имя инструктора в DTO уже короткое («Имя Фамилия») — НЕ переставляем.
function toDisplay(b: BookingDTO): Booking {
  const name = b.counterpartyName || b.counterpartyPhone || 'Инструктор';
  const d = new Date(`${b.date}T00:00:00`);
  return {
    id:                    b.id,
    status:                b.status,
    instructorId:          b.instructorId,
    instructorName:        name,
    instructorInitials:    initialsOf(name),
    instructorAvatarColor: avColorFor(b.instructorId),
    instructorSpec:        'Шерегеш',
    rating:                0,   // рейтинга нет в DTO — скрываем через hasRating
    dayNum:                String(d.getDate()),
    dayMon:                MONTH_SHORT[d.getMonth()],
    timeRange:             `${b.startTime} — ${b.endTime}`,
    lessonType:            b.format === 'mini_group' ? 'Мини-группа' : 'Индивидуальное занятие',
    meta: b.status === 'ACCEPTED'
      ? 'Место встречи уточните у инструктора'
      : b.status === 'PENDING'
      ? 'Заявка отправлена'
      : b.status === 'COMPLETED'
      ? 'Занятие завершено'
      : 'Отменено',
    price: `${(b.price ?? 0).toLocaleString('ru')} ₽`,
  };
}

// Статус → CSS-модификатор бейджа (только презентация, не значение статуса).
// ACCEPTED делит вид с «Подтверждено», DECLINED — с «Отменено».
const STATUS_CSS: Record<BookingStatus, string> = {
  PENDING:   'pending',
  ACCEPTED:  'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DECLINED:  'cancelled',
};

const REVIEW_TAGS = [
  'Понятно объясняет',
  'Терпение',
  'Профессионализм',
  'Подход к детям',
  'Безопасность',
  'Прогресс',
  'Весело',
  'Пунктуальность',
  'Чувство юмора',
  'Хорошая программа',
];

interface BookingsScreenProps {
  onChat: (instructorId: string) => void;
  onCancel?: (bookingId: string) => void;
  onLeaveReview?: (bookingId: string) => void;
  onBookAgain: (instructorId: string) => void;
  onBack?: () => void;
}

export function BookingsScreen({ onChat, onBookAgain, onBack }: BookingsScreenProps) {
  const { t } = useTranslation();

  // Реальные брони ученика с сервера (GET /api/bookings → student → свои).
  const { data: serverBookings = [] } = useQuery({ queryKey: ['bookings'], queryFn: getBookings });
  const bookings = useMemo(() => serverBookings.map(toDisplay), [serverBookings]);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewStars, setReviewStars]         = useState(5);
  const [reviewText, setReviewText]           = useState('');
  const [reviewTags, setReviewTags]           = useState<Set<string>>(new Set());
  const [reviewMedia, setReviewMedia]         = useState<File[]>([]);
  const [submittedIds, setSubmittedIds]       = useState<Set<string>>(new Set());
  const [toast, setToast]                     = useState<string | null>(null);
  const fileInputRef                          = useRef<HTMLInputElement>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleCancel(_bookingId: string) {
    // TODO: подключить отмену брони учеником к серверу (POST CANCELLED).
    // Пока серверного роута отмены нет — не мутируем, показываем заглушку.
    showToast('Отмена брони будет доступна позже');
  }

  function toggleTag(tag: string) {
    setReviewTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag); else next.add(tag);
      return next;
    });
  }

  function handleMediaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setReviewMedia(prev => [...prev, ...files].slice(0, 5)); // max 5 файлов
    e.target.value = ''; // сбросить input
  }

  function removeMedia(idx: number) {
    setReviewMedia(prev => prev.filter((_, i) => i !== idx));
  }

  function handleSubmitReview() {
    if (!reviewBookingId) return;
    setSubmittedIds(prev => new Set([...prev, reviewBookingId]));
    setReviewBookingId(null);
    setReviewText('');
    setReviewStars(5);
    setReviewTags(new Set());
    setReviewMedia([]);
    showToast('✓ Отзыв опубликован');
  }

  const pendingBookings = bookings.filter(b => b.status === 'PENDING');
  const otherBookings   = bookings.filter(b => b.status !== 'PENDING');

  return (
    <div className={styles.screen}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.tbRow}>
          {onBack && <button className={styles.tbBack} onClick={onBack}>‹</button>}
          <div style={{ flex: 1 }}>
            <div className={styles.tbTitle}>{t('bookings.title')}</div>
            <div className={styles.tbSub}>{t('bookings.sub')}</div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className={styles.scroll}>
        <div className={styles.bookingsList}>

          {/* ── Pending section ── */}
          {pendingBookings.length > 0 && (
            <div className={styles.pendingSection}>
              <div className={styles.pendingSectionTitle}>⏳ Ожидает подтверждения</div>
              {pendingBookings.map(b => (
                <div key={b.id} className={styles.pendingCard}>
                  <div className={styles.pendingRow1}>
                    <div className={`${styles.av} ${styles.avSm} ${styles[`av-${b.instructorAvatarColor}`]}`}>
                      {b.instructorInitials}
                    </div>
                    <div className={styles.pendingInfo}>
                      <div className={styles.pendingName}>{b.instructorName}</div>
                      <div className={styles.pendingMeta}>
                        {b.dayNum} {b.dayMon} · {b.timeRange} · {b.lessonType}
                      </div>
                      <div className={styles.pendingPrice}>{b.price}</div>
                    </div>
                  </div>
                  <div className={styles.pendingHint}>
                    Инструктор скоро ответит, ожидайте
                  </div>
                  <div className={styles.pendingActions}>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                      style={{ flex: 1 }}
                      onClick={() => onChat(b.instructorId)}
                    >
                      <Icon name="chat" size={14} /> {t('bookings.chat')}
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm} ${styles.btnDanger}`}
                      style={{ flex: 1 }}
                      onClick={() => handleCancel(b.id)}
                    >
                      {t('bookings.cancel')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── All bookings (non-pending) ── */}
          {otherBookings.map(b => (
            <div
              key={b.id}
              className={styles.bookingCard}
              style={b.status === 'COMPLETED' || b.status === 'CANCELLED' ? { opacity: .75 } : undefined}
            >
              {/* Status strip */}
              <div className={`${styles.bcStatus} ${styles[`bcStatus-${STATUS_CSS[b.status]}`]}`}>
                {statusLabel(b.status)}
              </div>

              {/* Body */}
              <div className={styles.bcBody}>
                <div className={styles.bcRow1}>
                  <div className={`${styles.av} ${styles.avMd} ${styles[`av-${b.instructorAvatarColor}`]}`}>
                    {b.instructorInitials}
                  </div>
                  <div className={styles.bcInstrInfo}>
                    <div className={styles.bcInstrName}>{b.instructorName}</div>
                    <div className={styles.bcInstrSpec}>{b.instructorSpec}</div>
                  </div>
                  {hasRating(b.rating) && (
                    <div className={styles.bcRating}>
                      <span className={styles.star}>★</span> {b.rating.toFixed(1)}
                    </div>
                  )}
                </div>

                <div className={styles.bcDate}>
                  <div className={styles.bcDay}>
                    <div className={styles.bcDayNum}>{b.dayNum}</div>
                    <div className={styles.bcDayMon}>{b.dayMon}</div>
                  </div>
                  <div className={styles.bcDaySep} />
                  <div className={styles.bcDetail}>
                    <strong>{b.timeRange}</strong><br />{b.lessonType}
                  </div>
                </div>

                <div className={styles.bcMeta}>
                  <span>{b.meta}</span>
                  <span className={styles.bcPrice}>{b.price}</span>
                </div>

                <div className={styles.bcActions}>
                  {b.status === 'ACCEPTED' && (
                    <>
                      <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} style={{ flex: 1 }} onClick={() => onChat(b.instructorId)}>
                        <Icon name="chat" size={14} /> {t('bookings.chat')}
                      </button>
                      <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} style={{ flex: 1 }} onClick={() => onChat(b.instructorId)}>
                        <Icon name="phone" size={14} /> {t('bookings.call')}
                      </button>
                    </>
                  )}
                  {b.status === 'COMPLETED' && (
                    <>
                      <button
                        className={`${styles.btn} ${styles.btnSm} ${submittedIds.has(b.id) ? styles.btnReviewed : styles.btnSecondary}`}
                        style={{ flex: 1 }}
                        onClick={() => { if (!submittedIds.has(b.id)) setReviewBookingId(b.id); }}
                        disabled={submittedIds.has(b.id)}
                      >
                        {submittedIds.has(b.id) ? '✓ Отзыв оставлен' : `⭐ ${t('bookings.leaveReview')}`}
                      </button>
                      <button
                        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                        style={{ flex: 1 }}
                        onClick={() => onBookAgain(b.instructorId)}
                      >
                        {t('bookings.bookAgain')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* ── Review form (bottom sheet) ── */}
      {reviewBookingId && (
        <div className={styles.reviewOverlay} onClick={() => setReviewBookingId(null)}>
          <div className={styles.reviewBox} onClick={e => e.stopPropagation()}>

            <div className={styles.reviewTitle}>Оставить отзыв</div>

            {/* Stars */}
            <div className={styles.starRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  className={`${styles.starBtn} ${n <= reviewStars ? styles.starBtnOn : ''}`}
                  onClick={() => setReviewStars(n)}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Tags */}
            <div>
              <div className={styles.reviewSectionLabel}>Что понравилось?</div>
              <div className={styles.reviewTags}>
                {REVIEW_TAGS.map(tag => (
                  <button
                    key={tag}
                    className={`${styles.reviewTag} ${reviewTags.has(tag) ? styles.reviewTagActive : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <textarea
              className="input-field input-field--textarea"
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Расскажите о занятии..."
              rows={3}
            />

            {/* Media attach */}
            <div>
              <div className={styles.reviewSectionLabel}>Фото и видео <span className={styles.reviewMediaHint}>(до 5 файлов)</span></div>
              <div className={styles.reviewMediaRow}>
                {reviewMedia.map((file, idx) => (
                  <div key={idx} className={styles.reviewMediaThumb}>
                    {file.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(file)} alt="" className={styles.reviewMediaImg} />
                    ) : (
                      <div className={styles.reviewMediaVideo}>🎬</div>
                    )}
                    <button className={styles.reviewMediaRemove} onClick={() => removeMedia(idx)}>✕</button>
                  </div>
                ))}
                {reviewMedia.length < 5 && (
                  <button className={styles.reviewMediaAdd} onClick={() => fileInputRef.current?.click()}>
                    <span className={styles.reviewMediaAddIcon}>＋</span>
                    <span className={styles.reviewMediaAddLabel}>Добавить</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleMediaChange}
              />
            </div>

            {/* Actions */}
            <div className={styles.reviewActions}>
              <button
                className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`}
                style={{ flex: 1 }}
                onClick={() => setReviewBookingId(null)}
              >
                Отмена
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                style={{ flex: 1 }}
                onClick={handleSubmitReview}
              >
                Отправить
              </button>
            </div>

          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
