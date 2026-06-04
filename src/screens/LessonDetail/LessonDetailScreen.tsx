import styles from './LessonDetailScreen.module.css';
import { getBookingById } from '@/store/bookings';

const DISCIPLINE_LABEL: Record<string, string> = {
  ski:   'Горные лыжи',
  board: 'Сноуборд',
};

// Статичный фолбэк если lessonId не найден (например, при открытии без ID)
const FALLBACK = {
  status:     'confirmed' as const,
  date:       '28 апреля, понедельник',
  time:       '10:00 — 12:00',
  duration:   '2 часа',
  student:    { initials: 'РЕ', name: 'Роман Ефимов', meta: 'Новичок · 1-е занятие' },
  format:     'Мини-группа (2 чел.)',
  discipline: 'Сноуборд',
  place:      'Касса Шерегеш, вход А',
  resort:     'Шерегеш',
  price:      '7 000 ₽',
  note:       'Ученики — абсолютные новички. Снаряжение берут в прокате на месте.',
};

const MONTH_FULL = [
  'января','февраля','марта','апреля','мая','июня',
  'июля','августа','сентября','октября','ноября','декабря',
];

const DAY_FULL = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];

interface LessonDetailScreenProps {
  lessonId?: string;
  onBack:    () => void;
  onChat:    () => void;
  onCancel:  () => void;
}

export function LessonDetailScreen({ lessonId, onBack, onChat, onCancel }: LessonDetailScreenProps) {
  const booking = lessonId ? getBookingById(lessonId) : undefined;

  const data = booking
    ? (() => {
        const d = new Date(booking.dateISO);
        return {
          status:     'confirmed' as const,
          date:       `${d.getDate()} ${MONTH_FULL[d.getMonth()]}, ${DAY_FULL[d.getDay()]}`,
          time:       `${booking.timeStart} — ${booking.timeEnd}`,
          duration:   '',
          student:    {
            initials: booking.studentInitials,
            name:     booking.studentName,
            meta:     `${booking.level} · ${booking.formatLabel}`,
          },
          format:     booking.formatLabel,
          discipline: DISCIPLINE_LABEL[booking.discipline] ?? booking.discipline,
          place:      'Уточните у ученика',
          resort:     'Шерегеш',
          price:      `${booking.price.toLocaleString('ru')} ₽`,
          note:       booking.message || '',
        };
      })()
    : FALLBACK;

  const confirmed = data.status === 'confirmed';

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTopRow}>
          <button className={styles.backBtn} onClick={onBack}>‹</button>
          <div className={styles.headerTitle}>Занятие</div>
        </div>
        <div className={styles.headerStatus}>
          {confirmed ? '✓ Подтверждено' : '⏳ Ожидает подтверждения'}
        </div>
        <div className={styles.headerDate}>{data.date}</div>
        <div className={styles.headerTime}>
          {data.time}{data.duration ? ` · ${data.duration}` : ''}
        </div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.content}>

          {/* Student */}
          <div className={styles.secLabel}>Ученик</div>
          <div className={styles.studentCard} onClick={onChat}>
            <div className={styles.av}>{data.student.initials}</div>
            <div className={styles.studentInfo}>
              <div className={styles.studentName}>{data.student.name}</div>
              <div className={styles.studentMeta}>{data.student.meta}</div>
            </div>
            <span className={styles.studentChevron}>›</span>
          </div>

          {/* Details */}
          <div className={styles.secLabel}>Детали занятия</div>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Формат</span>
              <span className={styles.infoValue}>{data.format}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Дисциплина</span>
              <span className={styles.infoValue}>{data.discipline}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Стоимость</span>
              <span className={`${styles.infoValue} ${styles.infoValueAccent}`}>{data.price}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Статус</span>
              <span className={`${styles.statusBadge} ${confirmed ? styles.statusConfirmed : styles.statusPending}`}>
                {confirmed ? '✓ Подтверждено' : '⏳ Ожидает'}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className={styles.secLabel}>Место встречи</div>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Курорт</span>
              <span className={styles.infoValue}>{data.resort}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Точка</span>
              <span className={styles.infoValue}>{data.place}</span>
            </div>
          </div>
          <div className={styles.mapStub}>
            <div className={styles.mapIcon}>🗺</div>
            <span>Открыть на карте</span>
          </div>

          {/* Note */}
          {data.note && (
            <>
              <div className={styles.secLabel}>Примечание от ученика</div>
              <div className={styles.infoCard}>
                <div className={styles.infoRow}>
                  <span style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{data.note}</span>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={onChat}>💬 Написать</button>
            <button className={styles.btnDanger} onClick={onCancel}>Отменить</button>
          </div>

        </div>
      </div>
    </div>
  );
}
