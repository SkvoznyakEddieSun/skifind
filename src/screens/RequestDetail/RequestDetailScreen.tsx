import { useState } from 'react';
import styles from './RequestDetailScreen.module.css';

interface RequestDetailScreenProps {
  requestId?: string;
  onBack: () => void;
  onChat: () => void;
  onAccepted?: () => void;
}

const REQUEST = {
  isNew: true,
  student: { initials: 'РЕ', name: 'Роман Ефимов', meta: 'Новичок · нет занятий' },
  time: 'сегодня, 11:42',
  message: 'Хотим с женой научиться с нуля. Можете взять сразу двоих? Снаряжение возьмём в прокате.',
  date: '28 апреля, 10:00',
  discipline: 'Сноуборд',
  level: 'Новички',
  format: 'Мини-группа (2 чел.)',
  resort: 'Шерегеш',
  price: '7 000 ₽',
  commission: '350 ₽ (5%)',
  source: 'С платформы ⚡',
};

export function RequestDetailScreen({ onBack, onChat, onAccepted }: RequestDetailScreenProps) {
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);

  function handleAccept() {
    setAccepted(true);
    onAccepted?.();
  }

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>‹</button>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>Заявка от {REQUEST.student.name}</div>
          <div className={styles.headerSub}>{REQUEST.time}</div>
        </div>
        {REQUEST.isNew && <span className={styles.newBadge}>Новая</span>}
      </div>

      <div className={styles.scroll}>
        <div className={styles.content}>

          {/* Student */}
          <div className={styles.secLabel}>Ученик</div>
          <div className={styles.studentCard}>
            <div className={styles.av}>{REQUEST.student.initials}</div>
            <div>
              <div className={styles.studentName}>{REQUEST.student.name}</div>
              <div className={styles.studentMeta}>{REQUEST.student.meta}</div>
            </div>
          </div>

          {/* Message */}
          <div className={styles.secLabel}>Сообщение</div>
          <div className={styles.msgBubble}>
            <div className={styles.msgText}>{REQUEST.message}</div>
          </div>

          {/* Lesson info */}
          <div className={styles.secLabel}>Параметры занятия</div>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Дата и время</span>
              <span className={styles.infoValue}>{REQUEST.date}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Дисциплина</span>
              <span className={styles.infoValue}>{REQUEST.discipline}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Уровень</span>
              <span className={styles.infoValue}>{REQUEST.level}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Формат</span>
              <span className={styles.infoValue}>{REQUEST.format}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Курорт</span>
              <span className={styles.infoValue}>{REQUEST.resort}</span>
            </div>
          </div>

          {/* Price */}
          <div className={styles.secLabel}>Стоимость</div>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Сумма</span>
              <span className={`${styles.infoValue} ${styles.infoValueAccent}`}>{REQUEST.price}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Источник</span>
              <span className={styles.infoValue}>{REQUEST.source}</span>
            </div>
          </div>
          <div className={styles.commNote}>
            ⚡ Комиссия платформы {REQUEST.commission} — списывается при подтверждении
          </div>

          {/* Actions */}
          {declined ? (
            <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>
              Заявка отклонена
            </div>
          ) : accepted ? (
            <div className={styles.acceptedBanner}>✓ Заявка принята</div>
          ) : (
            <div className={styles.actions}>
              <div className={styles.actRow}>
                <button className={styles.btnAccept} onClick={handleAccept}>✓ Принять</button>
                <button className={styles.btnChat} onClick={onChat}>💬 Написать</button>
              </div>
              <button className={styles.btnDecline} onClick={() => setDeclined(true)}>
                Отказать
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
