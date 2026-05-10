import { useState } from 'react';
import styles from './MasterClassCatalogScreen.module.css';
import { MASTER_CLASSES, type McSport } from './masterClassData';

// ── Helpers ────────────────────────────────────────────────────────────────

function spotsLeft(mc: { maxParticipants: number; currentParticipants: number }) {
  return mc.maxParticipants - mc.currentParticipants;
}

function spotsLabel(n: number): string {
  if (n === 0) return 'Мест нет';
  if (n === 1) return 'Осталось 1 место';
  if (n < 5)  return `Осталось ${n} места`;
  return `Осталось ${n} мест`;
}

function fillPct(mc: { maxParticipants: number; currentParticipants: number }) {
  return Math.round((mc.currentParticipants / mc.maxParticipants) * 100);
}

// ── Props ──────────────────────────────────────────────────────────────────

interface MasterClassCatalogScreenProps {
  onBack:   () => void;
  onDetail: (id: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function MasterClassCatalogScreen({ onBack, onDetail }: MasterClassCatalogScreenProps) {
  const [sport, setSport] = useState<McSport | 'all'>('all');

  const filtered = MASTER_CLASSES.filter(
    mc => sport === 'all' || mc.sport === sport,
  );

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>‹</button>
        <div className={styles.headerTitle}>Мастер-классы</div>
      </div>

      {/* Sport filter */}
      <div className={styles.filterRow}>
        {(['all', 'ski', 'board'] as const).map(s => (
          <button
            key={s}
            className={`${styles.filterChip} ${sport === s ? styles.filterChipActive : ''}`}
            onClick={() => setSport(s)}
          >
            {s === 'all' ? 'Все' : s === 'ski' ? '🎿 Лыжи' : '🏂 Сноуборд'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className={styles.scroll}>
        <div className={styles.sectionLabel}>
          БЛИЖАЙШИЕ · {filtered.length} МЕРОПРИЯТИЯ
        </div>

        {filtered.map(mc => (
          <div key={mc.id} className={styles.card} onClick={() => onDetail(mc.id)}>

            {/* Top row */}
            <div className={styles.cardTop}>
              <div className={`${styles.av} ${styles[`av-${mc.instructorAvatarColor}`]}`}>
                {mc.instructorInitials}
              </div>
              <div className={styles.cardInfo}>
                <div className={styles.cardTitle}>{mc.title}</div>
                <div className={styles.cardInstr}>
                  {mc.instructorName} · ★{mc.instructorRating}
                </div>
              </div>
              <span className={`${styles.levelBadge} ${styles[`level-${mc.levelColor}`]}`}>
                {mc.levelLabel}
              </span>
            </div>

            {/* Meta row */}
            <div className={styles.cardMeta}>
              <span>📅 {mc.weekday} {mc.date}</span>
              <span>🕐 {mc.time}</span>
              <span>📍 {mc.location.split(',')[0]}</span>
            </div>

            {/* Participants bar */}
            <div className={styles.partsRow}>
              <div className={styles.partsBar}>
                <div className={styles.partsFill} style={{ width: `${fillPct(mc)}%` }} />
              </div>
              <span className={styles.partsTxt}>
                {mc.currentParticipants}/{mc.maxParticipants}
              </span>
            </div>

            {/* Bottom */}
            <div className={styles.cardBottom}>
              <div>
                <div className={styles.cardPrice}>{mc.price.toLocaleString('ru')} ₽</div>
                <div className={`${styles.spotsLeft} ${spotsLeft(mc) === 0 ? styles.spotsNone : ''}`}>
                  {spotsLabel(spotsLeft(mc))}
                </div>
              </div>
              <button
                className={styles.detailBtn}
                onClick={e => { e.stopPropagation(); onDetail(mc.id); }}
              >
                Подробнее →
              </button>
            </div>
          </div>
        ))}

        <div style={{ height: 32 }} />
      </div>
    </div>
  );
}
