import { useEffect, useRef, useState } from 'react';
import styles from './GroupChatScreen.module.css';
import { Icon } from '@/components/Icon/Icon';

// ── Types ──────────────────────────────────────────────────────────────────

type Sender = 'self' | 'instr' | 'other' | 'system';

interface GMessage {
  id: string;
  from: Sender;
  name?: string;
  initials?: string;
  avatarColor?: string;
  text: string;
  time: string;
  ticks?: string;
}

// ── Phone filter (скрываем номера телефонов между участниками) ─────────────

const PHONE_RE = /(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g;
function filterPhone(text: string): string {
  PHONE_RE.lastIndex = 0;
  return text.replace(PHONE_RE, '•••');
}

/**
 * Проверяет, содержит ли строка российский номер телефона.
 * Поддерживаемые форматы: +7/8 с кодом и без, с разделителями и без.
 */
function hasPhone(text: string): boolean {
  const chunks = text.match(/[\+\d][\d\s\-\(\)\.]{6,18}\d/g) ?? [];
  return chunks.some(chunk => {
    const d = chunk.replace(/\D/g, '');
    return (
      (d.length === 10 && d[0] === '9') ||
      (d.length === 11 && (d[0] === '7' || d[0] === '8'))
    );
  });
}

// ── Mock chat messages ─────────────────────────────────────────────────────

const CHAT_MSGS: GMessage[] = [
  {
    id: 'g1', from: 'instr', name: 'Алексей', initials: 'АМ', avatarColor: 'ice',
    text: 'Всем привет! Это чат мастер-класса. Встречаемся у кассы, вход А. Если есть вопросы — пишите 🏔️',
    time: '09:00',
  },
  {
    id: 'g2', from: 'other', name: 'Кирилл', initials: 'КВ', avatarColor: 'mint',
    text: 'Отлично, жду с нетерпением! Нужно ли своё снаряжение или можно взять в аренду?',
    time: '09:14',
  },
  {
    id: 'g3', from: 'instr', name: 'Алексей', initials: 'АМ', avatarColor: 'ice',
    text: 'Кирилл, можно взять в аренду прямо на месте. Главное — жёсткие горнолыжные ботинки.',
    time: '09:20',
  },
  {
    id: 'g4', from: 'other', name: 'Мария', initials: 'МС', avatarColor: 'straw',
    text: 'Добрый день! Подскажите — нужен ли какой-то минимальный уровень катания?',
    time: '10:05',
  },
  {
    id: 'g5', from: 'instr', name: 'Алексей', initials: 'АМ', avatarColor: 'ice',
    text: 'Мария, нужно уверенно ехать параллельным ведением — начальный карвинг освоим вместе 👍',
    time: '10:12',
  },
  {
    id: 'g6', from: 'other', name: 'Кирилл', initials: 'КВ', avatarColor: 'mint',
    text: 'Алексей, во сколько лучше приехать заранее?',
    time: '11:30',
  },
  {
    id: 'g7', from: 'instr', name: 'Алексей', initials: 'АМ', avatarColor: 'ice',
    text: 'За 15–20 минут будет комфортно. Успеете взять снаряжение и размяться.',
    time: '11:45',
  },
];

// ── Props ──────────────────────────────────────────────────────────────────

interface GroupChatScreenProps {
  mcTitle?: string;
  isConfirmed?: boolean;
  date?: string;
  location?: string;
  participantCount?: number;
  onBack: () => void;
  /** Роль текущего пользователя. Инструктор видит свои сообщения справа. */
  role?: 'instructor' | 'guest';
}

// ── Component ──────────────────────────────────────────────────────────────

export function GroupChatScreen({
  mcTitle = 'Техника карвинга',
  isConfirmed = false,
  date = '17 мая',
  location = 'Касса Шерегеш, вход А',
  participantCount = 9,
  onBack,
  role = 'guest',
}: GroupChatScreenProps) {
  /**
   * Системное сообщение — зависит от роли и статуса группы.
   * Инструктор видит статус набора, гость — статус записи.
   */
  const sysMsg: GMessage = {
    id: 'sys0',
    from: 'system',
    text: role === 'instructor'
      ? isConfirmed
        ? `Мастер-класс «${mcTitle}» набран. Группа сформирована, можно начинать.`
        : `Мастер-класс «${mcTitle}». Ожидается набор группы — вы получите уведомление.`
      : isConfirmed
        ? `Вы записаны на «${mcTitle}». Группа набрана — телефон инструктора доступен.`
        : `Вы записаны на «${mcTitle}». Телефон инструктора откроется когда наберётся группа.`,
    time: '',
  };

  const [msgs, setMsgs]           = useState<GMessage[]>([sysMsg, ...CHAT_MSGS]);
  const [inputVal, setInputVal]   = useState('');
  const [phoneWarning, setPhoneWarning] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  /**
   * Исходящее сообщение:
   *   — 'self' всегда исходящее (новые сообщения от текущего пользователя)
   *   — 'instr' исходящее только когда смотрит инструктор
   */
  function isOutgoing(msg: GMessage): boolean {
    return msg.from === 'self' || (role === 'instructor' && msg.from === 'instr');
  }

  function sendMsg() {
    const text = inputVal.trim();
    if (!text) return;

    // Блокируем отправку сообщений с номерами телефонов
    if (hasPhone(text)) {
      setPhoneWarning(true);
      return;
    }
    setPhoneWarning(false);

    setMsgs(prev => [...prev, {
      id: `gm${Date.now()}`,
      from: 'self',
      text,
      time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
      ticks: '✓',
    }]);
    setInputVal('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  function handlePhoneBtn() {
    if (!isConfirmed) return;
    // In production this would call the instructor's real phone
    window.open('tel:+79991234567', '_self');
  }

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>‹</button>
        <div className={styles.groupAv}><Icon name="mountain" size={20} /></div>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>{mcTitle}</div>
          <div className={styles.headerSub}>{participantCount} участников</div>
        </div>
        {/* Кнопка звонка — только для гостей; инструктор звонит сам */}
        {role !== 'instructor' && (
          <button
            className={`${styles.phoneBtn} ${!isConfirmed ? styles.phoneBtnLocked : ''}`}
            onClick={handlePhoneBtn}
            title={isConfirmed ? 'Позвонить инструктору' : 'Телефон откроется когда наберётся группа'}
            aria-disabled={!isConfirmed}
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.07 10.8 19.79 19.79 0 0 1 .22 2.18 2 2 0 0 1 2.18 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L6.91 7.09a16 16 0 0 0 6 6l.46-.46a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 14.92z"/></svg>
          </button>
        )}
      </div>

      {/* Pinned bar */}
      <div className={styles.pinnedBar}>
        <Icon name="map-pin" size={13} />
        <span className={styles.pinnedText}>{date} · {location}</span>
      </div>

      {/* Messages */}
      <div className={styles.messages} ref={messagesRef}>
        <div className={styles.daySep}>Сегодня</div>

        {msgs.map(msg => {
          // System message — centered notice
          if (msg.from === 'system') {
            return (
              <div key={msg.id} className={styles.sysMsgWrap}>
                <span className={styles.sysMsgText}>{msg.text}</span>
              </div>
            );
          }

          // Исходящее сообщение (текущий пользователь) — справа, без аватара
          if (isOutgoing(msg)) {
            return (
              <div key={msg.id} className={`${styles.mrow} ${styles.mrowOut}`}>
                <div>
                  <div className={`${styles.bubble} ${styles.bubbleOut}`}>{msg.text}</div>
                  <span className={styles.mt}>{msg.time}{msg.ticks ? ` ${msg.ticks}` : ''}</span>
                </div>
              </div>
            );
          }

          // Входящее: instr / other — фильтруем номера телефонов только у других участников
          const safeText = msg.from === 'other' ? filterPhone(msg.text) : msg.text;

          return (
            <div key={msg.id} className={styles.mrow}>
              <div className={`${styles.av} ${styles[`av-${msg.avatarColor}`]}`}>
                {msg.initials}
              </div>
              <div>
                <div className={`${styles.senderName} ${msg.from === 'instr' ? styles.senderInstr : ''}`}>
                  {msg.name}
                </div>
                <div className={`${styles.bubble} ${styles.bubbleIn}`}>{safeText}</div>
                <span className={styles.mt}>{msg.time}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      {/* Phone warning */}
      {phoneWarning && (
        <div className={styles.phoneWarning}>
          📵 Обмен контактами запрещён в групповом чате
          <button className={styles.phoneWarningClose} onClick={() => setPhoneWarning(false)}>✕</button>
        </div>
      )}

      {/* Input */}
      <div className={styles.inputWrap}>
        <textarea
          ref={textareaRef}
          className={styles.chatInput}
          placeholder="Сообщение группе…"
          rows={1}
          value={inputVal}
          onChange={e => {
            setInputVal(e.target.value);
            autoResize(e.target);
            if (phoneWarning) setPhoneWarning(false);
          }}
          onKeyDown={handleKeyDown}
        />
        <button className={styles.sendBtn} onClick={sendMsg} aria-label="Отправить">
          <svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
    </div>
  );
}
