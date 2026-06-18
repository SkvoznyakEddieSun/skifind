import { useState } from 'react';
import styles from './ChatListScreen.module.css';
import type { BookingStatus } from '../Chat/ChatScreen';
import { MASTER_CLASSES } from '../MasterClass/masterClassData';
import { Icon } from '@/components/Icon/Icon';

interface ChatItem {
  id: string;
  initials: string;
  avClass: string;
  name: string;
  role: 'ученик' | 'ученица' | 'коллега' | 'инструктор';
  online?: boolean;
  time: string;
  msg: string;
  myMsg?: boolean;
  unread?: number;
  bookingStatus: BookingStatus;
  instructorPhone?: string;
}

// ── Данные для ИНСТРУКТОРА (ученики + коллеги-инструкторы) ────────────────

let INSTR_RECENT: ChatItem[] = [
  {
    id: 'roman',
    initials: 'РЕ', avClass: 'avCoral', name: 'Роман Ефимов', role: 'ученик',
    online: true, time: '14:35', unread: 2,
    msg: 'Подтверждаете завтра в 10:00?',
    bookingStatus: 'PENDING',
  },
  {
    id: 'dmitry',
    initials: 'ДЗ', avClass: 'avPurple', name: 'Дмитрий Захаров', role: 'коллега',
    online: true, time: '13:20', unread: 1,
    msg: 'Кинул методичку по работе с СДВГ, посмотри',
    bookingStatus: 'NONE',
  },
  {
    id: 'anna',
    initials: 'АБ', avClass: 'avPurple', name: 'Анна Белова', role: 'ученица',
    time: '12:08', unread: 1,
    msg: 'Спасибо, всё отлично! Жду четверга 🏂',
    bookingStatus: 'ACCEPTED',
    instructorPhone: '+7 905 123 45 67',
  },
  {
    id: 'mikhail',
    initials: 'МО', avClass: 'avStraw', name: 'Михаил Орлов', role: 'ученик',
    online: true, time: 'вчера',
    msg: 'Конечно, работаю с детьми. До встречи!',
    myMsg: true,
    bookingStatus: 'DECLINED',
  },
  {
    id: 'marina',
    initials: 'МВ', avClass: 'avStraw', name: 'Марина Волкова', role: 'коллега',
    time: 'вчера',
    msg: 'Спасибо большое за совет, Марина!',
    myMsg: true,
    bookingStatus: 'NONE',
  },
  {
    id: 'kirill',
    initials: 'КВ', avClass: 'avIce', name: 'Кирилл Волков', role: 'ученик',
    time: 'вчера',
    msg: 'Тогда увидимся в понедельник',
    myMsg: true,
    bookingStatus: 'ACCEPTED',
    instructorPhone: '+7 916 234 56 78',
  },
];

/** Добавить новый чат с учеником в начало списка при принятии заявки */
export function addInstrRecentChat(item: ChatItem): void {
  // Не дублировать, если уже есть
  if (INSTR_RECENT.some(c => c.id === item.id)) {
    // Обновить статус если есть
    INSTR_RECENT = INSTR_RECENT.map(c => c.id === item.id ? { ...c, bookingStatus: item.bookingStatus } : c);
    return;
  }
  INSTR_RECENT = [item, ...INSTR_RECENT];
}

/**
 * Единый сессионный источник статуса брони для чат-листа инструктора.
 * Вызывается при accept/decline из ChatScreen, чтобы при повторном открытии
 * чата статус читался отсюда (а не из захардкоженной константы) и не сбрасывался.
 * Ищет в обоих списках (RECENT и OLDER), правит объект на месте.
 */
export function setInstrChatStatus(id: string, status: BookingStatus): void {
  const item = INSTR_RECENT.find(c => c.id === id) ?? INSTR_OLDER.find(c => c.id === id);
  if (item) item.bookingStatus = status;
}

