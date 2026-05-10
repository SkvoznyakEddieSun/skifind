import { useState } from 'react';
import styles from './MasterClassDetailScreen.module.css';
import { MASTER_CLASSES } from './masterClassData';

// ── Props ──────────────────────────────────────────────────────────────────

interface MasterClassDetailScreenProps {
  id: string;
  onBack:   () => void;
  onJoined: () => void; // → открывает групповой чат
}

// ── Component ──────────────────────────────────────────────────────────────

export function MasterClassDetailScreen({ id, onBack, onJoined }: MasterClassDetailScreenProps) {
  const mc = MASTER_CLASSES.find(m => m.id === id) ?? MASTER_CLASSES[0];
  const [joined, setJoined] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const left = mc.maxParticipants - mc.currentParticipants;
  const pct  = Math.round((mc.currentParticipants / mc.maxParticipants) * 100);

  function handleJoin() {
    if (joined || left === 0) return;
    setJoined(true);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onJoined();
    }, 1800);
  }

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>‹</button>
        <div className={styles.headerTitle} title={mc.title}>{mc.title}</div>
      </div>

      <div className={styles.scroll}>

        {/* Instructor card */}
        <div className={styles.instrCard}>
          <div className={`${styles.av} ${styles[`av-${mc.instructorAvatarColor}`]}`}>
            {mc.instructorInitials}
          </div>
          <div className={styles.instrInfo}>
            <div className={styles.instrName}>{mc.instructorName}</div>
            <div className={styles.instrSub}>
              {mc.sport === 'ski' ? 'Горные лыжи' : 'Сноуборд'} · ★{mc.instructorRating}
            </div>
          </div>
          <span className={`${styles.levelBadge} ${styles[`level-${mc.levelColor}`]}`}>
            {mc.levelLabel}
          </span>
        </div>

        <div className={styles.divider} />

        {/* Info grid */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}>📅</div>
            <div>
              <div className={styles.infoLabel}>Дата</div>
              <div className={styles.infoValue}>{mc.weekday}, {mc.date}</div>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}>🕐</div>
            <div>
              <div className={styles.infoLabel}>Время</div>
              <div className={styles.infoValue}>{mc.time}</div>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}>📍</div>
            <div>
              <div className={styles.infoLabel}>Место</div>
              <div className={styles.infoValue}>{mc.location}</div>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}>👥</div>
            <div>
              <div className={styles.infoLabel}>Участники</div>
              <div className={styles.infoValue}>{mc.currentParticipants} из {mc.maxParticipants}</div>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Description */}
        <div className={styles.sectionLabel}>О МАСТЕР-КЛАССЕ</div>
        <div className={styles.description}>{mc.description}</div>

        <div className={styles.divider} />

        {/* Participants */}
        <div className={styles.sectionLabel}>МЕСТА</div>
        <div className={styles.partsBlock}>
          <div className={styles.partsBar}>
            <div className={styles.partsFill} style={{ width: `${pct}%` }} />
          </div>
          <div className={styles.partsStats}>
            <span className={styles.partsTaken}>{mc.currentParticipants} занято</span>
            <span className={`${styles.partsLeft} ${left === 0 ? styles.partsLeftNone : ''}`}>
              {left > 0 ? `${left} свободно` : 'Мест нет'}
            </span>
          </div>

          {/* Participant dots */}
          <div className={styles.dotRow}>
            {Array.from({ length: mc.maxParticipants }, (_, i) => (
              <div
                key={i}
                className={`${styles.dot} ${i < mc.currentParticipants ? styles.dotFilled : ''}`}
              />
            ))}
          </div>
        </div>

        <div className={styles.divider} />

        {/* Price + CTA */}
        <div className={styles.bookBlock}>
          <div className={styles.bookPriceWrap}>
            <div className={styles.bookPrice}>{mc.price.toLocaleString('ru')} ₽</div>
            <div className={styles.bookPriceSub}>за участие</div>
          </div>
          <button
            className={`${styles.bookBtn} ${joined ? styles.bookBtnDone : ''} ${left === 0 ? styles.bookBtnFull : ''}`}
            onClick={handleJoin}
            disabled={joined || left === 0}
          >
            {joined
              ? '✓ Вы записаны'
              : left === 0
              ? 'Мест нет'
              : 'Записаться на мастер-класс'}
          </button>
        </div>

        <div style={{ height: 32 }} />
      </div>

      {/* Toast */}
      {showToast && (
        <div className={styles.toast}>
          ✓ Вы записаны! Открываем групповой чат…
        </div>
      )}
    </div>
  );
}
