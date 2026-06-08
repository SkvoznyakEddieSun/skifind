import { useEffect, useRef, useState } from 'react';
import styles from './CommunityScreen.module.css';
import { Icon } from '@/components/Icon/Icon';

interface Sender {
  id: string;
  name: string;
  short: string;
  avClass: string;
}

interface Message {
  id: string;
  from: string;
  text: string;
  time: string;
  ticks?: string;
  announce?: boolean;
}

interface DaySep { kind: 'sep'; label: string; id: string; }
type ChatItem = Message | DaySep;

const SENDERS: Record<string, Sender> = {
  alex:   { id: 'alex',   name: 'Алексей М.',  short: 'АМ', avClass: 'avIce' },
  nataly: { id: 'nataly', name: 'Наталья К.',  short: 'НК', avClass: 'avMint' },
  sergey: { id: 'sergey', name: 'Сергей Б.',   short: 'СБ', avClass: 'avPurple' },
  olga:   { id: 'olga',   name: 'Ольга Т.',    short: 'ОТ', avClass: 'avStraw' },
  dima:   { id: 'dima',   name: 'Дмитрий Р.',  short: 'ДР', avClass: 'avCoral' },
};

const ONLINE_MEMBERS = ['alex', 'nataly', 'sergey', 'olga'];

const INITIAL: ChatItem[] = [
  { kind: 'sep', label: '24 апреля', id: 'sep1' },
  {
    id: 'm0', from: 'system', time: '', announce: true,
    text: 'Добро пожаловать в чат сообщества SkiFind. Здесь инструкторы делятся опытом, советами и новостями курортов.',
  },
  { id: 'm1', from: 'nataly', text: 'Привет всем! Роза сегодня открылась — первый подъём заработал с 9 утра 🎿', time: '10:12' },
  { id: 'm2', from: 'alex',   text: 'Наталья, спасибо! Буду с учениками как раз завтра. Трассы готовы?', time: '10:18' },
  { id: 'm3', from: 'nataly', text: 'Олимпия и Карусель в отличном состоянии. Запад ещё закрыт.', time: '10:21' },
  { id: 'm4', from: 'sergey', text: 'Коллеги, кто работает детским инструктором? Хочу узнать про сертификацию ФГССР.', time: '11:05' },
  { id: 'm5', from: 'olga',   text: 'Сергей, я проходила в 2022-м. Напиши в личку — расскажу подробно.', time: '11:14' },
  { kind: 'sep', label: 'Вчера', id: 'sep2' },
  { id: 'm6', from: 'dima',   text: 'Ребята, кто знает хороший прокат рядом с Газпромом? Ученики спрашивают.', time: '15:30' },
  { id: 'm7', from: 'alex',   text: 'Snow Point у главной кассы — цены нормальные, снаряжение свежее.', time: '15:45' },
  { id: 'm8', from: 'dima',   text: 'Отлично, спасибо! 👍', time: '15:47' },
  { kind: 'sep', label: 'Сегодня', id: 'sep3' },
  { id: 'm9',  from: 'nataly', text: 'Доброе утро! Кто едет на горку в эти выходные?', time: '08:30' },
  { id: 'm10', from: 'out',    text: 'Я буду в субботу с группой новичков.', time: '09:05', ticks: '✓✓' },
  { id: 'm11', from: 'sergey', text: 'И я в субботу. Может встретимся на подъёмнике 😄', time: '09:12' },
  { id: 'm12', from: 'out',    text: 'Договорились! В 11 у первого подъёма.', time: '09:15', ticks: '✓✓' },
];

interface CommunityScreenProps {
  onBack: () => void;
}