const INSTR_OLDER: ChatItem[] = [
  {
    id: 'tatyana',
    initials: 'ТН', avClass: 'avMint', name: 'Татьяна Новикова', role: 'ученица',
    time: '22 апр',
    msg: 'Дочка в восторге, спасибо большое!',
    bookingStatus: 'ACCEPTED',
  },
  {
    id: 'igor',
    initials: 'ИС', avClass: 'avCoral', name: 'Игорь Соколов', role: 'коллега',
    time: '21 апр',
    msg: 'Привет! Можешь поделиться шаблоном программы для новичков?',
    bookingStatus: 'NONE',
  },
  {
    id: 'elena',
    initials: 'ЕС', avClass: 'avIce', name: 'Елена Соболева', role: 'ученица',
    time: '19 апр',
    msg: 'Очень понравилось занятие, запишусь ещё!',
    bookingStatus: 'ACCEPTED',
  },
  {
    id: 'andrey',
    initials: 'АП', avClass: 'avPurple', name: 'Андрей Павлов', role: 'ученик',
    time: '15 апр',
    msg: 'Хорошо, тогда жду в субботу',
    myMsg: true,
    bookingStatus: 'ACCEPTED',
  },
  {
    id: 'olga',
    initials: 'ОК', avClass: 'avMint', name: 'Ольга Кузнецова', role: 'коллега',
    time: '12 апр',
    msg: 'Можешь подменить меня в субботу? У меня клиент сорвался',
    bookingStatus: 'NONE',
  },
  {
    id: 'viktor',
    initials: 'ВС', avClass: 'avStraw', name: 'Виктор Соколов', role: 'ученик',
    time: '10 апр',
    msg: 'Отличное занятие, спасибо!',
    bookingStatus: 'ACCEPTED',
  },
];

// ── Данные для УЧЕНИКА/ГОСТЯ (только инструкторы) ─────────────────────────

const GUEST_RECENT: ChatItem[] = [
  {
    id: 'aleksey',
    initials: 'АМ', avClass: 'avIce', name: 'Алексей Морозов', role: 'инструктор',
    online: true, time: '11:42', unread: 1,
    msg: 'Встречаемся у первого подъёмника в 10:00 👍',
    bookingStatus: 'ACCEPTED',
    instructorPhone: '+7 912 345 67 89',
  },
  {
    id: 'natalya',
    initials: 'НП', avClass: 'avMint', name: 'Наталья Петрова', role: 'инструктор',
    time: 'вчера',
    msg: 'Занятие в четверг подтверждено 🎿',
    bookingStatus: 'ACCEPTED',
    instructorPhone: '+7 903 987 65 43',
  },
];

const GUEST_OLDER: ChatItem[] = [
  {
    id: 'dmitry',
    initials: 'ДЗ', avClass: 'avPurple', name: 'Дмитрий Захаров', role: 'инструктор',
    time: '20 апр',
    msg: 'Да, работаю с детьми от 6 лет, пишите',
    bookingStatus: 'NONE',
  },
  {
    id: 'marina',
    initials: 'МВ', avClass: 'avStraw', name: 'Марина Волкова', role: 'инструктор',
    time: '14 апр',
    msg: 'К сожалению, эта дата уже занята',
    myMsg: false,
    bookingStatus: 'NONE',
  },
  {
    id: 'sergey',
    initials: 'СЛ', avClass: 'avBlue', name: 'Сергей Лебедев', role: 'инструктор',
    time: '8 апр',
    msg: 'Хорошо, жду вас в субботу!',
    myMsg: false,
    bookingStatus: 'ACCEPTED',
    instructorPhone: '+7 926 111 22 33',
  },
];

// ── Props ──────────────────────────────────────────────────────────────────

interface ChatListScreenProps {
  onBack?: () => void;
  onChat?: (id: string, status: BookingStatus, phone?: string, name?: string, initials?: string, avColor?: string, role?: string) => void;
  onCommunity?: () => void;
  joinedMcIds?: Set<string>;
  onGroupChat?: (mcId: string) => void;
  isInstructor?: boolean;
}

// ── ChatRow ────────────────────────────────────────────────────────────────

