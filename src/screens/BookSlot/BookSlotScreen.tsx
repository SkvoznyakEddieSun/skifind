import { useState, useRef } from 'react';
import styles from './BookSlotScreen.module.css';
import type { Instructor, WeekDay, DayAvailability } from '../Catalog/CatalogScreen';
import { hasRating } from '../Catalog/CatalogScreen';
import { createBooking } from '@/lib/api';
import { MASTER_CLASSES } from '@/screens/MasterClass/masterClassData';
import { Icon } from '@/components/Icon/Icon';
import { RegistrationBottomSheet } from './RegistrationBottomSheet';

// ── Types ──────────────────────────────────────────────────────────────────

type Format   = 'individual' | 'miniGroup' | 'kids';
// 360 = полный день (FULL_DAY_HOURS * 60). Прочие — 45мин и 1/2/3/4 часа.
type Duration = 45 | 60 | 120 | 180 | 240 | 360;

// Длительность полного дня (часы) — при необходимости менять тут.
// Должно совпадать с FULL_DAY_HOURS на сервере (api/_lib/bookings.ts).
const FULL_DAY_HOURS = 6;
const FULL_DAY_MIN: Duration = (FULL_DAY_HOURS * 60) as Duration;   // 360

// Длительность индивидуального (минуты) → ключ тарифа/колонки на сервере.
const INDIVIDUAL_DURATION_KEY: Record<number, '1h' | '2h' | '3h' | '4h' | 'full_day'> = {
  60: '1h', 120: '2h', 180: '3h', 240: '4h', 360: 'full_day',
};

/** Человеко-читаемая длительность для подписей слота/summary. */
function durationLabel(d: Duration): string {
  if (d === 45)           return '45 мин';
  if (d === FULL_DAY_MIN) return `Весь день (${FULL_DAY_HOURS} ч)`;
  return `${d / 60} ч`;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const WEEKDAY_KEY: Record<number, WeekDay> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

const MONTH_RU  = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const DAY_SHORT = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function addMinutes(time: string, min: number): string {
  return minToTime(timeToMin(time) + min);
}

/** Парсит строку времени МК ('11:00 — 13:00') в минуты от начала суток */
function parseMcTimeRange(time: string): { start: number; end: number } | null {
  const m = time.match(/(\d{1,2}:\d{2})\D+(\d{1,2}:\d{2})/);
  if (!m) return null;
  return { start: timeToMin(m[1]), end: timeToMin(m[2]) };
}

/** Временные окна мастер-классов инструктора, попадающие на конкретную дату.
 *  В эти интервалы индивидуальная запись недоступна — инструктор ведёт группу. */
function mcWindowsForDay(instructorId: string, day: Date): { start: string; end: string }[] {
  const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
  const nextDay  = new Date(dayStart); nextDay.setDate(dayStart.getDate() + 1);
  return MASTER_CLASSES
    .filter(mc => mc.instructorId === instructorId)
    .filter(mc => {
      const t = new Date(mc.eventDateISO).getTime();
      return t >= dayStart.getTime() && t < nextDay.getTime();
    })
    .map(mc => parseMcTimeRange(mc.time))
    .filter((r): r is { start: number; end: number } => r !== null)
    .map(r => ({ start: minToTime(r.start), end: minToTime(r.end) }));
}

function generateSlots(day: DayAvailability, durationMin: number, stepMin: number): string[] {
  const start  = timeToMin(day.start);
  const end    = timeToMin(day.end);
  const breaks = (day.breaks ?? []).map(b => ({ s: timeToMin(b.start), e: timeToMin(b.end) }));
  const slots: string[] = [];
  for (let t = start; t + durationMin <= end; t += stepMin) {
    const te = t + durationMin;
    if (!breaks.some(b => t < b.e && te > b.s)) {
      slots.push(minToTime(t));
    }
  }
  return slots;
}

const today = new Date();
today.setHours(0, 0, 0, 0);
const DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(today);
  d.setDate(today.getDate() + i);
  return d;
});

const AV_STYLE: Record<string, React.CSSProperties> = {
  ice:    { background: 'var(--accent-soft)', color: 'var(--accent)' },
  mint:   { background: 'var(--mint)',        color: 'var(--mint-text)' },
  straw:  { background: 'var(--straw)',       color: 'var(--straw-text)' },
  purple: { background: 'rgba(124,58,237,.15)', color: '#A78BFA' },
  blue:   { background: 'var(--accent)',      color: 'var(--accent-text)' },
};

const FORMAT_LABELS: Record<Format, string> = {
  individual: 'Индивидуальное',
  miniGroup:  'Мини-группа',
  kids:       'Дети',
};

