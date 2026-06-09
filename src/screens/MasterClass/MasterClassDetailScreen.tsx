import { useState, useEffect, useRef } from 'react';
import styles from './MasterClassDetailScreen.module.css';
import { MASTER_CLASSES, MC_PARTICIPANTS } from './masterClassData';
import { Icon } from '@/components/Icon/Icon';
import { minPartsLabel } from '@/utils/masterClassHelpers';

// ── Props ──────────────────────────────────────────────────────────────────

interface MasterClassDetailScreenProps {
  id: string;
  onBack:                () => void;
  onJoined:              () => void;  // → открывает групповой чат
  isAlreadyJoined?:      boolean;    // гость уже записан на этот МК
  onLeave?:              () => void;  // вызывается при отмене записи
  onInstructorProfile?:  (instructorId: string) => void;
  /** Роль просматривающего: инструктор видит список участников и кнопку отмены МК */
  role?:                 'instructor' | 'guest';
  /** Инструктор отменяет МК — вызывается после тоста */
  onCancel?:             () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function MasterClassDetailScreen({
  id,
  onBack,
  onJoined,
  isAlreadyJoined = false,
  onLeave,
  onInstructorProfile,
  role = 'guest',
  onCancel,
}: MasterClassDetailScreenProps) {
  const mc = MASTER_CLASSES.find(m => m.id === id);

  const [joined,    setJoined]    = useState(isAlreadyJoined);
  const [toastText, setToastText] = useState<string | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!mc) {
    return (
      <div className={styles.screen}>
        <div className={styles.topbar}>
          <div className={styles.tbRow}>
            <button className={styles.tbBack} onClick={onBack}>‹</button>
            <div style={{ flex: 1 }}>
              <div className={styles.tbTitle}>Мастер-класс</div>
            </div>
          </div>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><Icon name="search" size={28} /></div>
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

  // ── Derived values ────────────────────────────────────────────────────────
  const count = mc.participants.length;
  const left  = mc.maxParticipants - count;
  const pct   = Math.round((count / mc.maxParticipants) * 100);

  const now              = Date.now();
  const eventMs          = new Date(mc.eventDateISO).getTime();
  const deadlineMs       = eventMs - mc.bookingDeadlineHours * 3_600_000;
  const hoursUntilDeadline = (deadlineMs - now) / 3_600_000;
  const bookingClosed    = hoursUntilDeadline <= 0;
  const showDeadlineWarn = !bookingClosed && hoursUntilDeadline < 24;

  const isInstructor = role === 'instructor';

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleJoin() {
    if (joined || left === 0 || bookingClosed) return;
    setJoined(true);
    setToastText('✓ Вы записаны! Открываем чат группы…');
    toastTimer.current = setTimeout(() => {
      setToastText(null);
      onJoined();
    }, 1800);
  }

  function handleLeave() {
    setJoined(false);
    onLeave?.();
  }

  function handleCancelMc() {
    setToastText('Мастер-класс отменён');
    toastTimer.current = setTimeout(() => {
      setToastText(null);
      // Очищаем список участников в shared store
      mc.participants.splice(0, mc.participants.length);
      onCancel?.();
    }, 1800);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.topbar}>
        <div className={styles.tbRow}>
          <button className={styles.tbBack} onClick={onBack}>‹</button>
          <div style={{ flex: 1 }}>
            <div className={styles.tbTitle} title={mc.title}>{mc.title}</div>
          </div>
        </div>
      </div>

      <div className={styles.scroll}>

        {/* Instructor card */}
        <div
          className={`${styles.instrCard} ${onInstructorProfile ? styles.instrCardClickable : ''}`}
          onClick={() => onInstructorProfile?.(mc.instructorId)}
          role={onInstructorProfile ? 'button' : undefined}
          tabIndex={onInstructorProfile ? 0 : undefined}
          onKeyDown={e => e.key === 'Enter' && onInstructorProfile?.(mc.instructorId)}
        >
          <div className={`${styles.av} ${styles[`av-${mc.instructorAvatarColor}`]}`}>
            {mc.instructorInitials}
          </div>
          <div className={styles.instrInfo}>
            <div className={styles.instrName}>{mc.instructorName}</div>
            <div className={styles.instrSub}>
              {mc.sport === 'ski' ? 'Горные лыжи' : 'Сноуборд'} · ★{mc.instructorRating}
            </div>
          </div>
          <div className={styles.instrCardRight}>
            <span className={`${styles.levelBadge} ${styles[`level-${mc.levelColor}`]}`}>
              {mc.levelLabel}
            </span>
            {onInstructorProfile && (
              <span className={styles.instrArrow}>›</span>
            )}
          </div>
        </div>

        <div className={styles.divider} />

        {/* Info grid 2×2 */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}><Icon name="calendar" /></div>
            <div>
              <div className={styles.infoLabel}>Дата</div>
              <div className={styles.infoValue}>{mc.weekday}, {mc.date}</div>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}><Icon name="clock" /></div>
            <div>
              <div className={styles.infoLabel}>Время</div>
              <div className={styles.infoValue}>{mc.time}</div>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}><Icon name="map-pin" /></div>
            <div>
              <div className={styles.infoLabel}>Место</div>
              <div className={styles.infoValue}>{mc.location}</div>
            </div>
          </div>
          <div className={styles.infoItem}>
            <div className={styles.infoIcon}><Icon name="users" /></div>
            <div>
              <div className={styles.infoLabel}>Участники</div>
              <div className={styles.infoValue}>{count} из {mc.maxParticipants}</div>
            </div>
          </div>
        </div>

