import { useState } from 'react';
import styles from './NotificationsScreen.module.css';
import { DYNAMIC_NOTIFS } from '@/store/notifications';

type Period = 'today' | 'yesterday' | 'earlier';
type IconType = 'niMsg' | 'niBooking' | 'niMoney' | 'niWarn' | 'niReview' | 'niSystem';

interface Notif {
  id: number;
  period: Period;
  icon: IconType;
  emoji: string;
  text: string;
  time: string;
  unread: boolean;
  link?: string; // экран для перехода
}

const INITIAL: Notif[] = [
  { id: 1,  period: 'today',     icon: 'niBooking', emoji: '✨', text: 'Новая заявка от <strong>Романа Ефимова</strong> на 28 апреля',               time: '11:42',        unread: true,  link: 'requests' },
  { id: 2,  period: 'today',     icon: 'niMsg',     emoji: '💬', text: '<strong>Кирилл Волков</strong>: «До встречи в понедельник!»',                  time: '09:15',        unread: true,  link: 'chat-list' },
  { id: 3,  period: 'today',     icon: 'niMoney',   emoji: '⚡', text: 'Списано <strong>350 ₽</strong> комиссии за занятие с Кириллом',               time: '08:30',        unread: true,  link: 'balance' },
  { id: 4,  period: 'yesterday', icon: 'niBooking', emoji: '✨', text: 'Новая заявка от <strong>Анны Беловой</strong> на 30 апреля',                   time: 'вчера 19:05',  unread: false, link: 'requests' },
  { id: 5,  period: 'yesterday', icon: 'niReview',  emoji: '⭐', text: '<strong>Татьяна Новикова</strong> оставила отзыв 5★ на ваше занятие',          time: 'вчера 16:00',  unread: false, link: 'reviews' },
  { id: 6,  period: 'yesterday', icon: 'niWarn',    emoji: '⚠',  text: 'Баланс приближается к нулю — пополните для приёма новых заявок',              time: 'вчера 12:30',  unread: false, link: 'balance' },
  { id: 7,  period: 'earlier',   icon: 'niMoney',   emoji: '+',  text: 'Пополнение баланса на <strong>2 000 ₽</strong> успешно прошло',               time: '20 апр',       unread: false, link: 'balance' },
  { id: 8,  period: 'earlier',   icon: 'niBooking', emoji: '✓',  text: 'Занятие с <strong>Михаилом Орловым</strong> подтверждено',                    time: '18 апр',       unread: false, link: 'requests' },
  { id: 9,  period: 'earlier',   icon: 'niSystem',  emoji: 'ℹ',  text: 'Ваш профиль успешно одобрен модераторами',                                    time: '15 апр',       unread: false, link: 'my-profile' },
];

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Сегодня',
  yesterday: 'Вчера',
  earlier: 'Раньше',
};

interface NotificationsScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

export function NotificationsScreen({ onBack, onNavigate }: NotificationsScreenProps) {
  // Объединяем динамические (новые заявки и т.д.) + статичные начальные
  const [items, setItems] = useState<Notif[]>(() => [
    ...DYNAMIC_NOTIFS.map(n => ({ ...n, icon: n.icon as Notif['icon'] })),
    ...INITIAL,
  ]);

  const unreadCount = items.filter(n => n.unread).length;

  function markRead(id: number) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  }

  function handleTap(n: Notif) {
    markRead(n.id);
    if (n.link && onNavigate) {
      onNavigate(n.link);
    }
  }

  function markAllRead() {
    setItems(prev => prev.map(n => ({ ...n, unread: false })));
  }

  const periods: Period[] = ['today', 'yesterday', 'earlier'];

  return (
    <div className={styles.screen}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.tbRow}>
          <button className={styles.tbBack} onClick={onBack}>‹</button>
          <div style={{ flex: 1 }}>
            <div className={styles.tbTitle}>Уведомления</div>
            <div className={styles.tbSub}>
              {unreadCount > 0 ? `${unreadCount} новых` : 'Все прочитано'}
            </div>
          </div>
          {unreadCount > 0 && (
            <button className={styles.markAllBtn} onClick={markAllRead}>
              Прочитать все
            </button>
          )}
        </div>
      </div>

      <div className={styles.scroll}>
        {items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔔</div>
            <div className={styles.emptyText}>Уведомлений пока нет</div>
          </div>
        ) : (
          periods.map(period => {
            const group = items.filter(n => n.period === period);
            if (group.length === 0) return null;
            return (
              <div key={period}>
                <div className={styles.sectionDivider}>{PERIOD_LABELS[period]}</div>
                {group.map(n => (
                  <div
                    key={n.id}
                    className={`${styles.notifItem} ${n.unread ? styles.notifItemUnread : ''} ${n.link ? styles.notifItemTappable : ''}`}
                    onClick={() => handleTap(n)}
                  >
                    <div className={`${styles.notifIcon} ${styles[n.icon]}`}>
                      {n.emoji}
                    </div>
                    <div className={styles.notifBody}>
                      <div
                        className={styles.notifText}
                        dangerouslySetInnerHTML={{ __html: n.text }}
                      />
                      <div className={styles.notifTime}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
