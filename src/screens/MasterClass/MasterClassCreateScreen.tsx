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

const DURATIONS       = [60, 120, 180, 240] as const;
const DEADLINE_HOURS  = [2, 6, 12, 24, 48] as const;
const MAX_DESC        = 300;
const PRICE_MIN       = 300;
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
  const [duration,    setDuration]    = useState<number>(60);
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
  const priceValid = !price.trim() || (!isNaN(priceNum) && priceNum >= PRICE_MIN);
  const priceError = price.trim() && !priceValid
    ? `Цена от ${PRICE_MIN.toLocaleString('ru')} ₽`
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
      instructorId:         'aleksey',
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
      participants:         [],
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
      <div className={styles.topbar}>
        <div className={styles.tbRow}>
          <button className={styles.tbBack} onClick={onBack}>‹</button>
          <div style={{ flex: 1 }}>
            <div className={styles.tbTitle}>Новый мастер-класс</div>
          </div>
        </div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.body}>

          {/* Название */}
          <div className={styles.sectionLabel}>Название</div>
          <input
            className="input-field input-field--left"
            placeholder='Например, «Техника карвинга»'
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={60}
          />

          {/* Вид спорта */}
          <div className={styles.sectionLabel}>Вид спорта</div>
          <div className={styles.card}>
            <div className={styles.chips}>
              {(['ski', 'board'] as McSport[]).map(s => (
                <button
                  key={s}
                  className={`${styles.chip} ${sport === s ? styles.chipActive : ''}`}
                  onClick={() => setSport(s)}
                >
                  {s === 'ski' ? 'Горные лыжи' : 'Сноуборд'}
                </button>
              ))}
            </div>
          </div>

          {/* Уровень участников */}
          <div className={styles.sectionLabel}>Уровень участников</div>
          <div className={styles.card}>
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
          </div>

          {/* Дата и время */}
          <div className={styles.sectionLabel}>Дата и время</div>
          <div className={styles.card}>
            <div className={styles.row2}>
              <div className={styles.row2Inner}>
                <div className={styles.rowLabel}>Дата</div>
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
              <div>
                <div className={styles.rowLabel}>Время</div>
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
          </div>

          {/* Продолжительность */}
          <div className={styles.sectionLabel}>Продолжительность</div>
          <div className={styles.card}>
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
          </div>

          {/* Участники */}
          <div className={styles.sectionLabel}>Количество участников</div>
          <div className={styles.card}>
            <div className={styles.stepper}>
              <span className={styles.stepperLabel}>Максимум</span>
              <button className={styles.stepperBtn} onClick={() => setMaxParts(p => Math.max(2, p - 1))}>−</button>
              <span className={styles.stepperVal}>{maxParts}</span>
              <button className={styles.stepperBtn} onClick={() => setMaxParts(p => Math.min(30, p + 1))}>+</button>
              <span className={styles.stepperHint}>чел.</span>
            </div>
            <div className={styles.cardDivider} />
            <div className={styles.stepper}>
              <span className={styles.stepperLabel}>Минимум</span>
              <button className={styles.stepperBtn} onClick={() => setMinParts(p => Math.max(2, p - 1))}>−</button>
              <span className={styles.stepperVal}>{minParts}</span>
              <button className={styles.stepperBtn} onClick={() => setMinParts(p => Math.min(maxParts, p + 1))}>+</button>
              <span className={styles.stepperHint}>чел.</span>
            </div>
            <div className={styles.cardHint}>Если не наберётся минимум — занятие отменится</div>
          </div>

          {/* Цена */}
          <div className={styles.sectionLabel}>Цена за участие (₽)</div>
          <div className={styles.card}>
            <input
              type="number"
              inputMode="numeric"
              className={`input-field input-field--left${priceError ? ' input-field--error' : ''}`}
              placeholder={`от ${PRICE_MIN.toLocaleString('ru')}`}
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
            {priceError && <div className={styles.fieldError}>{priceError}</div>}
            {totalRevenue && !priceError && (
              <div className={styles.pricePreview}>
                При полной группе: {totalRevenue.toLocaleString('ru')} ₽ · Комиссия 5%: {commission!.toLocaleString('ru')} ₽
              </div>
            )}
          </div>

          {/* Место встречи */}
          <div className={styles.sectionLabel}>Место встречи</div>
          <input
            className="input-field input-field--left"
            placeholder='Например, «Касса Шерегеш, вход А»'
            value={location}
            onChange={e => setLocation(e.target.value)}
          />

          {/* Дедлайн записи */}
          <div className={styles.sectionLabel}>Дедлайн записи</div>
          <div className={styles.card}>
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
            <div className={styles.cardHint}>
              После этого срока запись закроется. Если не наберётся минимум — отменится автоматически.
            </div>
          </div>

          {/* Описание */}
          <div className={styles.sectionLabel}>
            Описание <span className={styles.optional}>(необязательно)</span>
          </div>
          <div className={styles.card}>
            <textarea
              className="input-field input-field--textarea"
              placeholder="Расскажите, что будет на мастер-классе, кому подходит и что взять с собой…"
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, MAX_DESC))}
              rows={4}
            />
            <div className={`${styles.descCount} ${description.length > MAX_DESC - 30 ? styles.descCountWarn : ''}`}>
              {description.length}/{MAX_DESC}
            </div>
          </div>

          {/* Публикация */}
          <button className={styles.publishBtn} onClick={handlePublish} disabled={!canPublish}>
            Опубликовать →
          </button>

        </div>
      </div>

      {showToast && (
        <div className={styles.toast}>
          ✓ Мастер-класс опубликован! Участники уже могут записаться.
        </div>
      )}
    </div>
  );
}
