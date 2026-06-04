import { useEffect, useRef, useState } from 'react';
import styles from './DashboardScreen.module.css';
import { useTranslation } from '@/i18n/useTranslation';
import { getAcceptedLessons, getPendingRequests } from '@/store/bookings';

interface UpcomingLesson {
  id: string;
  day: string;
  mon: string;
  name: string;
  meta: string;
  price: string;
}

function buildLessons(): UpcomingLesson[] {
  return getAcceptedLessons('aleksey').map(b => ({
    id:    b.id,
    day:   b.dayNum,
    mon:   b.dayMon,
    name:  b.studentName,
    meta:  `${b.timeStart} · ${b.formatLabel}`,
    price: `${b.price.toLocaleString('ru')} ₽`,
  }));
}

interface DashboardScreenProps {
  onRequests:         () => void;
  onCalendar:         () => void;
  onBalance:          () => void;
  onReviews:          () => void;
  onNotifications:    () => void;
  onLesson:           (id: string) => void;
  onCreateMasterClass: () => void;
}

/**
 * Главный экран инструктора (Dashboard).
 * 1-в-1 копия из прототипа PROTOTYPE.html, секция scr-dashboard.
 * НИКАКИХ изменений дизайна без согласования.
 */
export function DashboardScreen({
  onRequests, onCalendar, onBalance, onReviews, onNotifications, onLesson, onCreateMasterClass,
}: DashboardScreenProps) {
  const { t } = useTranslation();
  const [onMountain, setOnMountain] = useState(false);
  const [lessons] = useState<UpcomingLesson[]>(buildLessons);
  const pendingCount = getPendingRequests('aleksey').length;
  const AUTO_OFF = 1 * 3600 + 47 * 60; // 1ч 47мин в секундах
  const [remaining, setRemaining] = useState(AUTO_OFF);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (onMountain) {
      setRemaining(AUTO_OFF);
      timerRef.current = setInterval(() => {
        setRemaining(s => {
          if (s <= 1) {
            clearInterval(timerRef.current!);
            setOnMountain(false);
            return AUTO_OFF;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRemaining(AUTO_OFF);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [onMountain]);

  function formatTimer(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}ч ${m}мин ${ss}с` : `${m}мин ${ss}с`;
  }

  return (
    <div className={styles.screen}>
      {/* ── Hero ── */}
      <div className={styles.dashNew}>
        <div className={styles.dashRow}>
          <div className={`${styles.av} ${styles.avMd}`}>АМ</div>
          <div className={styles.dashGreeting}>
            <div className={styles.dashHello}>{t('dashboard.hello')}</div>
            <div className={styles.dashName}>Алексей</div>
          </div>
          <div className={styles.dashStatusPill}>{t('dashboard.accepting')}</div>
          <button className={styles.dashBell} onClick={onNotifications} aria-label="Уведомления">
            <svg viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <div className={styles.notifDot} />
          </button>
        </div>
      </div>

      {/* ── Hero title strip (secondary bar) ── */}
      <div className={styles.dashTitleBar}>
        <h1 className={styles.dashTitle}>
          {t('dashboard.titleStart')} {t('dashboard.titleMid')} <em>{t('dashboard.titleAccent')}</em>
        </h1>
      </div>

      {/* ── Content ── */}
      <div className={styles.dashContent}>

        {/* Mountain toggle */}
        <div className={`${styles.mountainNew} ${onMountain ? styles.mountainActive : ''}`}>
          <div className={styles.mnIcon}>{onMountain ? '🏔️' : '⛰'}</div>
          <div className={styles.mnText}>
            <div className={styles.mnTitle}>
              {onMountain ? t('dashboard.mountainOn') : t('dashboard.mountainOff')}
            </div>
            {onMountain ? (
              <>
                <div className={styles.mnSub}>⏱ Автоотключение через</div>
                <div className={styles.mnSubTimer}>{formatTimer(remaining)}</div>
              </>
            ) : (
              <div className={styles.mnSub}>{t('dashboard.mountainHint')}</div>
            )}
          </div>
          <button
            className={`${styles.mnSwitch} ${onMountain ? styles.mnSwitchOn : ''}`}
            onClick={() => setOnMountain(v => !v)}
            aria-label="Статус на склоне"
          />
        </div>

        {/* Verify banner */}
        <div className={styles.verifyNew}>
          <div className={styles.verifyIcon}>⏳</div>
          <div>
            <div className={styles.verifyTitle}>{t('dashboard.verifyTitle')}</div>
            <div className={styles.verifySub}>{t('dashboard.verifySub')}</div>
          </div>
        </div>

        {/* Metric cards */}
        <div className={styles.mgridNew}>
          <div className={`${styles.mcard} ${styles.mcardAccent}`} onClick={onRequests}>
            <div className={styles.mcArrow}>↗</div>
            <div className={styles.mcTop}>
              <div className={styles.mcIcon}>✨</div>
              <div className={styles.mcLabel}>{t('dashboard.requests')}</div>
            </div>
            <div>
              <div className={styles.mcValue}>{pendingCount}</div>
              <div className={styles.mcDelta}>↑ {t('dashboard.newLabel')}</div>
            </div>
          </div>

          <div className={styles.mcard} onClick={onCalendar}>
            <div className={styles.mcArrow}>↗</div>
            <div className={styles.mcTop}>
              <div className={styles.mcIcon}>📅</div>
              <div className={styles.mcLabel}>{t('dashboard.lessons')}</div>
            </div>
            <div>
              <div className={styles.mcValue}>{lessons.length}</div>
              <div className={styles.mcSub}>{t('dashboard.today')}</div>
            </div>
          </div>

          <div className={styles.mcard} onClick={onBalance}>
            <div className={styles.mcArrow}>↗</div>
            <div className={styles.mcTop}>
              <div className={styles.mcIcon}>⚡</div>
              <div className={styles.mcLabel}>{t('dashboard.balance')}</div>
            </div>
            <div>
              <div className={`${styles.mcValue} ${styles.mcValueSm}`}>1 250 ₽</div>
              <div className={styles.mcSub}>~3 {t('dashboard.requests').toLowerCase()}</div>
            </div>
          </div>

          <div className={styles.mcard} onClick={onReviews}>
            <div className={styles.mcArrow}>↗</div>
            <div className={styles.mcTop}>
              <div className={styles.mcIcon}>⭐</div>
              <div className={styles.mcLabel}>{t('dashboard.rating')}</div>
            </div>
            <div>
              <div className={`${styles.mcValue} ${styles.mcValueGold}`}>4.9</div>
              <div className={styles.mcSub}>48 {t('dashboard.reviewsLabel')}</div>
            </div>
          </div>
        </div>

        {/* Upcoming lessons */}
        <div className={styles.secRowNew}>
          <div className={styles.secTitleNew}>{t('dashboard.upcoming')}</div>
          <button className={styles.secLinkNew} onClick={onCalendar}>
            {t('dashboard.calendar')} ↗
          </button>
        </div>

        {lessons.map(l => (
          <div key={l.id} className={styles.lcard} onClick={() => onLesson(l.id)}>
            <div className={styles.lcardDate}>
              <div className={styles.lcardDay}>{l.day}</div>
              <div className={styles.lcardMon}>{l.mon}</div>
            </div>
            <div className={styles.lcardInfo}>
              <div className={styles.lcardName}>{l.name}</div>
              <div className={styles.lcardMeta}>{l.meta}</div>
            </div>
            <div className={styles.lcardPrice}>{l.price}</div>
          </div>
        ))}

        {/* Master class CTA */}
        <div className={styles.mcCta} onClick={onCreateMasterClass}>
          <div className={styles.mcCtaLeft}>
            <div className={styles.mcCtaIcon}>🎿</div>
            <div>
              <div className={styles.mcCtaTitle}>Создать мастер-класс</div>
              <div className={styles.mcCtaSub}>Групповое занятие · до 30 участников</div>
            </div>
          </div>
          <span className={styles.mcCtaArrow}>→</span>
        </div>

        {/* Activity */}
        <div className={styles.actNew}>
          <div className={styles.actTitle}>{t('dashboard.activity')}</div>
          <div className={styles.actRow}>
            <span style={{ color: 'var(--text-dim)' }}>{t('dashboard.viewsWeek')}</span>
            <span style={{ fontWeight: 500 }}>142</span>
          </div>
          <div className={styles.actBar}>
            <div className={styles.actFill} style={{ width: '68%', background: 'var(--accent)' }} />
          </div>
          <div className={styles.actRow}>
            <span style={{ color: 'var(--text-dim)' }}>{t('dashboard.reqWeek')}</span>
            <span>
              <strong>3</strong>{' '}
              <span style={{ color: 'var(--text-dim)', fontWeight: 300, fontSize: 11 }}>из 142 · 2.1%</span>
            </span>
          </div>
          <div className={styles.actBar} style={{ marginBottom: 0 }}>
            <div className={styles.actFill} style={{ width: '21%', background: 'var(--success-on-light)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
