import { useState, useMemo, useRef, useCallback } from 'react';
import styles from './ScheduleScreen.module.css';
import { ScrollToTopBtn } from '@/components/ScrollToTopBtn';

// ── Types ──────────────────────────────────────────────────────────────────

type ScheduleTab = 'lessons' | 'available' | 'template';
type TemplateMode = 'simple' | 'advanced';

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

interface DayConfig {
  startTime: string;
  endTime: string;
  breakEnabled: boolean;
  breakStart: string;
  breakEnd: string;
}

interface AdvancedBlock {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  buffer: number;
}

interface DayAdvanced {
  blocks: AdvancedBlock[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

const MONTH_RU = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн',
                   'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const DAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const DAY_FULL  = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

// For the off-days picker: Mon–Sun chips (js getDay: 0=Sun,1=Mon...6=Sat)
const DAY_CHIPS: { label: string; dow: number }[] = [
  { label: 'Пн', dow: 1 },
  { label: 'Вт', dow: 2 },
  { label: 'Ср', dow: 3 },
  { label: 'Чт', dow: 4 },
  { label: 'Пт', dow: 5 },
  { label: 'Сб', dow: 6 },
  { label: 'Вс', dow: 0 },
];

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function generateTimeOptions(): string[] {
  const opts: string[] = [];
  for (let h = 6; h <= 22; h++) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 22 && m > 0) break;
      opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return opts;
}

const TIME_OPTIONS = generateTimeOptions();

interface GeneratedSlot {
  start: string;
  end: string;
  tooShort: boolean;
}

function generatePreviewSlots(cfg: DayConfig, slotDuration: number, buffer: number): GeneratedSlot[] {
  const slots: GeneratedSlot[] = [];
  const intervals: { start: string; end: string }[] = [];
  if (cfg.breakEnabled && cfg.breakStart && cfg.breakEnd) {
    intervals.push({ start: cfg.startTime, end: cfg.breakStart });
    intervals.push({ start: cfg.breakEnd, end: cfg.endTime });
  } else {
    intervals.push({ start: cfg.startTime, end: cfg.endTime });
  }
  for (const interval of intervals) {
    let current = timeToMinutes(interval.start);
    const end = timeToMinutes(interval.end);
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
  const preview = generatePreviewSlots(cfg, slotDuration, buffer);
  return preview
    .filter(p => !p.tooShort)
    .map((p, i) => ({
      id: `${date.toISOString().slice(0, 10)}-${i}`,
      timeStart: p.start,
      timeEnd: p.end,
      status: 'available' as const,
      label: 'Свободно для индивидуальных',
    }));
}

// ── Mock data ──────────────────────────────────────────────────────────────

const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const dayAfter = new Date(today);
dayAfter.setDate(today.getDate() + 2);
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 8);

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b1', date: today,
    timeStart: '10:00', timeEnd: '11:30',
    clientName: 'Кирилл Волков', discipline: 'Сноуборд',
    price: 7000, format: 'Индивидуал', group: 'today',
  },
  {
    id: 'b2', date: today,
    timeStart: '13:00', timeEnd: '14:30',
    clientName: 'Мария Смирнова', discipline: 'Горные лыжи',
    price: 5000, format: 'Мини-группа', group: 'today',
  },
  {
    id: 'b3', date: tomorrow,
    timeStart: '09:30', timeEnd: '11:00',
    clientName: 'Артём Лебедев', discipline: 'Сноуборд',
    price: 7000, format: 'Индивидуал', group: 'tomorrow',
  },
  {
    id: 'b4', date: dayAfter,
    timeStart: '11:00', timeEnd: '12:30',
    clientName: 'Ольга Кузнецова', discipline: 'Горные лыжи',
    price: 4000, format: 'Детское', group: 'week',
  },
  {
    id: 'b5', date: nextWeek,
    timeStart: '10:00', timeEnd: '11:30',
    clientName: 'Павел Иванов', discipline: 'Сноуборд',
    price: 7000, format: 'Индивидуал', group: 'later',
  },
];

const DEFAULT_CFG: DayConfig = {
  startTime: '09:00', endTime: '17:00',
  breakEnabled: false, breakStart: '13:00', breakEnd: '14:00',
};

const WEEK_DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

interface ScheduleScreenProps {
  onLesson: () => void;
  onChat: () => void;
  onCreateMasterClass?: () => void;
}

