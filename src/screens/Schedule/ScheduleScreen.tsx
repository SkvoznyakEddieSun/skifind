import { useState, useMemo, useRef, useCallback } from 'react';
import styles from './ScheduleScreen.module.css';
import { ScrollToTopBtn } from '@/components/ScrollToTopBtn';
import { getAcceptedLessons } from '@/store/bookings';
import { useTabSwipe } from '@/hooks/useTabSwipe';
import { Icon } from '@/components/Icon/Icon';

// ── Types ──────────────────────────────────────────────────────────────────

type ScheduleTab = 'lessons' | 'available' | 'settings';

interface Booking {
  id: string;
  date: Date;
  timeStart: string;
  timeEnd: string;
  clientName: string;
  discipline: string;
  price: number;
  format: string;
  group: 'today' | 'tomorrow' | 'week' | 'later';
}

interface Slot {
  id: string;
  timeStart: string;
  timeEnd: string;
  status: 'available' | 'blocked' | 'booked';
  label: string;
}

/** Конфиг одного дня недели */
interface DaySchedule {
  dow: number;      // 0=Вс, 1=Пн … 6=Сб
  label: string;   // 'Пн', 'Вт', …
  enabled: boolean;
  startTime: string;
  endTime: string;
}

/** Внутренний конфиг для генерации слотов */
interface DayConfig {
  startTime: string;
  endTime: string;
  breakEnabled: boolean;
  breakStart: string;
  breakEnd: string;
}

interface GeneratedSlot {
  start: string;
  end: string;
  tooShort: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const MONTH_RU  = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const DAY_SHORT = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
}

// Длительность слота фиксирована 60 мин — ученик выбирает продолжительность при записи
const SLOT_DURATION = 60;

/** Свободное окно целиком (не нарезанное по часам) */
interface FreeWindow {
  start: string;
  end: string;
  minutes: number;
}

/** Возвращает непрерывные свободные промежутки дня (с учётом обеда) */
function generateFreeWindows(cfg: DayConfig): FreeWindow[] {
  const intervals: { start: string; end: string }[] = cfg.breakEnabled && cfg.breakStart && cfg.breakEnd
    ? [{ start: cfg.startTime, end: cfg.breakStart }, { start: cfg.breakEnd, end: cfg.endTime }]
    : [{ start: cfg.startTime, end: cfg.endTime }];
  return intervals
    .map(iv => ({ start: iv.start, end: iv.end, minutes: timeToMinutes(iv.end) - timeToMinutes(iv.start) }))
    .filter(w => w.minutes > 0);
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

function generatePreviewSlots(cfg: DayConfig, slotDuration: number, buffer: number): GeneratedSlot[] {
  const slots: GeneratedSlot[] = [];
  const intervals: { start: string; end: string }[] = [];
  if (cfg.breakEnabled && cfg.breakStart && cfg.breakEnd) {
    intervals.push({ start: cfg.startTime, end: cfg.breakStart });
    intervals.push({ start: cfg.breakEnd,  end: cfg.endTime });
  } else {
    intervals.push({ start: cfg.startTime, end: cfg.endTime });
  }
  for (const interval of intervals) {
    let current = timeToMinutes(interval.start);
    const end   = timeToMinutes(interval.end);
    while (current + slotDuration <= end) {
      slots.push({ start: minutesToTime(current), end: minutesToTime(current + slotDuration), tooShort: false });
      current += slotDuration + buffer;
    }
    if (current < end && current + slotDuration > end) {
      slots.push({ start: minutesToTime(current), end: minutesToTime(end), tooShort: true });
    }
  }
  return slots;
}

function generateSlotsForDay(date: Date, cfg: DayConfig, slotDuration: number, buffer: number): Slot[] {
  return generatePreviewSlots(cfg, slotDuration, buffer)
    .filter(p => !p.tooShort)
    .map((p, i) => ({
      id: `${date.toISOString().slice(0,10)}-${i}`,
      timeStart: p.start,
      timeEnd:   p.end,
      status: 'available' as const,
      label: 'Свободно для индивидуальных',
    }));
}

// ── Mock data ──────────────────────────────────────────────────────────────

const today    = new Date(); today.setHours(0,0,0,0);
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);
const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 8);

