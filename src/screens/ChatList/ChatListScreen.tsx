import { useState } from 'react';
import styles from './ChatListScreen.module.css';

interface ChatItem {
  id: string;
  initials: string;
  avClass: string;
  name: string;
  role: 'ученик' | 'ученица' | 'коллега';
  online?: boolean;
  time: string;
  muted?: boolean;
  msg: string;
  myMsg?: boolean;
  unread?: number;
}

const RECENT: ChatItem[] = [
  { id: 'roman',     initials: 'РЕ', avClass: 'avCoral',  name: 'Роман Ефимов',     role: 'ученик',  online: true,  time: '14:35', msg: 'Подтверждаете завтра в 10:00?',                     unread: 2 },
  { id: 'dmitry',   initials: 'ДЗ', avClass: 'avPurple', name: 'Дмитрий Захаров',  role: 'коллега', online: true,  time: '13:20', msg: 'Кинул методичку по работе с СДВГ, посмотри',        unread: 1 },
  { id: 'anna',     initials: 'АБ', avClass: 'avPurple', name: 'Анна Белова',       role: 'ученица',               time: '12:08', msg: 'Спасибо, всё отлично! Жду четверга 🏂',             unread: 1 },
  { id: 'mikhail',  initials: 'МО', avClass: 'avStraw',  name: 'Михаил Орлов',     role: 'ученик',  online: true,  time: 'вчера', msg: 'Конечно, работаю с детьми. До встречи!',           myMsg: true },
  { id: 'marina',   initials: 'МВ', avClass: 'avStraw',  name: 'Марина Волкова',   role: 'коллега',               time: 'вчера', msg: 'Спасибо большое за совет, Марина!',                myMsg: true },
  { id: 'kirill',   initials: 'КВ', avClass: 'avIce',    name: 'Кирилл Волков',    role: 'ученик',                time: 'вчера', msg: 'Тогда увидимся в понедельник 🏂',                  myMsg: true, muted: true },
];

const OLDER: ChatItem[] = [
  { id: 'tatyana',  initials: 'ТН', avClass: 'avMint',   name: 'Татьяна Новикова', role: 'ученица',               time: '22 апр', msg: 'Дочка в восторге, спасибо большое!' },
  { id: 'igor',     initials: 'ИС', avClass: 'avCoral',  name: 'Игорь Соколов',    role: 'коллега',               time: '21 апр', msg: 'Привет! Можешь поделиться шаблоном программы для новичков?' },
  { id: 'elena',    initials: 'ЕС', avClass: 'avIce',    name: 'Елена Соболева',   role: 'ученица',               time: '19 апр', msg: 'Очень понравилось занятие, запишусь ещё!' },
  { id: 'andrey',   initials: 'АП', avClass: 'avPurple', name: 'Андрей Павлов',    role: 'ученик',                time: '15 апр', msg: 'Хорошо, тогда жду в субботу',                     myMsg: true },
  { id: 'olga',     initials: 'ОК', avClass: 'avMint',   name: 'Ольга Кузнецова',  role: 'коллега',               time: '12 апр', msg: 'Можешь подменить меня в субботу? У меня клиент сорвался' },
  { id: 'viktor',   initials: 'ВС', avClass: 'avStraw',  name: 'Виктор Соколов',   role: 'ученик',                time: '10 апр', msg: 'Отличное занятие, спасибо!' },
];

interface ChatListScreenProps {
  onBack?: () => void;
  onChat?: (id: string) => void;
  onCommunity?: () => void;
}

function ChatRow({ item, onClick }: { item: ChatItem; onClick?: () => void }) {
  const isCollega = item.role === 'коллега';
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
            <span className={`${styles.ciRole} ${isCollega ? styles.ciRoleColl : ''}`}>
              {item.role}
            </span>
          </div>
          <div className={styles.ciTime}>
            {item.muted && <span style={{ opacity: .5 }}>🔕</span>}
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

export function ChatListScreen({ onBack: _onBack, onChat, onCommunity }: ChatListScreenProps) {
  const [query, setQuery] = useState('');

  function matches(item: ChatItem) {
    if (!query) return true;
    const q = query.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.msg.toLowerCase().includes(q);
  }

  const filteredRecent = RECENT.filter(matches);
  const filteredOlder  = OLDER.filter(matches);
  const noResults = filteredRecent.length === 0 && filteredOlder.length === 0;

  return (
    <div className={styles.screen}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.tbTitle}>Сообщения</div>
        <div className={styles.tbSub}>2 непрочитанных</div>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Поиск по имени или сообщению..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className={styles.scroll}>
        {/* Community banner */}
        <div className={styles.communityBanner} onClick={onCommunity} style={{ cursor: 'pointer' }}>
          <div className={styles.cbIcon}>⛰</div>
          <div className={styles.cbText}>
            <div className={styles.cbTitle}>Сообщество инструкторов</div>
            <div className={styles.cbSub}>Чат всех инструкторов SkiFind. Делитесь опытом, обсуждайте снег, помогайте друг другу</div>
            <div className={styles.cbOnlinePill}>47 онлайн</div>
          </div>
          <div className={styles.cbArrow}>›</div>
        </div>

        {noResults ? (
          <div className={styles.empty}>Ничего не найдено</div>
        ) : (
          <>
            {filteredRecent.length > 0 && (
              <>
                <div className={styles.sectionDivider}>Недавние</div>
                {filteredRecent.map(item => <ChatRow key={item.id} item={item} onClick={() => onChat?.(item.id)} />)}
              </>
            )}
            {filteredOlder.length > 0 && (
              <>
                <div className={styles.sectionDivider}>Раньше</div>
                {filteredOlder.map(item => <ChatRow key={item.id} item={item} onClick={() => onChat?.(item.id)} />)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
