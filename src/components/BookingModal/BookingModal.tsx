import { useState } from 'react';
import styles from './BookingModal.module.css';
import { useTranslation } from '@/i18n/useTranslation';

interface BookFormat {
  label: string;
  sub: string;
  price: number;
  priceLabel: string;
}

const FORMATS: BookFormat[] = [
  { label: 'Индивидуальное', sub: '1 час · один на один',    price: 3500,  priceLabel: '3 500 ₽' },
  { label: 'Полдня',         sub: '4 часа · глубокая работа', price: 10000, priceLabel: '10 000 ₽' },
  { label: 'Мини-группа',    sub: '2 часа · до 3 человек',   price: 5000,  priceLabel: '5 000 ₽' },
  { label: 'Детское',        sub: '45 минут · для детей',    price: 2800,  priceLabel: '2 800 ₽' },
];

const TIME_SLOTS = ['9:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

interface BookingModalProps {
  instructorName: string;
  instructorInitials: string;
  instructorAvatarColor: string;
  onClose: () => void;
  onSubmit: (data: { format: BookFormat; date: string; time: string; comment: string }) => void;
}

/**
 * Модальное окно бронирования (bottom sheet).
 * 1-в-1 копия из прототипа PROTOTYPE.html, секция #bookingModal.
 * НИКАКИХ изменений дизайна без согласования.
 */
export function BookingModal({
  instructorName,
  instructorInitials,
  instructorAvatarColor,
  onClose,
  onSubmit,
}: BookingModalProps) {
  const { t } = useTranslation();
  const [selectedFormat, setSelectedFormat] = useState(0);
  const [date, setDate] = useState(tomorrow());
  const [time, setTime] = useState('10:00');
  const [comment, setComment] = useState('');

  function handleSubmit() {
    if (!date) return;
    onSubmit({ format: FORMATS[selectedFormat], date, time, comment });
  }

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.sheet}>
        <div className={styles.handle} />

        {/* Header */}
        <div className={styles.header}>
          <div className={`${styles.av} ${styles.avMd} ${styles[`av-${instructorAvatarColor}`]}`}>
            {instructorInitials}
          </div>
          <div className={styles.instrName}>{instructorName}</div>
          <div className={styles.instrSub}>{t('booking.pickFormatAndTime')}</div>
        </div>

        {/* Format */}
        <div className={styles.sectionLabel}>{t('booking.format')}</div>
        <div className={styles.formats}>
          {FORMATS.map((f, i) => (
            <button
              key={f.label}
              className={`${styles.formatBtn} ${selectedFormat === i ? styles.formatBtnSelected : ''}`}
              onClick={() => setSelectedFormat(i)}
            >
              <div className={styles.formatRow}>
                <div>
                  <div className={styles.formatLabel}>{f.label}</div>
                  <div className={styles.formatSub}>{f.sub}</div>
                </div>
                <div className={styles.formatPrice}>{f.priceLabel}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Date */}
        <div className={styles.sectionLabel}>{t('booking.date')}</div>
        <input
          type="date"
          className="input-field input-field--left"
          value={date}
          onChange={e => setDate(e.target.value)}
        />

        {/* Time */}
        <div className={styles.sectionLabel}>{t('booking.time')}</div>
        <select
          className={styles.input}
          value={time}
          onChange={e => setTime(e.target.value)}
        >
          {TIME_SLOTS.map(slot => (
            <option key={slot} value={slot}>{slot}</option>
          ))}
        </select>

        {/* Comment */}
        <div className={styles.sectionLabel}>{t('booking.comment')}</div>
        <textarea
          className="input-field input-field--textarea"
          placeholder={t('booking.commentPlaceholder')}
          value={comment}
          onChange={e => setComment(e.target.value)}
        />

        {/* Payment info */}
        <div className={styles.paymentInfo}>
          <strong>{t('booking.payment')}</strong> — {t('booking.paymentText')}
        </div>

        {/* Buttons */}
        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} style={{ flex: 1 }} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ flex: 2 }} onClick={handleSubmit}>
            {t('booking.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