function ChatRow({ item, onClick }: { item: ChatItem; onClick?: () => void }) {
  const roleClass =
    item.role === 'коллега'    ? styles.ciRoleColl :
    item.role === 'инструктор' ? styles.ciRoleInstr :
    '';

  return (
    <div className={styles.chatItem} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className={styles.ciAv}>
        <div className={`${styles.av} ${styles[item.avClass as keyof typeof styles]}`}>
          {item.initials}
        </div>
        {item.online && <div className={styles.ciOnline} />}
      </div>
      <div className={styles.ciInfo}>
        <div className={styles.ciTop}>
          <div className={styles.ciName}>
            {item.name}
            <span className={`${styles.ciRole} ${roleClass}`}>
              {item.role}
            </span>
          </div>
          <div className={styles.ciTime}>
            {item.time}
          </div>
        </div>
        <div className={styles.ciBot}>
          <div className={`${styles.ciMsg} ${item.unread ? styles.ciMsgUnread : ''}`}>
            {item.myMsg && <span className={styles.ciMsgPrefix}>Вы: </span>}
            {item.msg}
          </div>
          {item.unread ? <div className={styles.ciBadge}>{item.unread}</div> : null}
        </div>
      </div>
    </div>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export function ChatListScreen({ onBack, onChat, onCommunity, joinedMcIds, onGroupChat, isInstructor }: ChatListScreenProps) {
  const [query, setQuery] = useState('');

  const RECENT = isInstructor ? INSTR_RECENT : GUEST_RECENT;
  const OLDER  = isInstructor ? INSTR_OLDER  : GUEST_OLDER;

  const joinedMcs = MASTER_CLASSES.filter(mc => joinedMcIds?.has(mc.id));

  function matches(item: ChatItem) {
    if (!query) return true;
    const q = query.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.msg.toLowerCase().includes(q);
  }

  const filteredRecent = RECENT.filter(matches);
  const filteredOlder  = OLDER.filter(matches);
  const noResults = filteredRecent.length === 0 && filteredOlder.length === 0;

  const totalUnread = [...RECENT, ...OLDER].reduce((s, i) => s + (i.unread ?? 0), 0);

  return (
    <div className={styles.screen}>
      {/* Topbar */}
      <div className={styles.topbar}>
        {onBack && <button className={styles.tbBack} onClick={onBack}>‹</button>}
        <div className={styles.tbTitleGroup}>
          <div className={styles.tbTitle}>Сообщения</div>
          {totalUnread > 0 && (
            <div className={styles.tbSub}>
              {totalUnread} {totalUnread === 1 ? 'непрочитанное' : 'непрочитанных'}
            </div>
          )}
        </div>
      </div>
      <div className={styles.searchBar}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Поиск по имени или сообщению..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className={styles.scroll}>
        {/* Community banner — только для инструкторов */}
        {onCommunity && (
          <div className={styles.communityBanner} onClick={onCommunity} style={{ cursor: 'pointer' }}>
            <div className={styles.cbIcon}><Icon name="mountain" size={22} /></div>
            <div className={styles.cbText}>
              <div className={styles.cbTitle}>Сообщество инструкторов</div>
              <div className={styles.cbSub}>Чат всех инструкторов SkiFind. Делитесь опытом, обсуждайте снег, помогайте друг другу</div>
              <div className={styles.cbOnlinePill}>47 онлайн</div>
            </div>
            <div className={styles.cbArrow}>›</div>
          </div>
        )}

        {/* Групповые чаты МК */}
        {joinedMcs.length > 0 && (
          <>
            <div className={styles.sectionDivider}>Групповые чаты</div>
            {joinedMcs.map(mc => (
              <div
                key={mc.id}
                className={`${styles.chatItem} ${styles.chatItemGroup}`}
                onClick={() => onGroupChat?.(mc.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.ciAv}>
                  <div className={`${styles.av} ${styles.avGroup}`}><Icon name="ski" size={18} /></div>
                </div>
                <div className={styles.ciInfo}>
                  <div className={styles.ciTop}>
                    <div className={styles.ciName}>
                      {mc.title}
                      <span className={styles.ciRoleGroup}>группа</span>
                    </div>
                    <div className={styles.ciTime}>{mc.date}</div>
                  </div>
                  <div className={styles.ciBot}>
                    <div className={styles.ciMsg}>
                      {mc.instructorName} · {mc.time} · {mc.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {noResults ? (
          <div className={styles.empty}>Ничего не найдено</div>
        ) : (
          <>
            {filteredRecent.length > 0 && (
              <>
                <div className={styles.sectionDivider}>Недавние</div>
                {filteredRecent.map(item => (
                  <ChatRow
                    key={item.id}
                    item={item}
                    onClick={() => onChat?.(item.id, item.bookingStatus, item.instructorPhone, item.name, item.initials, item.avClass.replace('av', '').toLowerCase(), item.role)}
                  />
                ))}
              </>
            )}
            {filteredOlder.length > 0 && (
              <>
                <div className={styles.sectionDivider}>Раньше</div>
                {filteredOlder.map(item => (
                  <ChatRow
                    key={item.id}
                    item={item}
                    onClick={() => onChat?.(item.id, item.bookingStatus, item.instructorPhone, item.name, item.initials, item.avClass.replace('av', '').toLowerCase(), item.role)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
