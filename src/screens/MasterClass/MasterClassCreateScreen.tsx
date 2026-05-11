import { useState, useEffect } from 'react';
import styles from './MasterClassCreateScreen.module.css';
import {
  MASTER_CLASSES,
  type MasterClass,
  type McSport,
  type McLevel,
  type McLevelColor,
} from './masterClassData';

// ── Constants ──────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<McLevel, string> = {
  beginner: 'Начинающие',
  advanced: 'Продвинутые',
  all:      'Все уровни',
};

const LEVEL_COLORS: Record<McLevel, McLevelColor> = {
  beginner: 'mint',
  advanced: 'straw',
  all:      'purple',
};

const DURATIONS       = [60, 90, 120, 180] as const;
const DEADLINE_HOURS  = [2, 6, 12, 24, 48] as const;
const MAX_DESC        = 300;
const PRICE_MIN       = 300;
const PRICE_MAX       = 30_000;
const COMMISSION_RATE = 0.05;

function durationLabel(min: number): string {
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}ч ${m}м` : `${h} ч`;
}

// ── Date helpers ───────────────────────────────────────────────────────────

const DAY_SHORT_RU = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const DAY_SHORT_UI = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTH_SHORT  = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];

const todayBase = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

const UPCOMING_DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(todayBase);
  d.setDate(todayBase.getDate() + i);
  return d;
});

function dayOptionLabel(d: Date): string {
  const month = MONTH_SHORT[d.getMonth()];
  if (d.getTime() === todayBase.getTime()) return `Сегодня, ${d.getDate()} ${month}`;
  const tomorrow = new Date(todayBase);
  tomorrow.setDate(todayBase.getDate() + 1);
  if (d.getTime() === tomorrow.getTime()) return `Завтра, ${d.getDate()} ${month}`;
  return `${DAY_SHORT_UI[d.getDay()]} ${d.getDate()} ${month}`;
}

const START_TIMES: string[] = [];
for (let h = 8; h <= 18; h++) {
  START_TIMES.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 18) START_TIMES.push(`${String(h).padStart(2, '0')}:30`);
}

function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const total  = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// ── Props ──────────────────────────────────────────────────────────────────

interface MasterClassCreateScreenProps {
  onBack:      () => void;
  onPublished: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function MasterClassCreateScreen({ onBack, onPublished }: MasterClassCreateScreenProps) {
  const [title,       setTitle]       = useState('');
  const [sport,       setSport]       = useState<McSport>('ski');
  const [level,       setLevel]       = useState<McLevel>('beginner');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [time,        setTime]        = useState('');
  const [duration,    setDuration]    = useState<number>(90);
  const [maxParts,    setMaxParts]    = useState(8);
  const [minParts,    setMinParts]    = useState(2);
  const [price,       setPrice]       = useState('');
  const [location,    setLocation]    = useState('');
  const [deadline,    setDeadline]    = useState<number>(12);
  const [description, setDescription] = useState('');
  const [showToast,   setShowToast]   = useState(false);

  // minParts не может превышать maxParts
  useEffect(() => {
    setMinParts(prev => Math.min(prev, maxParts));
  }, [maxParts]);

  // ── Price validation ──────────────────────────────────────────────────────
  const priceNum   = parseInt(price, 10);
  const priceValid = !price.trim() || (!isNaN(priceNum) && priceNum >= PRICE_MIN && priceNum <= PRICE_MAX);
  const priceError = price.trim() && !priceValid
    ? `Цена от ${PRICE_MIN.toLocaleString('ru')} до ${PRICE_MAX.toLocaleString('ru')} ₽`
    : null;

  // ── Full-group revenue preview ────────────────────────────────────────────
  const totalRevenue = priceValid && priceNum > 0 ? priceNum * maxParts : null;
  const commission   = totalRevenue ? Math.round(totalRevenue * COMMISSION_RATE) : null;

  const canPublish = !!(title.trim() && selectedDay && time && price.trim() && priceValid && location.trim());

  // ── Publish ───────────────────────────────────────────────────────────────
  function handlePublish() {
    if (!canPublish || !selectedDay) return;

    // TODO(backend): POST /api/instructors/me/masterclasses
    const endTime   = addMinutes(time, duration);
    const [h, m]    = time.split(':').map(Number);
    const eventDate = new Date(selectedDay);
    eventDate.setHours(h, m, 0, 0);

    const newMc: MasterClass = {
      id:                   `mc-${Date.now()}`,
      title:                title.trim(),
      sport,
      level,
      levelLabel:           LEVEL_LABELS[level],
      levelColor:           LEVEL_COLORS[level],
      // Инструктор захардкожен для прототипа
      instructorName:       'Алексей Морозов',
      instructorInitials:   'АМ',
      instructorAvatarColor:'ice',
      instructorRating:     4.9,
      weekday:              DAY_SHORT_RU[selectedDay.getDay()],
      date:                 `${selectedDay.getDate()} ${MONTH_SHORT[selectedDay.getMonth()]}`,
      time:                 `${time} — ${endTime}`,
      location:             location.trim(),
      price:                priceNum,
      maxParticipants:      maxParts,
      minParticipants:      minParts,
      currentParticipants:  0,
      description:          description.trim(),
      bookingDeadlineHours: deadline,
      eventDateISO:         eventDate.toISOString(),
    };

    MASTER_CLASSES.unshift(newMc);

    setShowToast(true);
    setTimeout(() => { setShowToast(false); onPublished(); }, 2000);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>‹</button>
        <div className={styles.headerTitle}>Новый мастер-класс</div>
      </div>

      <div className={styles.scroll}>

        {/* Title */}
        <div className={styles.sectionLabel}>НАЗВАНИЕ</div>
        <input
          className={styles.textInput}
          placeholder='Например, «Техника карвинга»'
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={60}
        />

        {/* Sport */}
        <div className={styles.sectionLabel}>ВИД СПОРТА</div>
        <div className={styles.chips}>
          {(['ski', 'board'] as McSport[]).map(s => (
            <button
              key={s}
              className={`${styles.chip} ${sport === s ? styles.chipActive : ''}`}
              onClick={() => setSport(s)}
            >
              {s === 'ski' ? '🎿 Горные лыжи' : '🏂 Сноуборд'}
            </button>
          ))}
        </div>

        {/* Level */}
        <div className={styles.sectionLabel}>УРОВЕНЬ УЧАСТНИКОВ</div>
        <div className={styles.chips}>
          {(Object.keys(LEVEL_LABELS) as McLevel[]).map(l => (
            <button
              key={l}
              className={`${styles.chip} ${level === l ? styles.chipActive : ''}`}
              onClick={() => setLevel(l)}
            >
              {LEVEL_LABELS[l]}
            </button>
          ))}
        </div>

        {/* Date + Time */}
        <div className={styles.row2}>
          <div style={{ flex: 1 }}>
            <div className={styles.sectionLabel}>ДАТА</div>
            <select
              className={styles.selectInput}
              value={selectedDay ? selectedDay.toISOString() : ''}
              onChange={e => {
                const d = UPCOMING_DAYS.find(d => d.toISOString() === e.target.value) ?? null;
                setSelectedDay(d);
              }}
            >
              <option value="">— выберите —</option>
              {UPCOMING_DAYS.map((d, i) => (
                <option key={i} value={d.toISOString()}>{dayOptionLabel(d)}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div className={styles.sectionLabel}>ВРЕМЯ</div>
            <select
              className={styles.selectInput}
              value={time}
              onChange={e => setTime(e.target.value)}
            >
              <option value="">— выберите —</option>
              {START_TIMES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Duration */}
        <div className={styles.sectionLabel}>ПРОДОЛЖИТЕЛЬНОСТЬ</div>
        <div className={styles.chips}>
          {DURATIONS.map(d => (
            <button
              key={d}
              className={`${styles.chip} ${duration === d ? styles.chipActive : ''}`}
              onClick={() => setDuration(d)}
            >
              {durationLabel(d)}
            </button>
          ))}
        </div>

        {/* Max participants */}
        <div className={styles.sectionLabel}>МАКС. УЧАСТНИКОВ</div>
        <div className={styles.stepper}>
          <button className={styles.stepperBtn} onClick={() => setMaxParts(p => Math.max(2, p - 1))}>−</button>
          <span className={styles.stepperVal}>{maxParts}</span>
          <button className={styles.stepperBtn} onClick={() => setMaxParts(p => Math.min(30, p + 1))}>+</button>
          <span className={styles.stepperHint}>человек</span>
        </div>

        {/* Min participants (КРИТИЧНО 1) */}
        <div className={styles.sectionLabel}>МИН. УЧАСТНИКОВ</div>
        <div className={styles.stepper}>
          <button className={styles.stepperBtn} onClick={() => setMinParts(p => Math.max(2, p - 1))}>−</button>
          <span className={styles.stepperVal}>{minParts}</span>
          <button className={styles.stepperBtn} onClick={() => setMinParts(p => Math.min(maxParts, p + 1))}>+</button>
          <span className={styles.stepperHintLong}>человек (если не наберётся — занятие отменится)</span>
        </div>

        {/* Price (МЕЛКОЕ 2: валидация + МЕЛКОЕ 3: превью) */}
        <div className={styles.sectionLabel}>ЦЕНА ЗА УЧАСТИЕ (₽)</div>
        <input
          type="number"
          inputMode="numeric"
          className={`${styles.textInput} ${priceError ? styles.textInputError : ''}`}
          placeholder={`${PRICE_MIN.toLocaleString('ru')} — ${PRICE_MAX.toLocaleString('ru')}`}
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
        {priceError && (
          <div className={styles.fieldError}>{priceError}</div>
        )}
        {totalRevenue && !priceError && (
          <div className={styles.pricePreview}>
            При полной группе: {totalRevenue.toLocaleString('ru')} ₽ · Комиссия 5%: {commission!.toLocaleString('ru')} ₽
          </div>
        )}

        {/* Location */}
        <div className={styles.sectionLabel}>МЕСТО ВСТРЕЧИ</div>
        <input
          className={styles.textInput}
          placeholder='Например, «Касса Шерегеш, вход А»'
          value={location}
          onChange={e => setLocation(e.target.value)}
        />

        {/* Booking deadline (КРИТИЧНО 3) */}
        <div className={styles.sectionLabel}>ДЕДЛАЙН ЗАПИСИ (ЧАС ДО НАЧАЛА)</div>
        <div className={styles.chips}>
          {DEADLINE_HOURS.map(h => (
            <button
              key={h}
              className={`${styles.chip} ${deadline === h ? styles.chipActive : ''}`}
              onClick={() => setDeadline(h)}
            >
              {h} ч
            </button>
          ))}
        </div>
        <div className={styles.deadlineHint}>
          После этого срока запись закроется. Если не наберётся минимум — отменится автоматически.
        </div>

        {/* Description (МЕЛКОЕ 1: 300 символов + счётчик) */}
        <div className={styles.sectionLabel}>ОПИСАНИЕ (НЕОБЯЗАТЕЛЬНО)</div>
        <textarea
          className={`${styles.textInput} ${styles.textArea}`}
          placeholder="Расскажите, что будет на мастер-классе, кому подходит и что взять с собой…"
          value={description}
          onChange={e => setDescription(e.target.value.slice(0, MAX_DESC))}
          rows={4}
        />
        <div className={`${styles.descCount} ${description.length > MAX_DESC - 30 ? styles.descCountWarn : ''}`}>
          {description.length}/{MAX_DESC}
        </div>

        {/* Publish */}
        <button className={styles.publishBtn} onClick={handlePublish} disabled={!canPublish}>
          Опубликовать →
        </button>

        <div style={{ height: 32 }} />
      </div>

      {showToast && (
        <div className={styles.toast}>
          ✓ Мастер-класс опубликован! Участники уже могут записаться.
        </div>
      )}
    </div>
  );
}
