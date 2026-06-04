import { useState } from 'react';
import styles from './RequestDetailScreen.module.css';
import {
  getBookingById,
  acceptBooking,
  declineBooking,
  getCommission,
} from '@/store/bookings';

// Дефолтные данные — показываются если requestId не найден
const FALLBACK = {
  studentInitials: 'РЕ',
  studentName:     'Роман Ефимов',
  studentMeta:     'Новичок · нет занятий',
  time:            'сегодня, 11:42',
  message:         'Хотим с женой научиться с нуля. Можете взять сразу двоих? Снаряжение возьмём в прокате.',
  date:            '28 апреля, 10:00',
  discipline:      'Сноуборд',
  level:           'Новички',
  format:          'Мини-группа (2 чел.)',
  resort:          'Шерегеш',
  price:           '7 000 ₽',
  commission:      '350 ₽ (5%)',
};

const DISCIPLINE_LABEL: Record<string, string> = {
  ski:   'Горные лыжи',
  board: 'Сноуборд',
};

interface RequestDetailScreenProps {
  requestId?: string;
  onBack:     () => void;
  onChat:     () => void;
  onAccepted?: () => void;
}

export function RequestDetailScreen({ requestId, onBack, onChat, onAccepted }: RequestDetailScreenProps) {
  const booking = requestId ? getBookingById(requestId) : undefined;

  // Собираем данные для отображения
  const data = booking
    ? {
        studentInitials: booking.studentInitials,
        studentName:     booking.studentName,
        studentMeta:     `${booking.level} · ${booking.formatLabel}`,
        time:            booking.createdAt,
        message:         booking.message,
        date:            `${booking.dayNum} ${booking.dayMon}, ${booking.timeStart}`,
        discipline:      DISCIPLINE_LABEL[booking.discipline] ?? booking.discipline,
        level:           booking.level,
        format:          booking.formatLabel,
        resort:          'Шерегеш',
        price:           `${booking.price.toLocaleString('ru')} ₽`,
        commission:      `${getCommission(booking.price).toLocaleString('ru')} ₽ (5%)`,
      }
    : FALLBACK;

  const initialStatus = booking
    ? (booking.status === 'accepted' ? 'accepted' : booking.status === 'declined' ? 'declined' : 'pending')
    : 'pending';

  const [status, setStatus] = useState<'pending' | 'accepted' | 'declined'>(initialStatus);

  function handleAccept() {
    if (requestId) acceptBooking(requestId);
    setStatus('accepted');
    onAccepted?.();
  }

  function handleDecline() {
    if (requestId) declineBooking(requestId);
    setStatus('declined');
  }

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>‹</button>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>Заявка от {data.studentName}</div>
          <div className={styles.headerSub}>{data.time}</div>
        </div>
        {status === 'pending' && <span className={styles.newBadge}>Новая</span>}
      </div>

      <div className={styles.scroll}>
        <div className={styles.content}>

          {/* Student */}
          <div className={styles.secLabel}>Ученик</div>
          <div className={styles.studentCard}>
            <div className={styles.av}>{data.studentInitials}</div>
            <div>
              <div className={styles.studentName}>{data.studentName}</div>
              <div className={styles.studentMeta}>{data.studentMeta}</div>
            </div>
          </div>

          {/* Message */}
          {data.message ? (
            <>
              <div className={styles.secLabel}>Сообщение</div>
              <div className={styles.msgBubble}>
                <div className={styles.msgText}>{data.message}</div>
              </div>
            </>
          ) : null}

          {/* Lesson info */}
          <div className={styles.secLabel}>Параметры занятия</div>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Дата и время</span>
              <span className={styles.infoValue}>{data.date}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Дисциплина</span>
              <span className={styles.infoValue}>{data.discipline}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Уровень</span>
              <span className={styles.infoValue}>{data.level}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Формат</span>
              <span className={styles.infoValue}>{data.format}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Курорт</span>
              <span className={styles.infoValue}>{data.resort}</span>
            </div>
          </div>

          {/* Price */}
          <div className={styles.secLabel}>Стоимость</div>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Сумма</span>
              <span className={`${styles.infoValue} ${styles.infoValueAccent}`}>{data.price}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Источник</span>
              <span className={styles.infoValue}>С платформы ⚡</span>
            </div>
          </div>
          <div className={styles.commNote}>
            ⚡ Комиссия платформы {data.commission} — списывается при подтверждении
          </div>

          {/* Actions */}
          {status === 'declined' ? (
            <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>
              Заявка отклонена
            </div>
          ) : status === 'accepted' ? (
            <div className={styles.acceptedBanner}>✓ Заявка принята · Ученик добавлен</div>
          ) : (
            <div className={styles.actions}>
              <div className={styles.actRow}>
                <button className={styles.btnAccept} onClick={handleAccept}>✓ Принять</button>
                <button className={styles.btnChat} onClick={onChat}>💬 Написать</button>
              </div>
              <button className={styles.btnDecline} onClick={handleDecline}>
                Отказать
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