const MOCK_BOOKINGS: Booking[] = [
  { id:'b1', date:today,    timeStart:'10:00', timeEnd:'11:30', clientName:'Кирилл Волков',   discipline:'Сноуборд',    price:7000, format:'Индивидуал',   group:'today'    },
  { id:'b2', date:today,    timeStart:'13:00', timeEnd:'14:30', clientName:'Мария Смирнова',  discipline:'Горные лыжи', price:5000, format:'Мини-группа', group:'today'    },
  { id:'b3', date:tomorrow, timeStart:'09:30', timeEnd:'11:00', clientName:'Артём Лебедев',   discipline:'Сноуборд',    price:7000, format:'Индивидуал',   group:'tomorrow' },
  { id:'b4', date:dayAfter, timeStart:'11:00', timeEnd:'12:30', clientName:'Ольга Кузнецова', discipline:'Горные лыжи', price:4000, format:'Детское',      group:'week'     },
  { id:'b5', date:nextWeek, timeStart:'10:00', timeEnd:'11:30', clientName:'Павел Иванов',    discipline:'Сноуборд',    price:7000, format:'Индивидуал',   group:'later'    },
];

// По умолчанию: Пн–Пт включены 09:00–17:00, Сб–Вс выключены
const DEFAULT_DAY_SCHEDULES: DaySchedule[] = [
  { dow:1, label:'Пн', enabled:true,  startTime:'09:00', endTime:'17:00' },
  { dow:2, label:'Вт', enabled:true,  startTime:'09:00', endTime:'17:00' },
  { dow:3, label:'Ср', enabled:true,  startTime:'09:00', endTime:'17:00' },
  { dow:4, label:'Чт', enabled:true,  startTime:'09:00', endTime:'17:00' },
  { dow:5, label:'Пт', enabled:true,  startTime:'09:00', endTime:'17:00' },
  { dow:6, label:'Сб', enabled:false, startTime:'09:00', endTime:'17:00' },
  { dow:0, label:'Вс', enabled:false, startTime:'09:00', endTime:'17:00' },
];

// ── Props ──────────────────────────────────────────────────────────────────

interface ScheduleScreenProps {
  onLesson: (id?: string) => void;
  onChat: () => void;
  onCreateMasterClass?: () => void;
}

// ── Components ─────────────────────────────────────────────────────────────