const DURATION_OPTS: { value: Duration; label: string }[] = [
  { value: 45,  label: '45 мин'    },
  { value: 60,  label: '1 час'     },
  { value: 120, label: '2 часа'    },
  { value: 180, label: '3 часа'    },
  { value: 240, label: '4 часа'    },
  { value: 360, label: 'Весь день' },
];

// ── Props ──────────────────────────────────────────────────────────────────

interface BookSlotScreenProps {
  onBack:   () => void;
  onBooked: () => void;
  instructor: Instructor;
}

// ── Component ──────────────────────────────────────────────────────────────

export function BookSlotScreen({ onBack, onBooked, instructor }: BookSlotScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [format,    setFormat]    = useState<Format | null>(null);
  const [duration,  setDuration]  = useState<Duration | null>(null);
  const [isFullDay, setIsFullDay] = useState(false);
  const [dayIdx,    setDayIdx]    = useState<number | null>(null);
  const [timeStart, setTimeStart] = useState<string | null>(null);
  const [groupSize, setGroupSize] = useState(2);
  const [message,   setMessage]   = useState('');
  const [submitted,    setSubmitted]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [showToast,    setShowToast]    = useState(false);
  const [showRegSheet, setShowRegSheet] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────

  const selectedDay         = dayIdx !== null ? DAYS[dayIdx] : null;
  const selectedDayKey      = selectedDay ? WEEKDAY_KEY[selectedDay.getDay()] : null;
  const selectedDaySchedule = selectedDayKey ? instructor.weekSchedule?.[selectedDayKey] : undefined;

  // Мастер-классы инструктора на выбранный день блокируют индивидуальную запись
  const mcWindows = selectedDay ? mcWindowsForDay(instructor.id, selectedDay) : [];
  const scheduleWithMc: DayAvailability | undefined = selectedDaySchedule
    ? { ...selectedDaySchedule, breaks: [...(selectedDaySchedule.breaks ?? []), ...mcWindows] }
    : undefined;

  const rawSlots: string[] = (scheduleWithMc && duration)
    ? generateSlots(scheduleWithMc, duration, duration === 45 ? 45 : 60)
    : [];

  // Для сегодняшнего дня фильтруем уже прошедшие слоты
  const slots: string[] = (() => {
    if (dayIdx !== 0) return rawSlots;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return rawSlots.filter(t => timeToMin(t) > nowMin);
  })();

  // Есть ли хоть один доступный день в ближайшие 7 дней
  const hasAnyDay = DAYS.some(d => !!instructor.weekSchedule?.[WEEKDAY_KEY[d.getDay()]]);

  /** Тариф индивидуального занятия по длительности — из БД-колонок
   *  (1ч/2ч/3ч/4ч/полный день). null = тариф не задан. НЕ множитель. */
  function individualPriceFor(d: Duration): number | null {
    const p = instructor.individualDurationPrices;
    const key = INDIVIDUAL_DURATION_KEY[d];
    if (!p || !key) return null;
    return p[key] ?? null;
  }

  function getPrice(): number {
    if (!instructor.pricing) return 0;
    if (isFullDay && format && format !== 'kids') {
      return instructor.pricing[format as 'individual' | 'miniGroup']?.fullDay ?? 0;
    }
    if (!format || !duration) return 0;
    // Индивидуальное — цена строго из колонки выбранной длительности.
    if (format === 'individual') {
      return individualPriceFor(duration) ?? 0;
    }
    if (duration === 45) {
      return instructor.pricing.shortSlotPrice ?? 0;
    }
    const hKey = `h${duration / 60}` as 'h1' | 'h2' | 'h3' | 'h4';
    if (format === 'kids') {
      return instructor.pricing.individual?.[hKey] ?? 0;
    }
    // miniGroup
    const base = instructor.pricing.miniGroup?.[hKey] ?? 0;
    return base + (instructor.pricing.miniGroup?.extraPersonPrice ?? 0) * (groupSize - 2);
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleFormatChange(f: Format) {
    setFormat(f);
    setDuration(null);
    setIsFullDay(false);
    setDayIdx(null);
    setTimeStart(null);
    setGroupSize(2);
  }

  function handleDurationChange(d: Duration) {
    setIsFullDay(false);
    setDuration(d);
    setDayIdx(null);
    setTimeStart(null);
  }

  function handleFullDay() {
    setIsFullDay(true);
    setDuration(null);
    setTimeStart(null);
    // Если день уже выбран — сразу проставляем время начала
    if (dayIdx !== null) {
      const key   = WEEKDAY_KEY[DAYS[dayIdx].getDay()];
      const sched = instructor.weekSchedule?.[key];
      setTimeStart(sched?.start ?? null);
    }
  }

  function handleDayChange(i: number) {
    const key   = WEEKDAY_KEY[DAYS[i].getDay()];
    const sched = instructor.weekSchedule?.[key];
    if (!sched) return;
    setDayIdx(i);
    // При «Весь день» время начала = старт рабочего дня
    setTimeStart(isFullDay ? sched.start : null);
  }

  function handleSubmit() {
    if (!format || (!duration && !isFullDay) || dayIdx === null || !timeStart || submitting || submitted) return;
    // Если гость ещё не зарегистрирован — показываем BottomSheet
    if (!localStorage.getItem('guestName')) {
      setShowRegSheet(true);
      return;
    }
    void doSubmit();
  }

  async function doSubmit() {
    if (!format || (!duration && !isFullDay) || dayIdx === null || !timeStart || submitting || submitted) return;
    const date    = DAYS[dayIdx];
    const dateISO = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const timeEnd = isFullDay && selectedDaySchedule
      ? selectedDaySchedule.end
      : addMinutes(timeStart, duration!);

    // Server format is individual | mini_group; price/student decided server-side.
    const serverFormat = format === 'miniGroup' ? 'mini_group' : 'individual';
    const durationKey = format === 'individual' && duration
      ? INDIVIDUAL_DURATION_KEY[duration]
      : undefined;

    setSubmitting(true);
    setBookingError(null);
    const res = await createBooking({
      instructorId: instructor.id,
      date:         dateISO,
      startTime:    timeStart,
      endTime:      timeEnd,
      format:       serverFormat,
      durationKey,
      groupSize:    format === 'miniGroup' ? groupSize : undefined,
    });
    setSubmitting(false);

    if (res.ok) {
      setSubmitted(true);
      setShowToast(true);
      setTimeout(() => { setShowToast(false); onBooked(); }, 2000);
    } else {
      setBookingError(
        res.code === 'SLOT_TAKEN'
          ? 'Этот интервал только что заняли — выберите другое время'
          : res.error || 'Не удалось создать заявку, попробуйте ещё раз',
      );
    }
  }

  const avStyle = AV_STYLE[instructor.avatarColor] ?? AV_STYLE.mint;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.screen}>
      <div className={styles.topbar}>
        <div className={styles.tbRow}>
          <button className={styles.tbBack} onClick={onBack}>‹</button>
          <div className={styles.tbTitle}>Записаться</div>
        </div>
      </div>

      <div className={styles.scroll} ref={scrollRef}>

        {/* ── Instructor mini card ── */}
        <div className={styles.instrCard}>
          <div className={styles.instrAv} style={avStyle}>{instructor.initials}</div>
          <div className={styles.instrInfo}>
            <div className={styles.instrName}>{instructor.name}</div>
            <div className={styles.instrSub}>
              {instructor.type.includes('ski') ? 'Горные лыжи' : 'Сноуборд'} · от {(instructor.pricing?.individual?.h1 ?? 0).toLocaleString('ru')} ₽/ч
            </div>
          </div>
          {hasRating(instructor.rating) && (
            <div className={styles.instrRating}>★ {instructor.rating.toFixed(1)}</div>
          )}
        </div>

        <div className={styles.divider} />

        {/* ── STEP 1 — Format ── */}
        <div className={styles.stepHeader}>
          <div className={`${styles.stepNum} ${format ? styles.stepDone : ''}`}>1</div>
          <div className={styles.sectionLabel}>Формат занятия</div>
        </div>
        <div className={styles.formatChips}>
          {(['individual', 'miniGroup'] as Format[])
            .concat(instructor.worksWithKids ? ['kids' as Format] : [])
            .map(f => (
              <button
                key={f}
                className={`${styles.formatChip} ${format === f ? styles.formatChipActive : ''}`}
                onClick={() => handleFormatChange(f)}
              >
                {FORMAT_LABELS[f]}
              </button>
            ))}
        </div>

        {/* ── STEP 2 — Duration ── */}
        <div className={styles.divider} />
        <div className={styles.stepHeader}>
          <div className={`${styles.stepNum} ${(duration || isFullDay) ? styles.stepDone : ''}`}>2</div>
          <div className={styles.sectionLabel}>Длительность</div>
        </div>
        <div className={`${styles.durationGrid} ${!format ? styles.stepDisabled : ''}`}>
          {DURATION_OPTS.filter(d => {
            // Индивидуальное: 1ч/2ч/3ч/4ч + «Весь день», только если тариф задан
            // в БД (null → вариант скрыт, не показываем 0/«цена не указана»).
            if (format === 'individual') {
              if (![60, 120, 180, 240, 360].includes(d.value)) return false;
              return individualPriceFor(d.value) != null;
            }
            if (d.value === 360) return false;  // «Весь день» (6ч) — только индивидуальное
            if (d.value === 45) return format === 'kids' && instructor.allowsShortSlots;
            return true;                         // kids/miniGroup: 1ч/2ч/3ч/4ч
          }).map(opt => (
            <button
              key={opt.value}
              disabled={!format}
              className={`${styles.durationBtn} ${duration === opt.value && !isFullDay ? styles.durationBtnActive : ''}`}
              onClick={() => handleDurationChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
          {/* «Весь день» — только если задан тариф и формат не «Дети» */}
          {format && format !== 'kids' && !!instructor.pricing?.[format as 'individual' | 'miniGroup']?.fullDay && (
            <button
              className={`${styles.durationBtn} ${isFullDay ? styles.durationBtnActive : ''}`}
              onClick={handleFullDay}
            >
              Весь день
            </button>
          )}
        </div>

        {/* ── STEP 3 — Day ── */}
        <div className={styles.divider} />
        <div className={styles.stepHeader}>
          <div className={`${styles.stepNum} ${dayIdx !== null ? styles.stepDone : ''}`}>3</div>
          <div className={styles.sectionLabel}>Выберите день</div>
        </div>
        {!hasAnyDay ? (
          <div className={styles.noSlots}>Нет доступных дней — инструктор не работает в ближайшие 7 дней</div>
        ) : (
          <div className={`${styles.dayStrip} ${(!duration && !isFullDay) ? styles.stepDisabled : ''}`}>
            {DAYS.map((d, i) => {
              const key         = WEEKDAY_KEY[d.getDay()];
              const sched       = instructor.weekSchedule?.[key];
              // На сегодня учитываем текущее время: если рабочий день уже закончился
              // (нет места хотя бы для минимального 45-мин слота) — день недоступен.
              let hasSchedule   = !!sched;
              if (hasSchedule && i === 0) {
                const now    = new Date();
                const nowMin = now.getHours() * 60 + now.getMinutes();
                hasSchedule  = timeToMin(sched!.end) - 45 > nowMin;
              }
              const isSelected  = i === dayIdx;
              const isDisabled  = (!duration && !isFullDay) || !hasSchedule;
              return (
                <button
                  key={i}
                  disabled={isDisabled}
                  className={`${styles.dayChip} ${isSelected ? styles.dayChipActive : ''} ${!hasSchedule ? styles.dayChipEmpty : ''}`}
                  onClick={() => handleDayChange(i)}
                >
                  <span className={styles.dayChipDate}>{DAY_SHORT[d.getDay()]} {d.getDate()}</span>
                  <span className={styles.dayChipSub}>{hasSchedule ? 'есть' : '—'}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── STEP 4 — Time ── */}
        <div className={styles.divider} />
        <div className={styles.stepHeader}>
          <div className={`${styles.stepNum} ${timeStart ? styles.stepDone : ''}`}>4</div>
          <div className={styles.sectionLabel}>
            {dayIdx !== null
              ? `Время начала — ${DAY_SHORT[DAYS[dayIdx].getDay()]} ${DAYS[dayIdx].getDate()} ${MONTH_RU[DAYS[dayIdx].getMonth()]}`
              : 'Время начала'}
          </div>
        </div>
        {dayIdx !== null && mcWindows.length > 0 && (
          <div className={styles.mcNote}>
            <Icon name="ski" size={14} />
            <span>
              {mcWindows.map(w => `${w.start}–${w.end}`).join(', ')} — мастер-класс,
              индивидуальная запись в это время недоступна
            </span>
          </div>
        )}
        {isFullDay ? (
          dayIdx === null ? (
            <div className={styles.noSlots}>Выберите день</div>
          ) : mcWindows.length > 0 ? (
            <div className={styles.noSlots}>
              В этот день инструктор ведёт мастер-класс — «Весь день» недоступен, выберите другой день
            </div>
          ) : (
            <div className={styles.timeList}>
              <div className={`${styles.timeBtn} ${styles.timeBtnActive}`} style={{ cursor: 'default' }}>
                <span className={styles.timeBtnTime}>{selectedDaySchedule!.start} — {selectedDaySchedule!.end}</span>
                <span className={styles.timeBtnDur}>Весь день</span>
              </div>
            </div>
          )
        ) : !duration || dayIdx === null ? (
          <div className={styles.noSlots}>Выберите длительность и день</div>
        ) : slots.length === 0 ? (
          <div className={styles.noSlots}>Нет свободных слотов — выберите другой день</div>
        ) : (
          <div className={styles.timeList}>
            {slots.map(t => {
              const isSelected = timeStart === t;
              return (
                <button
                  key={t}
                  className={`${styles.timeBtn} ${isSelected ? styles.timeBtnActive : ''}`}
                  onClick={() => setTimeStart(isSelected ? null : t)}
                >
                  <span className={styles.timeBtnTime}>{t} — {addMinutes(t, duration!)}</span>
                  <span className={styles.timeBtnDur}>{durationLabel(duration!)}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── STEP 5 — Group size (miniGroup only) ── */}
        {format === 'miniGroup' && (
          <>
            <div className={styles.divider} />
            <div className={styles.stepHeader}>
              <div className={`${styles.stepNum} ${styles.stepDone}`}>5</div>
              <div className={styles.sectionLabel}>Количество участников</div>
            </div>
            <div className={styles.stepperWrap}>
              <button
                className={styles.stepperBtn}
                onClick={() => setGroupSize(n => Math.max(2, n - 1))}
                disabled={groupSize <= 2}
              >−</button>
              <span className={styles.stepperVal}>{groupSize}</span>
              <button
                className={styles.stepperBtn}
                onClick={() => setGroupSize(n => Math.min(instructor.pricing?.miniGroup?.maxParticipants ?? n, n + 1))}
                disabled={groupSize >= (instructor.pricing?.miniGroup?.maxParticipants ?? 0)}
              >+</button>
              <span className={styles.stepperLabel}>чел. · макс. {instructor.pricing?.miniGroup?.maxParticipants ?? '—'}</span>
            </div>
          </>
        )}

        {/* ── Message ── */}
        <div className={styles.divider} />
        <div className={styles.sectionLabel}>Сообщение инструктору (необязательно)</div>
        <textarea
          className="input-field input-field--textarea"
          style={{ margin: '0 16px', width: 'calc(100% - 32px)' }}
          placeholder={format === 'kids' ? 'Укажите возраст ребёнка и опыт катания' : 'Любые пожелания или вопросы...'}
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
        />

        {/* Bottom padding for summary bar */}
        <div style={{ height: 180 }} />
      </div>

      {/* ── Summary bar — fixed at bottom ── */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryRows}>
          {format && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>{FORMAT_LABELS[format]}</span>
              {isFullDay ? (
                <span className={styles.summaryMeta}>Весь день</span>
              ) : duration ? (
                <span className={styles.summaryMeta}>
                  {durationLabel(duration)}
                </span>
              ) : null}
            </div>
          )}
          {selectedDay && timeStart && (isFullDay || duration) && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>
                {DAY_SHORT[selectedDay.getDay()]} {selectedDay.getDate()} {MONTH_RU[selectedDay.getMonth()]}
              </span>
              <span className={styles.summaryMeta}>
                {timeStart} — {isFullDay && selectedDaySchedule
                  ? selectedDaySchedule.end
                  : addMinutes(timeStart, duration!)}
              </span>
            </div>
          )}
          {format && (isFullDay || duration) && (
            <div className={styles.summaryPriceRow}>
              <span className={styles.summaryPrice}>{getPrice().toLocaleString('ru')} ₽</span>
              {format === 'miniGroup' && (
                <span className={styles.summaryPriceSub}>
                  за {groupSize} чел. · {Math.round(getPrice() / groupSize).toLocaleString('ru')} ₽/чел.
                </span>
              )}
            </div>
          )}
        </div>
        {bookingError && (
          <div className={styles.bookingError} role="alert">{bookingError}</div>
        )}
        <button
          className={styles.submitBtn}
          disabled={!format || (!duration && !isFullDay) || dayIdx === null || !timeStart || submitting || submitted}
          onClick={handleSubmit}
        >
          {submitting ? 'Отправка…' : 'Отправить заявку →'}
        </button>
      </div>

      {/* ── Toast ── */}
      {showToast && (
        <div className={styles.toast}>✓ Заявка отправлена! Инструктор ответит в течение 12 часов.</div>
      )}

      {/* ── Регистрация при первой записи ── */}
      {showRegSheet && (
        <RegistrationBottomSheet
          onDismiss={() => setShowRegSheet(false)}
          onSaved={() => { setShowRegSheet(false); doSubmit(); }}
        />
      )}
    </div>
  );
}
