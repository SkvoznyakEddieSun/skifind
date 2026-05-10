import { useState, useMemo } from 'react';
import styles from './BookSlotScreen.module.css';

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

// Generate 7 days
const DAYS14 = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(today);
  d.setDate(today.getDate() + i);
  return d;
});

// Mock slots per day — realistic ski school schedule
function mockSlotsForDate(date: Date): TimeSlot[] {
  const dow = date.getDay();
  // Вс — выходной
  if (dow === 0) return [];
  // Сб — половина дня
  if (dow === 6) return [
    { id: `${date.toISOString().slice(0,10)}-0`, start: '10:00', end: '11:30', duration: 90 },
    { id: `${date.toISOString().slice(0,10)}-1`, start: '12:00', end: '13:30', duration: 90 },
  ];
  // Будни — полный день
  return [
    { id: `${date.toISOString().slice(0,10)}-0`, start: '09:30', end: '11:00', duration: 90 },
    { id: `${date.toISOString().slice(0,10)}-1`, start: '11:15', end: '12:45', duration: 90 },
    { id: `${date.toISOString().slice(0,10)}-2`, start: '14:00', end: '15:30', duration: 90 },
    { id: `${date.toISOString().slice(0,10)}-3`, start: '15:45', end: '17:15', duration: 90 },
  ];
}

const FORMAT_LABELS: Record<Format, string> = {
  individual: 'Индивидуальное',
  miniGroup:  'Мини-группа',
  kids:       'Дети 45 мин',
};

const FORMAT_PRICES: Record<Format, number> = {
  individual: 3500,
  miniGroup:  5000,
  kids:       2800,
};

// Formats filter slots by duration
function filterSlotsByFormat(slots: TimeSlot[], format: Format): TimeSlot[] {
  if (format === 'kids') {
    // Kids: shorter sessions — show all (they'll be booked as 45-min blocks)
    return slots;
  }
  if (format === 'miniGroup') {
    // Mini-group: 90+ min slots
    return slots.filter(s => s.duration >= 90);
  }
  // Individual: all slots
  return slots;
}

function formatDate(date: Date): string {
  return `${DAY_SHORT[date.getDay()]} ${date.getDate()} ${MONTH_RU[date.getMonth()]}`;
}

// ── Props ──────────────────────────────────────────────────────────────────

interface BookSlotScreenProps {
  onBack: () => void;
  onBooked: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function BookSlotScreen({ onBack, onBooked }: BookSlotScreenProps) {
  const [format, setFormat] = useState<Format>('individual');
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [message, setMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [booked, setBooked] = useState(false);

  const selectedDate = DAYS14[selectedDayIdx];

  // All slots for each day (filtered by format)
  const slotsByDay = useMemo(() =>
    DAYS14.map(d => filterSlotsByFormat(mockSlotsForDate(d), format)),
    [format]
  );

  // Slots for selected day
  const slotsForDay = slotsByDay[selectedDayIdx];

  // Total slots available across 7 days
  const totalSlots = slotsByDay.reduce((acc, s) => acc + s.length, 0);

  // When format changes, clear selected slot if no longer valid
  const handleFormatChange = (f: Format) => {
    setFormat(f);
    setSelectedSlot(null);
  };

  // When day changes, clear slot selection
  const handleDayChange = (idx: number) => {
    if (slotsByDay[idx].length === 0) return; // can't select empty days
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
          <div className={styles.instrAv}>НП</div>
          <div className={styles.instrInfo}>
            <div className={styles.instrName}>Наталья Петрова</div>
            <div className={styles.instrSub}>Горные лыжи · от 2 800 ₽</div>
          </div>
          <div className={styles.instrRating}>★ 5.0</div>
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
              Свободные дни — {DAYS14[0].getDate()} {MONTH_RU[DAYS14[0].getMonth()]} — {DAYS14[6].getDate()} {MONTH_RU[DAYS14[6].getMonth()]}
            </div>

            {/* Day strip */}
            <div className={styles.dayStrip}>
              {DAYS14.map((d, i) => {
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
