import { useState, useMemo } from 'react';
import styles from './BookSlotScreen.module.css';
import type { Instructor } from '../Catalog/CatalogScreen';

// ── Types ──────────────────────────────────────────────────────────────────

type Format = 'individual' | 'miniGroup' | 'kids';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
  duration: number; // minutes
}

// ── Helpers ────────────────────────────────────────────────────────────────

const MONTH_RU = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн',
                   'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const DAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

const today = new Date();
today.setHours(0, 0, 0, 0);

const HORIZON_DAYS = 7;
const DAYS = Array.from({ length: HORIZON_DAYS }, (_, i) => {
  const d = new Date(today);
  d.setDate(today.getDate() + i);
  return d;
});

// Avatar color map for instructor mini-card
const AV_STYLE: Record<string, React.CSSProperties> = {
  ice:    { background: 'var(--ice, #E0F2FE)',          color: 'var(--accent)' },
  mint:   { background: 'var(--mint)',                  color: 'var(--mint-text)' },
  straw:  { background: 'var(--straw)',                 color: 'var(--straw-text)' },
  purple: { background: 'rgba(124,58,237,.15)',         color: '#A78BFA' },
  blue:   { background: 'var(--accent)',                color: 'var(--accent-text)' },
};

/**
 * Mock slots per day — realistic ski school schedule.
 * Duration depends on the selected format:
 *   individual → 90 min (4 weekday / 2 Saturday slots)
 *   miniGroup  → 120 min (3 weekday / 2 Saturday slots)
 *   kids       → 45 min with breaks (4 weekday / 2 Saturday slots)
 * Sunday is always closed.
 */
function mockSlotsForDate(date: Date, format: Format): TimeSlot[] {
  const dow = date.getDay();
  const ds  = date.toISOString().slice(0, 10);

  if (dow === 0) return []; // Sunday — closed

  if (format === 'kids') {
    if (dow === 6) return [
      { id: `${ds}-0`, start: '10:00', end: '10:45', duration: 45 },
      { id: `${ds}-1`, start: '11:00', end: '11:45', duration: 45 },
    ];
    return [
      { id: `${ds}-0`, start: '09:30', end: '10:15', duration: 45 },
      { id: `${ds}-1`, start: '10:30', end: '11:15', duration: 45 },
      { id: `${ds}-2`, start: '11:30', end: '12:15', duration: 45 },
      { id: `${ds}-3`, start: '14:00', end: '14:45', duration: 45 },
    ];
  }

  if (format === 'miniGroup') {
    if (dow === 6) return [
      { id: `${ds}-0`, start: '10:00', end: '12:00', duration: 120 },
      { id: `${ds}-1`, start: '12:30', end: '14:30', duration: 120 },
    ];
    return [
      { id: `${ds}-0`, start: '09:30', end: '11:30', duration: 120 },
      { id: `${ds}-1`, start: '12:00', end: '14:00', duration: 120 },
      { id: `${ds}-2`, start: '14:30', end: '16:30', duration: 120 },
    ];
  }

  // individual — 90-min slots
  if (dow === 6) return [
    { id: `${ds}-0`, start: '10:00', end: '11:30', duration: 90 },
    { id: `${ds}-1`, start: '12:00', end: '13:30', duration: 90 },
  ];
  return [
    { id: `${ds}-0`, start: '09:30', end: '11:00', duration: 90 },
    { id: `${ds}-1`, start: '11:15', end: '12:45', duration: 90 },
    { id: `${ds}-2`, start: '14:00', end: '15:30', duration: 90 },
    { id: `${ds}-3`, start: '15:45', end: '17:15', duration: 90 },
  ];
}

const FORMAT_LABELS: Record<Format, string> = {
  individual: 'Индивидуальное',
  miniGroup:  'Мини-группа',
  kids:       'Дети 45 мин',
};

function formatDate(date: Date): string {
  return `${DAY_SHORT[date.getDay()]} ${date.getDate()} ${MONTH_RU[date.getMonth()]}`;
}

// ── Props ──────────────────────────────────────────────────────────────────

interface BookSlotScreenProps {
  onBack: () => void;
  onBooked: () => void;
  instructor: Instructor;
}

// ── Component ──────────────────────────────────────────────────────────────