// ── Components ─────────────────────────────────────────────────────────────

function TimeSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <select
      className={styles.timeSelect}
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label={label}
    >
      {TIME_OPTIONS.map(t => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────

export function ScheduleScreen({ onLesson, onChat, onCreateMasterClass }: ScheduleScreenProps) {
  const [tab, setTab] = useState<ScheduleTab>('lessons');

  // Вкладка «Свободно»
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [generatedSlots, setGeneratedSlots] = useState<Map<string, Slot[]>>(new Map());
  const [blockedSlotIds, setBlockedSlotIds] = useState<Set<string>>(new Set());

  // Вкладка «Шаблон»
  const [templateMode, setTemplateMode] = useState<TemplateMode>('simple');
  const [dayCfg, setDayCfg] = useState<DayConfig>({ ...DEFAULT_CFG });
  // workDays: set of js-getDay numbers (0=Sun, 1=Mon, ..., 6=Sat). Default: все дни
  const [workDays, setWorkDays] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5, 6]));
  const [slotDuration, setSlotDuration] = useState(60);
  const [customDuration, setCustomDuration] = useState(false);
  const [customDurationVal, setCustomDurationVal] = useState(90);
  const [buffer, setBuffer] = useState(0);
  const [templateApplied, setTemplateApplied] = useState(false);
  const [showToast, setShowToast] = useState<string | false>(false);

  // ── Scroll tracking ────────────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowTop(el.scrollTop > 300);
  }, []);

  function fireToast(msg: string) {
    setShowToast(msg);
    setTimeout(() => setShowToast(false), 2500);
  }

  // Advanced mode
  const [advancedDayIdx, setAdvancedDayIdx] = useState(0);
  const [advancedDays, setAdvancedDays] = useState<DayAdvanced[]>(
    WEEK_DAYS.map(() => ({ blocks: [] }))
  );

  // ── 7 days strip ───────────────────────────────────────────────────────
  const days14 = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  const effectiveDuration = customDuration ? customDurationVal : slotDuration;

  function isOffDay(date: Date): boolean {
    return !workDays.has(date.getDay());
  }

  // ── Preview calculation ────────────────────────────────────────────────
  const previewDay = days14[1];
  const previewIsOff = isOffDay(previewDay);
  const previewSlots = useMemo(
    () => previewIsOff ? [] : generatePreviewSlots(dayCfg, effectiveDuration, buffer),
    [previewIsOff, dayCfg, effectiveDuration, buffer]
  );
  const previewValidSlots = previewSlots.filter(s => !s.tooShort).length;

  // Estimate weekly slots
  const slotsPerWorkingDay = useMemo(
    () => generatePreviewSlots(dayCfg, effectiveDuration, buffer).filter(s => !s.tooShort).length,
    [dayCfg, effectiveDuration, buffer]
  );
  const workingDaysPerWeek = workDays.size;
  const weeklyEstimate = slotsPerWorkingDay * workingDaysPerWeek;

  // ── Slots for selected day ─────────────────────────────────────────────
  const selectedDate = days14[selectedDayIdx];
  const selectedDateKey = selectedDate.toISOString().slice(0, 10);

  const slotsForSelectedDay = useMemo(() => {
    if (!templateApplied) return null;
    if (isOffDay(selectedDate)) return [];
    const cached = generatedSlots.get(selectedDateKey);
    if (cached) return cached;
    return generateSlotsForDay(selectedDate, dayCfg, effectiveDuration, buffer);
  }, [templateApplied, generatedSlots, selectedDateKey, selectedDate, dayCfg, effectiveDuration, buffer, workDays]);

  function slotCountForDay(date: Date): number {
    if (!templateApplied) return 0;
    if (isOffDay(date)) return 0;
    const key = date.toISOString().slice(0, 10);
    const cached = generatedSlots.get(key);
    if (cached) return cached.filter(s => !blockedSlotIds.has(s.id)).length;
    return generatePreviewSlots(dayCfg, effectiveDuration, buffer).filter(s => !s.tooShort).length;
  }

  function applyTemplate() {
    const newMap = new Map<string, Slot[]>();
    days14.forEach(date => {
      const key = date.toISOString().slice(0, 10);
      if (!isOffDay(date)) {
        newMap.set(key, generateSlotsForDay(date, dayCfg, effectiveDuration, buffer));
      } else {
        newMap.set(key, []);
      }
    });
    setGeneratedSlots(newMap);
    setTemplateApplied(true);
    fireToast('✓ Шаблон сохранён. Создано слотов на 7 дней вперёд.');
    setTab('available');
  }

  function toggleBlockSlot(slotId: string) {
    setBlockedSlotIds(prev => {
      const next = new Set(prev);
      next.has(slotId) ? next.delete(slotId) : next.add(slotId);
      return next;
    });
  }

  function toggleWorkDay(dow: number) {
    setWorkDays(prev => {
      const next = new Set(prev);
      next.has(dow) ? next.delete(dow) : next.add(dow);
      return next;
    });
  }

  // ── Advanced mode helpers ──────────────────────────────────────────────
  function addAdvancedBlock() {
    setAdvancedDays(prev => {
      const next = [...prev];
      next[advancedDayIdx] = {
        blocks: [
          ...next[advancedDayIdx].blocks,
          { id: Date.now().toString(), startTime: '09:00', endTime: '12:00', duration: 60, buffer: 15 },
        ],
      };
      return next;
    });
  }

  function removeAdvancedBlock(blockId: string) {
    setAdvancedDays(prev => {
      const next = [...prev];
      next[advancedDayIdx] = {
        blocks: next[advancedDayIdx].blocks.filter(b => b.id !== blockId),
      };
      return next;
    });
  }

  function updateAdvancedBlock(blockId: string, field: keyof AdvancedBlock, val: string | number) {
    setAdvancedDays(prev => {
      const next = [...prev];
      next[advancedDayIdx] = {
        blocks: next[advancedDayIdx].blocks.map(b => b.id === blockId ? { ...b, [field]: val } : b),
      };
      return next;
    });
  }

  // ── Booking groups ─────────────────────────────────────────────────────
  const bookingGroups: { key: string; label: string; items: Booking[] }[] = [
    { key: 'today',    label: 'Сегодня',     items: MOCK_BOOKINGS.filter(b => b.group === 'today') },
    { key: 'tomorrow', label: 'Завтра',      items: MOCK_BOOKINGS.filter(b => b.group === 'tomorrow') },
    { key: 'week',     label: 'Эта неделя',  items: MOCK_BOOKINGS.filter(b => b.group === 'week') },
    { key: 'later',    label: 'Позже',       items: MOCK_BOOKINGS.filter(b => b.group === 'later') },
  ].filter(g => g.items.length > 0);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>Расписание</div>
        <div className={styles.tabs}>
          {(['lessons', 'available', 'template'] as ScheduleTab[]).map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'lessons' ? 'Занятия' : t === 'available' ? 'Свободно' : 'Шаблон'}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className={styles.scroll} onScroll={handleScroll}>

        {/* ── ЗАНЯТИЯ ── */}
        {tab === 'lessons' && (
          <div className={styles.tabContent}>
            {bookingGroups.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📅</div>
                <div className={styles.emptyTitle}>Пока нет подтверждённых занятий</div>
                <div className={styles.emptySub}>Заполните «Шаблон» — гости начнут видеть свободное время</div>
                <button className={styles.emptyBtn} onClick={() => setTab('template')}>
                  Перейти к шаблону →
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
                        <div className={styles.bookingMeta}>
                          {b.price.toLocaleString('ru')} ₽ · {b.format}
                        </div>
                      </div>
                      <div className={styles.bookingActions}>
                        <button className={styles.bookingActBtn} onClick={onChat}>💬</button>
                        <button className={`${styles.bookingActBtn} ${styles.bookingActBtnPrimary}`} onClick={onLesson}>→</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── СВОБОДНО ── */}
        {tab === 'available' && (
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
                const cnt = slotCountForDay(d);
                const isSelected = i === selectedDayIdx;
                const isOff = isOffDay(d);
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
                <div className={styles.emptySub}>Заполните «Шаблон» — система автоматически создаст слоты на 7 дней вперёд</div>
                <button className={styles.emptyBtn} onClick={() => setTab('template')}>
                  Заполнить шаблон →
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
                          {!isBlocked && (
                            <div className={styles.slotActions}>
                              <button className={styles.slotBtn} onClick={() => toggleBlockSlot(slot.id)}>
                                Заблокировать
                              </button>
                              <button
                                className={`${styles.slotBtn} ${styles.slotBtnAccent}`}
                                onClick={onCreateMasterClass}
                              >
                                + Мастер-класс
                              </button>
                            </div>
                          )}
                          {isBlocked && (
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
        )}

        {/* ── ШАБЛОН ── */}
        {tab === 'template' && (
          <div className={styles.tabContent}>
            {templateMode === 'simple' ? (
              <>
                <div className={styles.sectionTitle}>Рабочие часы</div>

                {/* Single time block */}
                <div className={styles.dayBlock}>
                  <div className={styles.timeRow}>
                    <TimeSelect value={dayCfg.startTime} onChange={v => setDayCfg(p => ({ ...p, startTime: v }))} label="Начало" />
                    <span className={styles.timeSep}>—</span>
                    <TimeSelect value={dayCfg.endTime} onChange={v => setDayCfg(p => ({ ...p, endTime: v }))} label="Конец" />
                  </div>
                  <label className={styles.checkRow} onClick={() => setDayCfg(p => ({ ...p, breakEnabled: !p.breakEnabled }))}>
                    <span className={`${styles.checkbox} ${dayCfg.breakEnabled ? styles.checkboxOn : ''}`}>
                      {dayCfg.breakEnabled ? '✓' : ''}
                    </span>
                    <span className={styles.checkLabel}>Перерыв</span>
                  </label>
                  {dayCfg.breakEnabled && (
                    <div className={styles.timeRow} style={{ marginTop: 8 }}>
                      <TimeSelect value={dayCfg.breakStart} onChange={v => setDayCfg(p => ({ ...p, breakStart: v }))} label="Начало перерыва" />
                      <span className={styles.timeSep}>—</span>
                      <TimeSelect value={dayCfg.breakEnd} onChange={v => setDayCfg(p => ({ ...p, breakEnd: v }))} label="Конец перерыва" />
                    </div>
                  )}
                </div>

                {/* Work days */}
                <div className={styles.sectionTitle}>Рабочие дни</div>
                <div className={styles.chipRow}>
                  {DAY_CHIPS.map(({ label, dow }) => (
                    <button
                      key={dow}
                      className={`${styles.durationChip} ${workDays.has(dow) ? styles.durationChipActive : ''}`}
                      onClick={() => toggleWorkDay(dow)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className={styles.chipUnit}>
                  {workDays.size === 7 ? 'Каждый день' : workDays.size === 0 ? 'Выберите дни' : `${workDays.size} дн. в неделю`}
                </div>

                {/* Duration chips */}
                <div className={styles.sectionTitle}>Длительность занятия</div>
                <div className={styles.chipRow}>
                  {[45, 60, 90, 120].map(d => (
                    <button
                      key={d}
                      className={`${styles.durationChip} ${!customDuration && slotDuration === d ? styles.durationChipActive : ''}`}
                      onClick={() => { setSlotDuration(d); setCustomDuration(false); }}
                    >
                      {d}
                    </button>
                  ))}
                  <button
                    className={`${styles.durationChip} ${customDuration ? styles.durationChipActive : ''}`}
                    onClick={() => setCustomDuration(true)}
                  >
                    ⚙
                  </button>
                </div>
                {customDuration && (
                  <div className={styles.customDurRow}>
                    <input
                      type="number"
                      className={styles.customDurInput}
                      value={customDurationVal}
                      min={30}
                      max={240}
                      step={15}
                      onChange={e => setCustomDurationVal(Number(e.target.value))}
                    />
                    <span className={styles.customDurLabel}>мин (30–240, шаг 15)</span>
                  </div>
                )}
                <div className={styles.chipUnit}>минут</div>

                {/* Buffer chips */}
                <div className={styles.sectionTitle}>Перерыв между занятиями</div>
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
                <div className={styles.chipUnit}>минут</div>

                {/* Preview */}
                <div className={styles.previewBlock}>
                  <div className={styles.previewTitle}>
                    📅 Превью на завтра ({DAY_SHORT[previewDay.getDay()]} {previewDay.getDate()} {MONTH_RU[previewDay.getMonth()]}):
                  </div>
                  {previewIsOff ? (
                    <div className={styles.previewOff}>Выходной день — слотов нет</div>
                  ) : (
                    <>
                      {previewSlots.map((s, i) => (
                        <div key={i} className={`${styles.previewSlot} ${s.tooShort ? styles.previewSlotShort : ''}`}>
                          {s.start} — {s.end}
                          <span className={styles.previewSlotLabel}>
                            {s.tooShort ? ' слишком короткий' : ' свободно'}
                          </span>
                        </div>
                      ))}
                      <div className={styles.previewSummary}>
                        Получится {previewValidSlots} слотов в день, ~{weeklyEstimate} в неделю.
                      </div>
                    </>
                  )}
                </div>

                {/* Action buttons */}
                <div className={styles.templateActions}>
                  <button className={styles.btnApply} onClick={applyTemplate}>
                    Применить
                  </button>
                  <button className={styles.btnAdvanced} onClick={() => setTemplateMode('advanced')}>
                    Гибкий режим ⚙
                  </button>
                </div>
              </>
            ) : (
              /* ── Advanced mode ── */
              <>
                <div className={styles.sectionTitle}>Гибкий режим</div>

                <div className={styles.advDayNav}>
                  <button
                    className={styles.advDayNavBtn}
                    onClick={() => setAdvancedDayIdx(i => Math.max(0, i - 1))}
                    disabled={advancedDayIdx === 0}
                  >
                    ◀
                  </button>
                  <span className={styles.advDayName}>{DAY_FULL[advancedDayIdx === 6 ? 0 : advancedDayIdx + 1]}</span>
                  <button
                    className={styles.advDayNavBtn}
                    onClick={() => setAdvancedDayIdx(i => Math.min(6, i + 1))}
                    disabled={advancedDayIdx === 6}
                  >
                    ▶
                  </button>
                </div>

                {advancedDays[advancedDayIdx].blocks.length === 0 && (
                  <div className={styles.advEmptyDay}>
                    <div className={styles.advEmptyDayText}>Нет блоков — добавьте рабочее время</div>
                  </div>
                )}
                {advancedDays[advancedDayIdx].blocks.map((block, bi) => (
                  <div key={block.id} className={styles.advBlock}>
                    <div className={styles.advBlockTitle}>▸ Блок {bi + 1}</div>
                    <div className={styles.timeRow}>
                      <TimeSelect value={block.startTime} onChange={v => updateAdvancedBlock(block.id, 'startTime', v)} label={`Блок ${bi+1} начало`} />
                      <span className={styles.timeSep}>—</span>
                      <TimeSelect value={block.endTime} onChange={v => updateAdvancedBlock(block.id, 'endTime', v)} label={`Блок ${bi+1} конец`} />
                    </div>
                    <div className={styles.advBlockMeta}>
                      <span className={styles.advBlockMetaLabel}>Длительность</span>
                      <div className={styles.advChipRow}>
                        {[45, 60, 90, 120].map(d => (
                          <button
                            key={d}
                            className={`${styles.advChip} ${block.duration === d ? styles.advChipActive : ''}`}
                            onClick={() => updateAdvancedBlock(block.id, 'duration', d)}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                      <span className={styles.advBlockMetaLabel}>Перерыв</span>
                      <div className={styles.advChipRow}>
                        {[0, 15, 30].map(b => (
                          <button
                            key={b}
                            className={`${styles.advChip} ${block.buffer === b ? styles.advChipActive : ''}`}
                            onClick={() => updateAdvancedBlock(block.id, 'buffer', b)}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button className={styles.advBlockRemove} onClick={() => removeAdvancedBlock(block.id)}>
                      Удалить блок
                    </button>
                  </div>
                ))}

                <button className={styles.addBlockBtn} onClick={addAdvancedBlock}>
                  + Добавить блок
                </button>

                <div className={styles.advDivider} />
                <button className={styles.copyDayBtn} onClick={() => {
                  const dayName = DAY_FULL[advancedDayIdx === 6 ? 0 : advancedDayIdx + 1];
                  fireToast(`✓ Настройки ${dayName.toLowerCase()} скопированы на остальные дни`);
                }}>
                  Скопировать на другие дни
                </button>

                <div className={styles.templateActions}>
                  <button className={styles.btnApply} onClick={applyTemplate}>
                    Применить
                  </button>
                  <button className={styles.btnAdvanced} onClick={() => setTemplateMode('simple')}>
                    Простой режим
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* Toast */}
      {showToast && (
        <div className={styles.toast}>{showToast}</div>
      )}

      <ScrollToTopBtn
        show={showTop}
        onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
      />
    </div>
  );
}
