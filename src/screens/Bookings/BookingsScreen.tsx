import { useState } from 'react';
import styles from './BookingsScreen.module.css';
import { useTranslation } from '@/i18n/useTranslation';

type BookingStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled';

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

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    status: 'confirmed',
    instructorId: 'aleksey',
    instructorName: 'Алексей Морозов',
    instructorInitials: 'АМ',
    instructorAvatarColor: 'ice',
    instructorSpec: 'Сноуборд · Шерегеш',
    rating: 4.9,
    dayNum: '28', dayMon: 'апр',
    timeRange: '10:00 — 12:00',
    lessonType: 'Мини-группа · 2 человека',
    meta: 'Место встречи · Касса Шерегеш, вход А',
    price: '7 000 ₽',
  },
  {
    id: 'b2',
    status: 'pending',
    instructorId: 'natalya',
    instructorName: 'Наталья Петрова',
    instructorInitials: 'НП',
    instructorAvatarColor: 'mint',
    instructorSpec: 'Горные лыжи · Шерегеш',
    rating: 5.0,
    dayNum: '3', dayMon: 'мая',
    timeRange: '11:00 — 11:45',
    lessonType: 'Детское занятие',
    meta: 'Заявка отправлена · 5 минут назад',
    price: '2 800 ₽',
  },
  {
    id: 'b3',
    status: 'completed',
    instructorId: 'marina',
    instructorName: 'Марина Волкова',
    instructorInitials: 'МВ',
    instructorAvatarColor: 'straw',
    instructorSpec: 'Горные лыжи · Шерегеш',
    rating: 4.8,
    dayNum: '15', dayMon: 'мар',
    timeRange: '14:00 — 15:00',
    lessonType: 'Индивидуальное занятие',
    meta: 'Прошло 6 недель',
    price: '2 500 ₽',
  },
];

const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: '● Подтверждено',
  pending:   '⏳ Ожидает подтверждения',
  completed: '✓ Завершено',
  cancelled: '✕ Отменено',
};

interface BookingsScreenProps {
  onChat: (instructorId: string) => void;
  onCancel?: (bookingId: string) => void;
  onLeaveReview?: (bookingId: string) => void;
  onBookAgain: (instructorId: string) => void;
}

/**
 * Экран «Мои занятия» (гость).
 */
export function BookingsScreen({ onChat, onCancel, onBookAgain }: BookingsScreenProps) {
  const { t } = useTranslation();

  const [bookings, setBookings]           = useState<Booking[]>(INITIAL_BOOKINGS);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewStars, setReviewStars]     = useState(5);
  const [reviewText, setReviewText]       = useState('');
  const [submittedIds, setSubmittedIds]   = useState<Set<string>>(new Set());
  const [toast, setToast]                 = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleCancel(bookingId: string) {
    setBookings(prev => prev.map(b =>
      b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
    ));
    onCancel?.(bookingId);
  }

  function handleSubmitReview() {
    if (!reviewBookingId) return;
    setSubmittedIds(prev => new Set([...prev, reviewBookingId]));
    setReviewBookingId(null);
    setReviewText('');
    setReviewStars(5);
    showToast('✓ Отзыв опубликован');
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const otherBookings   = bookings.filter(b => b.status !== 'pending');

  return (
    <div className={styles.screen}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.tbRow}>
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
                      onClick={() => onChat(b.id)}
                    >
                      💬 {t('bookings.chat')}
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
              style={b.status === 'completed' || b.status === 'cancelled' ? { opacity: .75 } : undefined}
            >
              {/* Status strip */}
              <div className={`${styles.bcStatus} ${styles[`bcStatus-${b.status}`]}`}>
                {STATUS_LABEL[b.status]}
              </div>

              {/* Body */}
              <div className={styles.bcBody}>
                {/* Row 1: avatar + info + rating */}
                <div className={styles.bcRow1}>
                  <div className={`${styles.av} ${styles.avMd} ${styles[`av-${b.instructorAvatarColor}`]}`}>
                    {b.instructorInitials}
                  </div>
                  <div className={styles.bcInstrInfo}>
                    <div className={styles.bcInstrName}>{b.instructorName}</div>
                    <div className={styles.bcInstrSpec}>{b.instructorSpec}</div>
                  </div>
                  <div className={styles.bcRating}>
                    <span className={styles.star}>★</span> {b.rating.toFixed(1)}
                  </div>
                </div>

                {/* Date block */}
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

                {/* Meta + price */}
                <div className={styles.bcMeta}>
                  <span>{b.meta}</span>
                  <span className={styles.bcPrice}>{b.price}</span>
                </div>

                {/* Actions */}
                <div className={styles.bcActions}>
                  {b.status === 'confirmed' && (
                    <>
                      <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSm}`} style={{ flex: 1 }} onClick={() => onChat(b.id)}>
                        💬 {t('bookings.chat')}
                      </button>
                      <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`} style={{ flex: 1 }} onClick={() => window.location.href = 'tel:+79000000000'}>
                        📞 {t('bookings.call')}
                      </button>
                    </>
                  )}
                  {b.status === 'completed' && (
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
                  {/* cancelled — no actions */}
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
            <textarea
              className={styles.reviewTextarea}
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Расскажите о занятии..."
              rows={4}
            />
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