export function BookSlotScreen({ onBack, onBooked, instructor }: BookSlotScreenProps) {
  const [format, setFormat] = useState<Format>('individual');
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [message, setMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [booked, setBooked] = useState(false);

  // Prices derived from instructor's base price
  const FORMAT_PRICES: Record<Format, number> = {
    individual: instructor.price,
    miniGroup:  Math.round(instructor.price * 1.4 / 100) * 100,
    kids:       Math.round(instructor.price * 0.8 / 100) * 100,
  };

  const selectedDate = DAYS[selectedDayIdx];

  // Slots for each day depend on the selected format
  const slotsByDay = useMemo(() =>
    DAYS.map(d => mockSlotsForDate(d, format)),
    [format]
  );

  const slotsForDay = slotsByDay[selectedDayIdx];
  const totalSlots  = slotsByDay.reduce((acc, s) => acc + s.length, 0);

  const handleFormatChange = (f: Format) => {
    setFormat(f);
    setSelectedSlot(null);
  };

  const handleDayChange = (idx: number) => {
    if (slotsByDay[idx].length === 0) return;
    setSelectedDayIdx(idx);
    setSelectedSlot(null);
  };

  function handleSend() {
    if (!selectedSlot) return;
    setBooked(true);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onBooked();
    }, 2000);
  }

  const avStyle = AV_STYLE[instructor.avatarColor] ?? AV_STYLE.mint;

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>‹</button>
        <div className={styles.headerTitle}>Записаться</div>
      </div>

      <div className={styles.scroll}>
        {/* Instructor mini-card */}
        <div className={styles.instrCard}>
          <div className={styles.instrAv} style={avStyle}>{instructor.initials}</div>
          <div className={styles.instrInfo}>
            <div className={styles.instrName}>{instructor.name}</div>
            <div className={styles.instrSub}>
              {instructor.type.includes('ski') ? 'Горные лыжи' : 'Сноуборд'} · от {instructor.price.toLocaleString('ru')} ₽
            </div>
          </div>
          <div className={styles.instrRating}>★ {instructor.rating.toFixed(1)}</div>
        </div>

        <div className={styles.divider} />

        {totalSlots === 0 ? (
          /* ── Empty state ── */
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>😔</div>
            <div className={styles.emptyTitle}>Нет свободного времени</div>
            <div className={styles.emptySub}>
              К сожалению, у этого инструктора сейчас нет свободного времени. Попробуйте посмотреть других инструкторов в Шерегеше.
            </div>
            <button className={styles.emptyBtn} onClick={onBack}>
              К каталогу →
            </button>
          </div>
        ) : (
          <>
            {/* Format selector */}
            <div className={styles.sectionLabel}>Формат занятия</div>
            <div className={styles.formatChips}>
              {(Object.keys(FORMAT_LABELS) as Format[]).map(f => (
                <button
                  key={f}
                  className={`${styles.formatChip} ${format === f ? styles.formatChipActive : ''}`}
                  onClick={() => handleFormatChange(f)}
                >
                  {FORMAT_LABELS[f]}
                </button>
              ))}
            </div>

            <div className={styles.divider} />

            {/* Date range label */}
            <div className={styles.sectionLabel}>
              Свободные дни — {DAYS[0].getDate()} {MONTH_RU[DAYS[0].getMonth()]} — {DAYS[DAYS.length - 1].getDate()} {MONTH_RU[DAYS[DAYS.length - 1].getMonth()]}
            </div>

            {/* Day strip */}
            <div className={styles.dayStrip}>
              {DAYS.map((d, i) => {
                const cnt = slotsByDay[i].length;
                const isEmpty = cnt === 0;
                const isSelected = i === selectedDayIdx;
                return (
                  <button
                    key={i}
                    className={`${styles.dayChip} ${isSelected ? styles.dayChipActive : ''} ${isEmpty ? styles.dayChipEmpty : ''}`}
                    onClick={() => handleDayChange(i)}
                    disabled={isEmpty}
                  >
                    <span className={styles.dayChipDate}>{DAY_SHORT[d.getDay()]} {d.getDate()}</span>
                    <span className={styles.dayChipCount}>{cnt > 0 ? cnt : '—'}</span>
                    {cnt > 0 && <span className={styles.dayChipUnit}>слот{cnt === 1 ? '' : cnt < 5 ? 'а' : 'ов'}</span>}
                  </button>
                );
              })}
            </div>

            <div className={styles.divider} />

            {/* Slot list */}
            <div className={styles.sectionLabel}>
              Свободные слоты на {formatDate(selectedDate)}:
            </div>

            {slotsForDay.length === 0 ? (
              <div className={styles.noSlotsDay}>Нет слотов — выберите другой день</div>
            ) : (
              <div className={styles.slotGrid}>
                {slotsForDay.map(slot => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      className={`${styles.slotBtn} ${isSelected ? styles.slotBtnActive : ''}`}
                      onClick={() => setSelectedSlot(isSelected ? null : slot)}
                    >
                      <span className={styles.slotTime}>{slot.start} — {slot.end}</span>
                      <span className={styles.slotAvail}>свободно</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selection summary */}
            {selectedSlot && (
              <>
                <div className={styles.divider} />
                <div className={styles.summaryBlock}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Выбрано</span>
                    <span className={styles.summaryValue}>
                      {formatDate(selectedDate)}, {selectedSlot.start} — {selectedSlot.end}
                    </span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Формат</span>
                    <span className={styles.summaryValue}>{FORMAT_LABELS[format]}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Стоимость</span>
                    <span className={`${styles.summaryValue} ${styles.summaryPrice}`}>
                      {FORMAT_PRICES[format].toLocaleString('ru')} ₽
                    </span>
                  </div>
                </div>

                {/* Message */}
                <div className={styles.sectionLabel} style={{ marginTop: 16 }}>
                  Сообщение инструктору (необязательно)
                </div>
                <textarea
                  className={styles.messageInput}
                  placeholder="Например, «Хочу научиться кататься с нуля»"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                />

                {/* Send button */}
                <button
                  className={styles.sendBtn}
                  onClick={handleSend}
                  disabled={booked}
                >
                  Отправить заявку →
                </button>
              </>
            )}

            <div style={{ height: 32 }} />
          </>
        )}
      </div>

      {/* Toast */}
      {showToast && (
        <div className={styles.toast}>
          ✓ Заявка отправлена! Инструктор ответит в течение 12 часов.
        </div>
      )}
    </div>
  );
}
