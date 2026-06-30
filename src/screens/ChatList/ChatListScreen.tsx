import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import styles from './ChatListScreen.module.css';
import { MASTER_CLASSES } from '../MasterClass/masterClassData';
import { Icon } from '@/components/Icon/Icon';
import { getChats, type ChatListItemDTO } from '@/lib/api';
import { shortStudentName } from '@/lib/displayName';
import { statusLabel } from '@/lib/bookingStatus';

// ── Helpers ──────────────────────────────────────────────────────────────────

const AV_CLASSES = ['avIce', 'avMint', 'avStraw', 'avPurple', 'avCoral', 'avBlue'] as const;
function avClassFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AV_CLASSES[h % AV_CLASSES.length];
}
function initialsOf(name: string): string {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?';
}
/** Время превью: сегодня → HH:MM, иначе → DD.MM. Пусто, если сообщений нет. */
function previewTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
    : `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── Props ──────────────────────────────────────────────────────────────────

interface ChatListScreenProps {
  onBack?: () => void;
  /** Открыть серверный direct-чат (по реальной брони/chatId). */
  onOpenServerChat?: (item: ChatListItemDTO) => void;
  onCommunity?: () => void;
  joinedMcIds?: Set<string>;
  onGroupChat?: (mcId: string) => void;
  isInstructor?: boolean;
}

// ── Screen ─────────────────────────────────────────────────────────────────

export function ChatListScreen({ onBack, onOpenServerChat, onCommunity, joinedMcIds, onGroupChat, isInstructor }: ChatListScreenProps) {
  const [query, setQuery] = useState('');

  // Список direct-чатов с сервера. Поллинг 8 c — реже, чем лента сообщений (4 c):
  // превью в списке не требует такой же свежести, как открытый диалог.
  const { data: chats = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['chats'],
    queryFn: getChats,
    refetchInterval: 8000,
  });

  // Имя собеседника: ученику показываем инструктора как есть; инструктору —
  // короткое ФИО ученика. Превью = реальное последнее сообщение.
  const rows = chats.map(c => {
    const name = isInstructor
      ? shortStudentName(c.booking.counterpartyName, c.booking.counterpartyPhone)
      : (c.booking.counterpartyName || 'Инструктор');
    return {
      item: c,
      name,
      initials: initialsOf(name),
      avClass: avClassFor(c.chatId),
      preview: c.lastMessageText ?? 'Нет сообщений',
      time: previewTime(c.lastMessageAt),
      status: c.booking.status,
    };
  });

  const joinedMcs = MASTER_CLASSES.filter(mc => joinedMcIds?.has(mc.id));

  const q = query.toLowerCase();
  const filteredRows = rows.filter(r => !q || r.name.toLowerCase().includes(q) || r.preview.toLowerCase().includes(q));

  return (
    <div className={styles.screen}>
      {/* Topbar */}
      <div className={styles.topbar}>
        {onBack && <button className={styles.tbBack} onClick={onBack}>‹</button>}
        <div className={styles.tbTitleGroup}>
          <div className={styles.tbTitle}>Сообщения</div>
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
        {/* Community banner — только для инструкторов (мок, ждёт Ч4) */}
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

        {/* Групповые чаты МК (мок, ждёт Ч3) */}
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

        {/* Личные (direct) чаты — с сервера */}
        {isLoading ? (
          <div className={styles.empty}>Загрузка…</div>
        ) : isError ? (
          <div className={styles.empty}>
            Не удалось загрузить чаты
            <div style={{ marginTop: 10 }}>
              <button className={styles.tbBack} style={{ width: 'auto', padding: '6px 16px' }} onClick={() => refetch()}>Повторить</button>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className={styles.empty}>{chats.length === 0 ? 'Пока нет чатов' : 'Ничего не найдено'}</div>
        ) : (
          <>
            {joinedMcs.length > 0 && <div className={styles.sectionDivider}>Личные чаты</div>}
            {filteredRows.map(r => (
              <div
                key={r.item.chatId}
                className={styles.chatItem}
                onClick={() => onOpenServerChat?.(r.item)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.ciAv}>
                  <div className={`${styles.av} ${styles[r.avClass as keyof typeof styles]}`}>{r.initials}</div>
                </div>
                <div className={styles.ciInfo}>
                  <div className={styles.ciTop}>
                    <div className={styles.ciName}>
                      {r.name}
                      <span className={`${styles.ciRole} ${isInstructor ? '' : styles.ciRoleInstr}`}>
                        {isInstructor ? 'ученик' : 'инструктор'}
                      </span>
                    </div>
                    <div className={styles.ciTime}>{r.time}</div>
                  </div>
                  <div className={styles.ciBot}>
                    <div className={styles.ciMsg}>{r.preview}</div>
                    <span className={styles.ciRole}>{statusLabel(r.status)}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
