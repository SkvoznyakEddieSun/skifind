import { useEffect, useRef, useState } from 'react';
import styles from './GroupChatScreen.module.css';

// ── Types ──────────────────────────────────────────────────────────────────

type Sender = 'self' | 'instr' | 'other';

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

// ── Mock data ──────────────────────────────────────────────────────────────

const INITIAL_MSGS: GMessage[] = [
  {
    id: 'g1', from: 'instr', name: 'Алексей', initials: 'АМ', avatarColor: 'ice',
    text: 'Всем привет! Это чат мастер-класса «Техника карвинга». Встречаемся 17 мая у кассы, вход А. Если есть вопросы — пишите 🏔️',
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
  title?: string;
  date?: string;
  location?: string;
  participantCount?: number;
  onBack: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function GroupChatScreen({
  title = 'Техника карвинга',
  date = '17 мая',
  location = 'Касса Шерегеш, вход А',
  participantCount = 9, // +1 after we just joined
  onBack,
}: GroupChatScreenProps) {
  const [msgs, setMsgs]     = useState<GMessage[]>(INITIAL_MSGS);
  const [inputVal, setInputVal] = useState('');
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  function sendMsg() {
    const text = inputVal.trim();
    if (!text) return;
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

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>‹</button>
        <div className={styles.groupAv}>🏔️</div>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>{title}</div>
          <div className={styles.headerSub}>{participantCount} участников</div>
        </div>
      </div>

      {/* Pinned bar */}
      <div className={styles.pinnedBar}>
        <span className={styles.pinnedIcon}>📌</span>
        <span className={styles.pinnedText}>{date} · {location}</span>
      </div>

      {/* Messages */}
      <div className={styles.messages} ref={messagesRef}>
        <div className={styles.daySep}>Сегодня</div>

        {msgs.map(msg => {
          if (msg.from === 'self') {
            return (
              <div key={msg.id} className={`${styles.mrow} ${styles.mrowOut}`}>
                <div>
                  <div className={`${styles.bubble} ${styles.bubbleOut}`}>{msg.text}</div>
                  <span className={styles.mt}>{msg.time} {msg.ticks}</span>
                </div>
              </div>
            );
          }
          return (
            <div key={msg.id} className={styles.mrow}>
              <div className={`${styles.av} ${styles[`av-${msg.avatarColor}`]}`}>
                {msg.initials}
              </div>
              <div>
                <div className={`${styles.senderName} ${msg.from === 'instr' ? styles.senderInstr : ''}`}>
                  {msg.name}
                </div>
                <div className={`${styles.bubble} ${styles.bubbleIn}`}>{msg.text}</div>
                <span className={styles.mt}>{msg.time}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className={styles.inputWrap}>
        <textarea
          ref={textareaRef}
          className={styles.chatInput}
          placeholder="Сообщение группе…"
          rows={1}
          value={inputVal}
          onChange={e => { setInputVal(e.target.value); autoResize(e.target); }}
          onKeyDown={handleKeyDown}
        />
        <button className={styles.sendBtn} onClick={sendMsg} aria-label="Отправить">
          <svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
    </div>
  );
}