export function CommunityScreen({ onBack }: CommunityScreenProps) {
  const [items, setItems] = useState<ChatItem[]>(INITIAL);
  const [inputVal, setInputVal] = useState('');
  const [pinnedVisible, setPinnedVisible] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items]);

  function sendMsg() {
    const msg = inputVal.trim();
    if (!msg) return;
    const newMsg: Message = {
      id: 'm' + Date.now(),
      from: 'out',
      text: msg,
      time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
      ticks: '✓',
    };
    setItems(prev => [...prev, newMsg]);
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

  function prevSenderFrom(arr: ChatItem[], idx: number): string | null {
    for (let i = idx - 1; i >= 0; i--) {
      const item = arr[i];
      if ('kind' in item) return null;
      return (item as Message).from;
    }
    return null;
  }

  return (
    <div className={styles.screen}>
      {/* Top bar */}
      <div className={styles.chatTop}>
        <button className={styles.tbBack} onClick={onBack}>‹</button>
        <div className={styles.groupAv}><Icon name="mountain" size={20} /></div>
        <div className={styles.ctInfo}>
          <div className={styles.ctName}>Сообщество SkiFind</div>
          <div className={styles.ctStatus}>{ONLINE_MEMBERS.length} онлайн · 248 участников</div>
        </div>
        <button className={styles.ctBtn} aria-label="Участники" onClick={() => setShowMembers(true)}>
          <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
        </button>
      </div>

      {/* Pinned */}
      {pinnedVisible && (
        <div className={styles.pinnedBanner}>
          <Icon name="map-pin" size={13} />
          <span className={styles.pinnedText}>Правила чата: уважайте друг друга, только профессиональные темы</span>
          <button className={styles.pinnedClose} onClick={() => setPinnedVisible(false)}>✕</button>
        </div>
      )}

      {/* Online bar */}
      <div className={styles.onlineBar}>
        {ONLINE_MEMBERS.map(id => {
          const s = SENDERS[id];
          return (
            <div key={id} className={styles.onlineMember}>
              <div className={styles.onlineMemberAv}>
                <div className={`${styles.av} ${styles[s.avClass as keyof typeof styles]}`}>{s.short}</div>
                <div className={styles.onlineDot} />
              </div>
              <span className={styles.onlineMemberName}>{s.name.split(' ')[0]}</span>
            </div>
          );
        })}
      </div>

      {/* Messages */}
      <div className={styles.messages} ref={messagesRef}>
        {items.map((item, idx) => {
          if ('kind' in item) {
            return <div key={item.id} className={styles.daySep}>{item.label}</div>;
          }

          const msg = item as Message;

          if (msg.from === 'system') {
            return (
              <div key={msg.id} className={styles.announceBubble}>
                <div className={styles.announceTitle}>📢 Добро пожаловать</div>
                <div className={styles.announceText}>{msg.text}</div>
              </div>
            );
          }

          const isOut = msg.from === 'out';
          const sender = isOut ? null : SENDERS[msg.from];
          const prev = prevSenderFrom(items, idx);
          const showAvatar = !isOut && prev !== msg.from;

          return (
            <div key={msg.id} className={`${styles.mrow} ${isOut ? styles.mrowOut : ''}`}>
              {!isOut && (
                showAvatar && sender
                  ? <div className={`${styles.av} ${styles[sender.avClass as keyof typeof styles]}`}>{sender.short}</div>
                  : <div className={styles.avPlaceholder} />
              )}
              <div className={styles.mContent}>
                {showAvatar && sender && !isOut && (
                  <div className={styles.senderName}>{sender.name}</div>
                )}
                <div className={`${styles.bubble} ${isOut ? styles.bubbleOut : styles.bubbleIn}`}>
                  {msg.text}
                </div>
                <span className={styles.mt}>{msg.time}{msg.ticks ? ' ' + msg.ticks : ''}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Members sheet */}
      {showMembers && (
        <div className={styles.membersOverlay} onClick={() => setShowMembers(false)}>
          <div className={styles.membersSheet} onClick={e => e.stopPropagation()}>
            <div className={styles.membersHandle} />
            <div className={styles.membersTitle}>Участники · 248</div>
            <div className={styles.membersList}>
              {[
                { short: 'АМ', color: 'avIce',    name: 'Алексей М.',   role: 'Инструктор · онлайн' },
                { short: 'НК', color: 'avMint',   name: 'Наталья К.',   role: 'Инструктор · онлайн' },
                { short: 'СБ', color: 'avPurple', name: 'Сергей Б.',    role: 'Инструктор · онлайн' },
                { short: 'ОТ', color: 'avStraw',  name: 'Ольга Т.',     role: 'Инструктор · онлайн' },
                { short: 'ДР', color: 'avCoral',  name: 'Дмитрий Р.',   role: 'Инструктор' },
                { short: 'ИМ', color: 'avIce',    name: 'Иван М.',      role: 'Инструктор' },
                { short: 'КС', color: 'avMint',   name: 'Ксения С.',    role: 'Инструктор' },
              ].map(m => (
                <div key={m.name} className={styles.memberRow}>
                  <div className={`${styles.av} ${styles[m.color as keyof typeof styles]}`}>{m.short}</div>
                  <div>
                    <div className={styles.memberName}>{m.name}</div>
                    <div className={styles.memberRole}>{m.role}</div>
                  </div>
                </div>
              ))}
              <div className={styles.membersMore}>и ещё 241 участник</div>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className={styles.inputWrap}>
        <textarea
          ref={textareaRef}
          className={styles.chatInput}
          placeholder="Написать в чат..."
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