function TimeInput({
  value, onChange, label, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="time"
      className={`${styles.timeInput} ${disabled ? styles.timeInputDisabled : ''}`}
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label={label}
      disabled={disabled}
    />
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────

export function ScheduleScreen({ onLesson, onChat, onCreateMasterClass }: ScheduleScreenProps) {
  const [tab, setTab] = useState<ScheduleTab>('lessons');

  // Вкладка «Свободно»
  const [selectedDayIdx,  setSelectedDayIdx]  = useState(0);
  const [generatedSlots,  setGeneratedSlots]  = useState<Map<string, Slot[]>>(new Map());
  const [blockedSlotIds,  setBlockedSlotIds]  = useState<Set<string>>(new Set());
  const [templateApplied, setTemplateApplied] = useState(false);

  // Настройки расписания (новая модель)
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>(DEFAULT_DAY_SCHEDULES);
  const [lunchEnabled, setLunchEnabled] = useState(false);
  const [lunchStart,   setLunchStart]   = useState('13:00');
  const [lunchEnd,     setLunchEnd]     = useState('14:00');
  const [buffer,       setBuffer]       = useState(0);

  const [showToast, setShowToast] = useState<string | false>(false);

  // ── Tab swipe только между lessons и available ─────────────────────────
  const SWIPE_TABS = ['lessons', 'available'] as const;
  const swipeActive = tab === 'settings' ? 'lessons' : tab as 'lessons' | 'available';
  const [tabAnimDir, setTabAnimDir] = useState<'left' | 'right' | null>(null);
  const [tabAnimKey, setTabAnimKey] = useState(0);
  const { onTouchStart: swipeTouchStart, onTouchEnd: swipeTouchEnd } = useTabSwipe(
    SWIPE_TABS,
    swipeActive,
    (t, dir) => { setTabAnimDir(dir); setTabAnimKey(k => k + 1); setTab(t); },
  );

  // ── Scroll tracking ────────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTop,  setShowTop]  = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 120;
    setShowTop(el.scrollTop > 300 && !nearBottom);
  }, []);

  function fireToast(msg: string) {
    setShowToast(msg);
    setTimeout(() => setShowToast(false), 2500);
  }

  // ── 7 days strip ───────────────────────────────────────────────────────
  const days14 = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  }), []);

  // ── Helpers ────────────────────────────────────────────────────────────

  function makeDayConfig(ds: DaySchedule): DayConfig {
    return {
      startTime:    ds.startTime,
      endTime:      ds.endTime,
      breakEnabled: lunchEnabled,
      breakStart:   lunchStart,
      breakEnd:     lunchEnd,
    };
  }

  function getDaySchedule(date: Date): DaySchedule | undefined {
    return daySchedules.find(s => s.dow === date.getDay());
  }

  function isOffDay(date: Date): boolean {
    return !(getDaySchedule(date)?.enabled ?? false);
  }

  // ── Превью всех рабочих дней недели ──────────────────────────────────
  const previewDays = useMemo(() => daySchedules.map(ds => {
    const windows = ds.enabled ? generateFreeWindows(makeDayConfig(ds)) : [];
    const totalMinutes = windows.reduce((s, w) => s + w.minutes, 0);
    return { label: ds.label, enabled: ds.enabled, windows, totalMinutes };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [daySchedules, lunchEnabled, lunchStart, lunchEnd]);

  // ── Слоты для вкладки «Свободно» ──────────────────────────────────────
  const selectedDate    = days14[selectedDayIdx];
  const selectedDateKey = selectedDate.toISOString().slice(0, 10);

  const slotsForSelectedDay = useMemo(() => {
    if (!templateApplied) return null;
    const ds = daySchedules.find(s => s.dow === selectedDate.getDay());
    if (!ds?.enabled) return [];
    const cached = generatedSlots.get(selectedDateKey);
    if (cached) return cached;
    return generateSlotsForDay(selectedDate, makeDayConfig(ds), SLOT_DURATION, buffer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateApplied, generatedSlots, selectedDateKey, selectedDate, daySchedules, lunchEnabled, lunchStart, lunchEnd, buffer]);

  function slotCountForDay(date: Date): number {
    if (!templateApplied) return 0;
    const ds = getDaySchedule(date);
    if (!ds?.enabled) return 0;
    const key = date.toISOString().slice(0, 10);
    const cached = generatedSlots.get(key);
    if (cached) return cached.filter(s => !blockedSlotIds.has(s.id)).length;
    return generatePreviewSlots(makeDayConfig(ds), SLOT_DURATION, buffer).filter(s => !s.tooShort).length;
  }

  // ── Сохранить расписание ───────────────────────────────────────────────
  function saveSchedule() {
    const newMap = new Map<string, Slot[]>();
    days14.forEach(date => {
      const key = date.toISOString().slice(0, 10);
      const ds  = getDaySchedule(date);
      if (!ds?.enabled) {
        newMap.set(key, []);
      } else {
        newMap.set(key, generateSlotsForDay(date, makeDayConfig(ds), SLOT_DURATION, buffer));
      }
    });
    setGeneratedSlots(newMap);
    setTemplateApplied(true);
    fireToast('✓ Расписание сохранено — слоты обновлены на 7 дней');
    setTab('available');
  }

  function toggleBlockSlot(slotId: string) {
    setBlockedSlotIds(prev => {
      const next = new Set(prev);
      next.has(slotId) ? next.delete(slotId) : next.add(slotId);
      return next;
    });
  }

  function updateDaySchedule(idx: number, patch: Partial<DaySchedule>) {
    setDaySchedules(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d));
  }

  // ── Booking groups ─────────────────────────────────────────────────────
  function dateToGroup(d: Date): Booking['group'] {
    const t0 = new Date(today);
    const t1 = new Date(t0); t1.setDate(t0.getDate() + 1);
    const t7 = new Date(t0); t7.setDate(t0.getDate() + 7);
    const dn = new Date(d); dn.setHours(0,0,0,0);
    if (dn.getTime() === t0.getTime()) return 'today';
    if (dn.getTime() === t1.getTime()) return 'tomorrow';
    if (dn <= t7) return 'week';
    return 'later';
  }

  const storeBookings: Booking[] = getAcceptedLessons('aleksey').map(b => ({
    id:         b.id,
    date:       new Date(b.dateISO),
    timeStart:  b.timeStart,
    timeEnd:    b.timeEnd,
    clientName: b.studentName,
    discipline: b.discipline === 'ski' ? 'Горные лыжи' : 'Сноуборд',
    price:      b.price,
    format:     b.formatLabel,
    group:      dateToGroup(new Date(b.dateISO)),
  }));

  const storeIds   = new Set(storeBookings.map(b => b.id));
  const allBookings = [...storeBookings, ...MOCK_BOOKINGS.filter(b => !storeIds.has(b.id))];

  const bookingGroups = [
    { key:'today',    label:'Сегодня',    items: allBookings.filter(b => b.group === 'today')    },
    { key:'tomorrow', label:'Завтра',     items: allBookings.filter(b => b.group === 'tomorrow') },
    { key:'week',     label:'Эта неделя', items: allBookings.filter(b => b.group === 'week')     },
    { key:'later',    label:'Позже',      items: allBookings.filter(b => b.group === 'later')    },
  ].filter(g => g.items.length > 0);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.headerTitle}>Расписание</div>
          <button
            className={`${styles.headerGear} ${tab === 'settings' ? styles.headerGearActive : ''}`}
            aria-label="Настройки расписания"
            onClick={() => setTab(t => t === 'settings' ? 'lessons' : 'settings')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
        {tab !== 'settings' && (
          <div className={styles.tabs}>
            {(['lessons', 'available'] as ScheduleTab[]).map(t => (
              <button
                key={t}
                className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'lessons' ? 'Занятия' : 'Свободно'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={scrollRef} className={styles.scroll} onScroll={handleScroll}
        onTouchStart={swipeTouchStart} onTouchEnd={swipeTouchEnd}
      >

        {/* ── ЗАНЯТИЯ ── */}
        {tab === 'lessons' && (
          <div
            key={tabAnimKey}
            style={{ animation: tabAnimDir ? `${tabAnimDir === 'left' ? 'tabSlideLeft' : 'tabSlideRight'} 200ms cubic-bezier(0.25,0.46,0.45,0.94) both` : undefined }}
          >
            <div className={styles.tabContent}>
              {bookingGroups.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><Icon name="calendar" size={32} /></div>
                  <div className={styles.emptyTitle}>Пока нет подтверждённых занятий</div>
                  <div className={styles.emptySub}>Настройте расписание — гости начнут видеть свободное время</div>
                  <button className={styles.emptyBtn} onClick={() => setTab('settings')}>
                    Настроить расписание →
                  </button>
                </div>
              ) : (
                bookingGroups.map(group => (
                  <div key={group.key}>
                    <div className={`${styles.groupLabel} ${styles[`group-${group.key}`]}`}>
                      {group.label}
                    </div>
                    {group.items.map(b => (
                      <div key={b.id} className={`${styles.bookingCard} ${styles[`bookingCard-${group.key}`]}`}>
                        <div className={styles.bookingLeft}>
                          <div className={styles.bookingDay}>{b.date.getDate()}</div>
                          <div className={styles.bookingMonth}>{MONTH_RU[b.date.getMonth()].toUpperCase()}</div>
                        </div>
                        <div className={styles.bookingMain}>
                          <div className={styles.bookingTime}>{b.timeStart} — {b.timeEnd}</div>
                          <div className={styles.bookingClient}>{b.clientName} · {b.discipline}</div>
                          <div className={styles.bookingMeta}>{b.price.toLocaleString('ru')} ₽ · {b.format}</div>
                        </div>
                        <div className={styles.bookingActions}>
                          <button className={styles.bookingActBtn} onClick={onChat} aria-label="Написать">
                            <Icon name="chat" size={16} />
                          </button>
                          <button className={`${styles.bookingActBtn} ${styles.bookingActBtnPrimary}`} onClick={() => onLesson(b.id)} aria-label="Открыть занятие">
                            ›
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── СВОБОДНО ── */}
        {tab === 'available' && (
          <div
            key={tabAnimKey}
            style={{ animation: tabAnimDir ? `${tabAnimDir === 'left' ? 'tabSlideLeft' : 'tabSlideRight'} 200ms cubic-bezier(0.25,0.46,0.45,0.94) both` : undefined }}
          >
            <div className={styles.tabContent}>
              <div className={styles.availHeader}>
                <div className={styles.availHeaderTitle}>Свободные слоты — 7 дней вперёд</div>
                <div className={styles.availHeaderRange}>
                  {days14[0].getDate()} {MONTH_RU[days14[0].getMonth()]} —{' '}
                  {days14[6].getDate()} {MONTH_RU[days14[6].getMonth()]}
                </div>
              </div>

              <div className={styles.dayStrip}>
                {days14.map((d, i) => {
                  const cnt        = slotCountForDay(d);
                  const isSelected = i === selectedDayIdx;
                  const isOff      = isOffDay(d);
                  return (
                    <button
                      key={i}
                      className={`${styles.dayChip} ${isSelected ? styles.dayChipActive : ''} ${isOff ? styles.dayChipOff : ''}`}
                      onClick={() => setSelectedDayIdx(i)}
                    >
                      <span className={styles.dayChipLabel}>{DAY_SHORT[d.getDay()]} {d.getDate()}</span>
                      {templateApplied && (
                        <span className={styles.dayChipCount}>{isOff ? '—' : cnt}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {!templateApplied ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🕒</div>
                  <div className={styles.emptyTitle}>Расписание ещё не настроено</div>
                  <div className={styles.emptySub}>Нажмите ⚙ и сохраните расписание — слоты появятся автоматически</div>
                  <button className={styles.emptyBtn} onClick={() => setTab('settings')}>
                    Настроить →
                  </button>
                </div>
              ) : isOffDay(selectedDate) ? (
                <div className={styles.emptyStateSm}>
                  <div className={styles.emptyStatSmText}>Выходной день — слотов нет</div>
                </div>
              ) : (
                <div className={styles.slotList}>
                  {(slotsForSelectedDay || []).length === 0 ? (
                    <div className={styles.emptyStateSm}>
                      <div className={styles.emptyStatSmText}>Нет слотов на этот день</div>
                    </div>
                  ) : (
                    (slotsForSelectedDay || []).map(slot => {
                      const isBlocked = blockedSlotIds.has(slot.id);
                      return (
                        <div key={slot.id} className={`${styles.slotCard} ${isBlocked ? styles.slotCardBlocked : ''}`}>
                          <div className={styles.slotIcon}>{isBlocked ? '🚫' : '✓'}</div>
                          <div className={styles.slotInfo}>
                            <div className={styles.slotTime}>{slot.timeStart} — {slot.timeEnd}</div>
                            <div className={styles.slotLabel}>{isBlocked ? 'Заблокировано' : slot.label}</div>
                            {!isBlocked ? (
                              <div className={styles.slotActions}>
                                <button className={styles.slotBtn} onClick={() => toggleBlockSlot(slot.id)}>
                                  Заблокировать
                                </button>
                                <button className={`${styles.slotBtn} ${styles.slotBtnAccent}`} onClick={onCreateMasterClass}>
                                  + Мастер-класс
                                </button>
                              </div>
                            ) : (
                              <div className={styles.slotActions}>
                                <button className={styles.slotBtn} onClick={() => toggleBlockSlot(slot.id)}>
                                  Разблокировать
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── НАСТРОЙКИ РАСПИСАНИЯ ── */}
        {tab === 'settings' && (
          <div className={styles.tabContent}>

            {/* Рабочие дни и часы */}
            <div className={styles.settingsSecLabel}>Рабочие дни и часы</div>
            <div className={styles.settingsCard}>
              {daySchedules.map((ds, idx) => (
                <div key={ds.dow} className={styles.dayRow}>
                  <button
                    className={`${styles.daySw} ${ds.enabled ? styles.daySwOn : ''}`}
                    aria-label={`${ds.label} ${ds.enabled ? 'выключить' : 'включить'}`}
                    onClick={() => updateDaySchedule(idx, { enabled: !ds.enabled })}
                  />
                  <span className={`${styles.dayName} ${!ds.enabled ? styles.dayNameOff : ''}`}>
                    {ds.label}
                  </span>
                  <div className={styles.dayTimes}>
                    <TimeInput
                      value={ds.startTime}
                      onChange={v => updateDaySchedule(idx, { startTime: v })}
                      label={`${ds.label} начало`}
                      disabled={!ds.enabled}
                    />
                    <span className={styles.dayTimeSep}>—</span>
                    <TimeInput
                      value={ds.endTime}
                      onChange={v => updateDaySchedule(idx, { endTime: v })}
                      label={`${ds.label} конец`}
                      disabled={!ds.enabled}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Перерыв на обед */}
            <div className={styles.settingsSecLabel}>Перерыв на обед</div>
            <div className={styles.settingsCard}>
              <div className={styles.dayRow}>
                <button
                  className={`${styles.daySw} ${lunchEnabled ? styles.daySwOn : ''}`}
                  onClick={() => setLunchEnabled(v => !v)}
                  aria-label={lunchEnabled ? 'Выключить перерыв' : 'Включить перерыв'}
                />
                <div className={styles.dayTimes}>
                  <TimeInput value={lunchStart} onChange={setLunchStart} label="Начало перерыва" disabled={!lunchEnabled} />
                  <span className={styles.dayTimeSep}>—</span>
                  <TimeInput value={lunchEnd}   onChange={setLunchEnd}   label="Конец перерыва"  disabled={!lunchEnabled} />
                </div>
              </div>
            </div>

            {/* Перерыв между занятиями */}
            <div className={styles.settingsSecLabel}>Перерыв между занятиями</div>
            <div className={styles.settingsCard}>
              <div className={styles.settingsCardBody}>
                <div className={styles.chipRow}>
                  {[0, 15, 30].map(b => (
                    <button
                      key={b}
                      className={`${styles.durationChip} ${buffer === b ? styles.durationChipActive : ''}`}
                      onClick={() => setBuffer(b)}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                <div className={styles.tmChipHint}>минут</div>
              </div>
            </div>

            {/* Превью всех рабочих дней */}
            <div className={styles.previewBlock}>
              <div className={styles.previewTitle}>📅 Превью расписания</div>
              {previewDays.every(d => !d.enabled) ? (
                <div className={styles.previewOff}>Включите хотя бы один рабочий день</div>
              ) : (
                <>
                  {previewDays.map(d => (
                    <div key={d.label} className={styles.previewDayRow}>
                      <span className={`${styles.previewDayLabel} ${!d.enabled ? styles.previewDayLabelOff : ''}`}>
                        {d.label}
                      </span>
                      {d.enabled ? (
                        <div className={styles.previewDayWindows}>
                          {d.windows.map((w, i) => (
                            <span key={i} className={styles.previewDayWindow}>
                              {w.start}–{w.end}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className={styles.previewDayOff}>выходной</span>
                      )}
                      {d.enabled && (
                        <span className={styles.previewDayHours}>{formatDuration(d.totalMinutes)}</span>
                      )}
                    </div>
                  ))}
                  <div className={styles.previewSummary}>
                    Итого: {formatDuration(previewDays.reduce((s, d) => s + d.totalMinutes, 0))} в неделю
                  </div>
                </>
              )}
            </div>

            {/* Кнопка «Сохранить» */}
            <button className={styles.btnSave} onClick={saveSchedule}>
              Сохранить
            </button>

          </div>
        )}

      </div>

      {showToast && <div className={styles.toast}>{showToast}</div>}

      <ScrollToTopBtn
        show={showTop}
        onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
      />
    </div>
  );
}
