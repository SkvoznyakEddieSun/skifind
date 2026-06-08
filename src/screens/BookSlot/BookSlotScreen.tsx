import { useState, useRef } from 'react';
import styles from './BookSlotScreen.module.css';
import type { Instructor, WeekDay, DayAvailability } from '../Catalog/CatalogScreen';
import { addBooking } from '@/store/bookings';

// ── Types ──────────────────────────────────────────────────────────────────

type Format   = 'individual' | 'miniGroup' | 'kids';
type Duration = 45 | 60 | 120 | 180 | 240;

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
  { value: 45,  label: '45 мин' },
  { value: 60,  label: '1 час'  },
  { value: 120, label: '2 часа' },
  { value: 180, label: '3 часа' },
  { value: 240, label: '4 часа' },
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
  const [dayIdx,    setDayIdx]    = useState<number | null>(null);
  const [timeStart, setTimeStart] = useState<string | null>(null);
  const [groupSize, setGroupSize] = useState(2);
  const [message,   setMessage]   = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────

  const selectedDay         = dayIdx !== null ? DAYS[dayIdx] : null;
  const selectedDayKey      = selectedDay ? WEEKDAY_KEY[selectedDay.getDay()] : null;
  const selectedDaySchedule = selectedDayKey ? instructor.weekSchedule[selectedDayKey] : undefined;

  const slots: string[] = (selectedDaySchedule && duration)
    ? generateSlots(selectedDaySchedule, duration, duration === 45 ? 45 : 60)
    : [];

  function getPrice(): number {
    if (!format || !duration) return 0;
    if (duration === 45) {
      return instructor.pricing.kids?.shortSlot ?? 0;
    }
    const hKey = `h${duration / 60}` as 'h1' | 'h2' | 'h3' | 'h4';
    if (format === 'individual') return instructor.pricing.individual[hKey];
    if (format === 'kids') {
      return instructor.pricing.kids?.individual[hKey] ?? instructor.pricing.individual[hKey];
    }
    // miniGroup
    const base = instructor.pricing.miniGroup[hKey];
    return base + instructor.pricing.miniGroup.extraPersonPrice * (groupSize - 2);
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleFormatChange(f: Format) {
    setFormat(f);
    setDuration(null);
    setDayIdx(null);
    setTimeStart(null);
    setGroupSize(2);
  }

  function handleDurationChange(d: Duration) {
    setDuration(d);
    setDayIdx(null);
    setTimeStart(null);
  }

  function handleDayChange(i: number) {
    const key = WEEKDAY_KEY[DAYS[i].getDay()];
    if (!instructor.weekSchedule[key]) return;
    setDayIdx(i);
    setTimeStart(null);
  }

  function handleSubmit() {
    if (!format || !duration || dayIdx === null || !timeStart || submitted) return;
    const date    = DAYS[dayIdx];
    const timeEnd = addMinutes(timeStart, duration);

    addBooking({
      instructorId:          instructor.id,
      instructorName:        instructor.name,
      instructorInitials:    instructor.initials,
      instructorAvatarColor: instructor.avatarColor,
      instructorSpec:        `${instructor.type.includes('ski') ? 'Горные лыжи' : 'Сноуборд'} · Шерегеш`,
      instructorRating:      instructor.rating,
      date,
      timeStart,
      timeEnd,
      format,
      formatLabel: format === 'miniGroup'
        ? `Мини-группа · ${groupSize} чел.`
        : format === 'kids' ? 'Детское занятие' : 'Индивидуальное занятие',
      discipline: instructor.type.includes('ski') ? 'ski' : 'board',
      level:      format === 'kids' ? 'Дети' : 'Не указан',
      groupSize:  format === 'miniGroup' ? groupSize : undefined,
      price:      getPrice(),
      message,
    });

    setSubmitted(true);
    setShowToast(true);
    setTimeout(() => { setShowToast(false); onBooked(); }, 2000);
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
              {instructor.type.includes('ski') ? 'Горные лыжи' : 'Сноуборд'} · от {instructor.pricing.individual.h1.toLocaleString('ru')} ₽/ч
            </div>
          </div>
          <div className={styles.instrRating}>★ {instructor.rating.toFixed(1)}</div>
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
          <div className={`${styles.stepNum} ${duration ? styles.stepDone : ''}`}>2</div>
          <div className={styles.sectionLabel}>Длительность</div>
        </div>
        <div className={`${styles.durationGrid} ${!format ? styles.stepDisabled : ''}`}>
          {DURATION_OPTS.filter(d => {
            if (d.value === 45) return format === 'kids' && instructor.allowsShortSlots;
            return true;
          }).map(opt => (
            <button
              key={opt.value}
              disabled={!format}
              className={`${styles.durationBtn} ${duration === opt.value ? styles.durationBtnActive : ''}`}
              onClick={() => handleDurationChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ── STEP 3 — Day ── */}
        <div className={styles.divider} />
        <div className={styles.stepHeader}>
          <div className={`${styles.stepNum} ${dayIdx !== null ? styles.stepDone : ''}`}>3</div>
          <div className={styles.sectionLabel}>Выберите день</div>
        </div>
        <div className={`${styles.dayStrip} ${!duration ? styles.stepDisabled : ''}`}>
          {DAYS.map((d, i) => {
            const key         = WEEKDAY_KEY[d.getDay()];
            const hasSchedule = !!instructor.weekSchedule[key];
            const isSelected  = i === dayIdx;
            const isDisabled  = !duration || !hasSchedule;
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
        {!duration || dayIdx === null ? (
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
                  <span className={styles.timeBtnDur}>{duration === 45 ? '45 мин' : `${duration! / 60} ч`}</span>
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
                onClick={() => setGroupSize(n => Math.min(instructor.pricing.miniGroup.maxParticipants, n + 1))}
                disabled={groupSize >= instructor.pricing.miniGroup.maxParticipants}
              >+</button>
              <span className={styles.stepperLabel}>чел. · макс. {instructor.pricing.miniGroup.maxParticipants}</span>
            </div>
          </>
        )}

        {/* ── Message ── */}
        <div className={styles.divider} />
        <div className={styles.sectionLabel}>Сообщение инструктору (необязательно)</div>
        <textarea
          className={styles.messageInput}
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
              {duration && (
                <span className={styles.summaryMeta}>
                  {duration === 45 ? '45 мин' : `${duration / 60} ч`}
                </span>
              )}
            </div>
          )}
          {selectedDay && timeStart && duration && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>
                {DAY_SHORT[selectedDay.getDay()]} {selectedDay.getDate()} {MONTH_RU[selectedDay.getMonth()]}
              </span>
              <span className={styles.summaryMeta}>{timeStart} — {addMinutes(timeStart, duration)}</span>
            </div>
          )}
          {format && duration && (
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
        <button
          className={styles.submitBtn}
          disabled={!format || !duration || dayIdx === null || !timeStart || submitted}
          onClick={handleSubmit}
        >
          Отправить заявку →
        </button>
      </div>

      {/* ── Toast ── */}
      {showToast && (
        <div className={styles.toast}>✓ Заявка отправлена! Инструктор ответит в течение 12 часов.</div>
      )}
    </div>
  );
}