        {/* Минимум участников */}
        {count < mc.minParticipants && (
          <div className={styles.minPartsWarning}>
            <Icon name="alert-triangle" size={14} />
            <span>
              Минимум: {minPartsLabel(mc.minParticipants)}.<br />
              Если не наберётся — занятие будет отменено за {mc.bookingDeadlineHours}ч до начала.
            </span>
          </div>
        )}

        <div className={styles.divider} />

        {/* Description */}
        <div className={styles.sectionLabel}>О МАСТЕР-КЛАССЕ</div>
        <div className={styles.description}>{mc.description}</div>

        <div className={styles.divider} />

        {/* ── Participants section ─────────────────────────────────────────── */}
        {isInstructor ? (
          /* Instructor: full participant list */
          <>
            <div className={styles.sectionLabel}>УЧАСТНИКИ</div>
            <div className={styles.partsCountLabel}>
              {count} / {mc.maxParticipants} участников
            </div>
            <div className={styles.participantList}>
              {mc.participants.length === 0 ? (
                <div className={styles.participantEmpty}>Никто ещё не записался</div>
              ) : (
                mc.participants.map(pid => {
                  const p = MC_PARTICIPANTS[pid] ?? {
                    name: pid,
                    initials: pid.slice(0, 2).toUpperCase(),
                    color: 'ice' as const,
                  };
                  return (
                    <div key={pid} className={styles.participantItem}>
                      <div className={`${styles.av} ${styles[`av-${p.color}`]}`}>{p.initials}</div>
                      <div className={styles.participantName}>{p.name}</div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* Guest: counter + progress bar + dots */
          <>
            <div className={styles.sectionLabel}>МЕСТА</div>
            <div className={styles.partsBlock}>
              <div className={styles.partsBar}>
                <div className={styles.partsFill} style={{ width: `${pct}%` }} />
              </div>
              <div className={styles.partsStats}>
                <span className={styles.partsTaken}>{count} занято</span>
                <span className={`${styles.partsLeft} ${left === 0 ? styles.partsLeftNone : ''}`}>
                  {left > 0 ? `${left} свободно` : 'Мест нет'}
                </span>
              </div>

              {/* Participant dots */}
              <div className={styles.dotRow}>
                {Array.from({ length: mc.maxParticipants }, (_, i) => (
                  <div
                    key={i}
                    className={`${styles.dot} ${i < count ? styles.dotFilled : ''}`}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        <div className={styles.divider} />

        {/* ── CTA block ────────────────────────────────────────────────────── */}
        <div className={styles.bookBlock}>
          <div className={styles.bookPriceWrap}>
            <div className={styles.bookPrice}>{mc.price.toLocaleString('ru')} ₽</div>
            <div className={styles.bookPriceSub}>за участие</div>
          </div>

          {isInstructor ? (
            /* Instructor: cancel MK button */
            onCancel ? (
              <button
                className={`${styles.bookBtn} ${styles.bookBtnLeave}`}
                onClick={handleCancelMc}
                disabled={!!toastText}
              >
                ✕ Отменить МК
              </button>
            ) : (
              /* Instructor viewing without cancel capability (e.g. another instructor's MK) */
              <button className={`${styles.bookBtn} ${styles.bookBtnFull}`} disabled>
                Только просмотр
              </button>
            )
          ) : (
            /* Guest: join / leave / full / closed */
            joined ? (
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
                Записаться
              </button>
            )
          )}
        </div>

        {/* Deadline warning (guest only) */}
        {!isInstructor && showDeadlineWarn && !joined && (
          <div className={styles.deadlineWarn}>
            <Icon name="bell" size={12} /> Запись закроется через {Math.ceil(hoursUntilDeadline)} ч
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>

      {/* Toast */}
      {toastText && (
        <div className={styles.toast}>
          {toastText}
        </div>
      )}
    </div>
  );
}
