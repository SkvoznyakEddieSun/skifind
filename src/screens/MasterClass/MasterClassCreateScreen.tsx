import { useState } from 'react';
import styles from './MasterClassCreateScreen.module.css';

// ── Types ──────────────────────────────────────────────────────────────────

type McSport = 'ski' | 'board';
type McLevel = 'beginner' | 'advanced' | 'all';

const LEVEL_LABELS: Record<McLevel, string> = {
  beginner: 'Начинающие',
  advanced: 'Продвинутые',
  all:      'Все уровни',
};

const DURATIONS = [60, 90, 120, 180] as const;

function durationLabel(min: number): string {
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}ч ${m}м` : `${h} ч`;
}

// ── Date helpers ───────────────────────────────────────────────────────────

const DAY_SHORT  = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTH_SHORT = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];

const todayBase = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();

// 30 дней вперёд для выбора даты
const UPCOMING_DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(todayBase);
  d.setDate(todayBase.getDate() + i);
  return d;
});

function dayOptionLabel(d: Date): string {
  const month = MONTH_SHORT[d.getMonth()];
  if (d.getTime() === todayBase.getTime()) return `Сегодня, ${d.getDate()} ${month}`;
  const tomorrow = new Date(todayBase); tomorrow.setDate(todayBase.getDate() + 1);
  if (d.getTime() === tomorrow.getTime()) return `Завтра, ${d.getDate()} ${month}`;
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${month}`;
}

// Популярные времена начала: с 8:00 до 18:00 с шагом 30 мин
const START_TIMES: string[] = [];
for (let h = 8; h <= 18; h++) {
  START_TIMES.push(`${String(h).padStart(2,'0')}:00`);
  if (h < 18) START_TIMES.push(`${String(h).padStart(2,'0')}:30`);
}

// ── Props ──────────────────────────────────────────────────────────────────

interface MasterClassCreateScreenProps {
  onBack:      () => void;
  onPublished: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function MasterClassCreateScreen({ onBack, onPublished }: MasterClassCreateScreenProps) {
  const [title,        setTitle]        = useState('');
  const [sport,        setSport]        = useState<McSport>('ski');
  const [level,        setLevel]        = useState<McLevel>('beginner');
  const [selectedDay,  setSelectedDay]  = useState<Date | null>(null);
  const [time,         setTime]         = useState('');
  const [duration,     setDuration]     = useState<number>(90);
  const [maxParts,     setMaxParts]     = useState(8);
  const [price,        setPrice]        = useState('');
  const [location,     setLocation]     = useState('');
  const [description,  setDescription]  = useState('');
  const [showToast,    setShowToast]    = useState(false);

  const canPublish = title.trim() && selectedDay && time && price.trim() && location.trim();

  function handlePublish() {
    if (!canPublish) return;
    setShowToast(true);
    setTimeout(() => { setShowToast(false); onPublished(); }, 2000);
  }

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

        {/* Date + Time selects */}
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
                <option key={i} value={d.toISOString()}>
                  {dayOptionLabel(d)}
                </option>
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

        {/* Price */}
        <div className={styles.sectionLabel}>ЦЕНА ЗА УЧАСТИЕ (₽)</div>
        <input
          type="number"
          inputMode="numeric"
          className={styles.textInput}
          placeholder="Например, 3 500"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />

        {/* Location */}
        <div className={styles.sectionLabel}>МЕСТО ВСТРЕЧИ</div>
        <input
          className={styles.textInput}
          placeholder='Например, «Касса Шерегеш, вход А»'
          value={location}
          onChange={e => setLocation(e.target.value)}
        />

        {/* Description */}
        <div className={styles.sectionLabel}>ОПИСАНИЕ (НЕОБЯЗАТЕЛЬНО)</div>
        <textarea
          className={`${styles.textInput} ${styles.textArea}`}
          placeholder="Расскажите, что будет на мастер-классе, кому подходит и что взять с собой…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
        />

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
