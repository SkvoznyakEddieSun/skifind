import { useState, useEffect, useRef } from 'react';
import styles from './MasterClassDetailScreen.module.css';
import { MASTER_CLASSES } from './masterClassData';

// ── Helpers ────────────────────────────────────────────────────────────────

function minPartsLabel(n: number): string {
  if (n === 1) return '1 участник';
  if (n < 5)   return `${n} участника`;
  return `${n} участников`;
}

// ── Props ──────────────────────────────────────────────────────────────────

interface MasterClassDetailScreenProps {
  id: string;
  onBack:           () => void;
  onJoined:         () => void; // → открывает групповой чат
  isAlreadyJoined?: boolean;   // гость уже записан на этот МК
  onLeave?:         () => void; // вызывается при отмене записи
}

// ── Component ──────────────────────────────────────────────────────────────

export function MasterClassDetailScreen({
  id,
  onBack,
  onJoined,
  isAlreadyJoined = false,
  onLeave,
}: MasterClassDetailScreenProps) {
  // КРИТИЧНО 1: убран fallback на MASTER_CLASSES[0]
  const mc = MASTER_CLASSES.find(m => m.id === id);

  // КРИТИЧНО 2: joined инициализируется из isAlreadyJoined
  const [joined,    setJoined]    = useState(isAlreadyJoined);
  const [showToast, setShowToast] = useState(false);

  // БАГ-ФИX: чистим таймер тоста при размонтировании (swipe-back во время тоста)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // ── Empty state (КРИТИЧНО 1) ──────────────────────────────────────────────
  if (!mc) {
    return (
      <div className={styles.screen}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onBack}>‹</button>
          <div className={styles.headerTitle}>Мастер-класс</div>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔍</div>
          <div className={styles.emptyTitle}>Мастер-класс не найден</div>
          <div className={styles.emptySub}>
            Возможно, он был удалён или ссылка устарела.
          </div>
          <button className={styles.emptyBtn} onClick={onBack}>
            ← Назад к списку
          </button>
        </div>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const left = mc.maxParticipants - mc.currentParticipants;
  const pct  = Math.round((mc.currentParticipants / mc.maxParticipants) * 100);

  // МЕЛКОЕ 2: deadline calculation
  const now              = Date.now();
  const eventMs          = new Date(mc.eventDateISO).getTime();
  const deadlineMs       = eventMs - mc.bookingDeadlineHours * 3_600_000;
  const hoursUntilDeadline = (deadlineMs - now) / 3_600_000;
  const bookingClosed    = hoursUntilDeadline <= 0;
  const showDeadlineWarn = !bookingClosed && hoursUntilDeadline < 24;

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleJoin() {
    if (joined || left === 0 || bookingClosed) return;
    // TODO(backend): replace setJoined with POST /api/masterclass/:id/join
    // Backend must check participants atomically (race condition).
    setJoined(true);
    setShowToast(true);
    toastTimer.current = setTimeout(() => {
      setShowToast(false);
      onJoined();
    }, 1800);
  }

  function handleLeave() {
    setJoined(false);
    onLeave?.();
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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

        {/* Info grid 2×2 */}
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

        {/* КРИТИЧНО 3: минимум участников */}
        <div className={styles.minPartsWarning}>
          <span className={styles.minPartsIcon}>⚠</span>
          <span>
            Минимум: {minPartsLabel(mc.minParticipants)}.{' '}
            Если не наберётся — занятие будет отменено за {mc.bookingDeadlineHours} ч до начала, без штрафов.
          </span>
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
            {/* МЕЛКОЕ 2: deadline warning */}
            {showDeadlineWarn && !joined && (
              <div className={styles.deadlineWarn}>
                ⏰ Запись закроется через {Math.ceil(hoursUntilDeadline)} ч
              </div>
            )}
          </div>

          {/* КРИТИЧНО 2: состояние "уже записан" */}
          {joined ? (
            <button
              className={`${styles.bookBtn} ${styles.bookBtnLeave}`}
              onClick={handleLeave}
            >
              ✕ Отменить запись
            </button>
          ) : bookingClosed ? (
            <button className={`${styles.bookBtn} ${styles.bookBtnFull}`} disabled>
              Запись закрыта
            </button>
          ) : left === 0 ? (
            <button className={`${styles.bookBtn} ${styles.bookBtnFull}`} disabled>
              Мест нет
            </button>
          ) : (
            <button className={styles.bookBtn} onClick={handleJoin}>
              Записаться на мастер-класс
            </button>
          )}
        </div>

        <div style={{ height: 32 }} />
      </div>

      {/* Toast */}
      {showToast && (
        <div className={styles.toast}>
          ✓ Вы записаны! Открываем чат группы…
        </div>
      )}
    </div>
  );
}
