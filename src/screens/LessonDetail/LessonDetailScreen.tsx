import styles from './LessonDetailScreen.module.css';

interface LessonDetailScreenProps {
  lessonId?: string;
  onBack: () => void;
  onChat: () => void;
  onCancel: () => void;
}

// Static demo data — in real app resolved by lessonId
const LESSON = {
  status: 'confirmed' as 'confirmed' | 'pending',
  date: '28 апреля, понедельник',
  time: '10:00 — 12:00',
  duration: '2 часа',
  student: { initials: 'РЕ', name: 'Роман Ефимов', meta: 'Новичок · 1-е занятие' },
  format: 'Мини-группа (2 чел.)',
  discipline: 'Сноуборд',
  place: 'Касса Шерегеш, вход А',
  resort: 'Шерегеш',
  price: '7 000 ₽',
  note: 'Ученики — абсолютные новички. Снаряжение берут в прокате на месте.',
};

export function LessonDetailScreen({ onBack, onChat, onCancel }: LessonDetailScreenProps) {
  const confirmed = LESSON.status === 'confirmed';

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>‹</button>
        <div className={styles.headerStatus}>
          {confirmed ? '✓ Подтверждено' : '⏳ Ожидает подтверждения'}
        </div>
        <div className={styles.headerDate}>{LESSON.date}</div>
        <div className={styles.headerTime}>{LESSON.time} · {LESSON.duration}</div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.content}>

          {/* Student */}
          <div className={styles.secLabel}>Ученик</div>
          <div className={styles.studentCard} onClick={onChat}>
            <div className={styles.av}>{LESSON.student.initials}</div>
            <div className={styles.studentInfo}>
              <div className={styles.studentName}>{LESSON.student.name}</div>
              <div className={styles.studentMeta}>{LESSON.student.meta}</div>
            </div>
            <span className={styles.studentChevron}>›</span>
          </div>

          {/* Details */}
          <div className={styles.secLabel}>Детали занятия</div>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Формат</span>
              <span className={styles.infoValue}>{LESSON.format}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Дисциплина</span>
              <span className={styles.infoValue}>{LESSON.discipline}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Стоимость</span>
              <span className={`${styles.infoValue} ${styles.infoValueAccent}`}>{LESSON.price}</span>
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
              <span className={styles.infoValue}>{LESSON.resort}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Точка</span>
              <span className={styles.infoValue}>{LESSON.place}</span>
            </div>
          </div>
          <div className={styles.mapStub}>
            <div className={styles.mapIcon}>🗺</div>
            <span>Открыть на карте</span>
          </div>

          {/* Note */}
          {LESSON.note && (
            <>
              <div className={styles.secLabel}>Примечание</div>
              <div className={styles.infoCard}>
                <div className={styles.infoRow}>
                  <span style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{LESSON.note}</span>
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
