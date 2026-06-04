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
  link?: string;
}

// ── Уведомления инструктора ──────────────────────────────────────────────────
const INSTR_NOTIFS: Notif[] = [
  { id: 1,  period: 'today',     icon: 'niBooking', emoji: '✨', text: 'Новая заявка от <strong>Романа Ефимова</strong> на 28 апреля',         time: '11:42',       unread: true,  link: 'requests'  },
  { id: 2,  period: 'today',     icon: 'niMsg',     emoji: '💬', text: '<strong>Кирилл Волков</strong>: «До встречи в понедельник!»',          time: '09:15',       unread: true,  link: 'chat-list' },
  { id: 3,  period: 'today',     icon: 'niMoney',   emoji: '⚡', text: 'Списано <strong>350 ₽</strong> комиссии за занятие с Кириллом',       time: '08:30',       unread: true,  link: 'balance'   },
  { id: 4,  period: 'yesterday', icon: 'niBooking', emoji: '✨', text: 'Новая заявка от <strong>Анны Беловой</strong> на 30 апреля',           time: 'вчера 19:05', unread: false, link: 'requests'  },
  { id: 5,  period: 'yesterday', icon: 'niReview',  emoji: '⭐', text: '<strong>Татьяна Новикова</strong> оставила отзыв 5★ на ваше занятие', time: 'вчера 16:00', unread: false, link: 'reviews'   },
  { id: 6,  period: 'yesterday', icon: 'niWarn',    emoji: '⚠',  text: 'Баланс приближается к нулю — пополните для приёма новых заявок',     time: 'вчера 12:30', unread: false, link: 'balance'   },
  { id: 7,  period: 'earlier',   icon: 'niMoney',   emoji: '+',  text: 'Пополнение баланса на <strong>2 000 ₽</strong> успешно прошло',       time: '20 апр',      unread: false, link: 'balance'   },
  { id: 8,  period: 'earlier',   icon: 'niBooking', emoji: '✓',  text: 'Занятие с <strong>Михаилом Орловым</strong> подтверждено на 5 апр',   time: '18 апр',      unread: false, link: 'requests'  },
  { id: 9,  period: 'earlier',   icon: 'niSystem',  emoji: 'ℹ',  text: 'Ваш профиль успешно одобрен модераторами',                           time: '15 апр',      unread: false, link: 'my-profile'},
];

// ── Уведомления ученика ──────────────────────────────────────────────────────
const GUEST_NOTIFS: Notif[] = [
  { id: 1,  period: 'today',     icon: 'niBooking', emoji: '✅', text: '<strong>Алексей Морозов</strong> подтвердил вашу запись на 28 апреля', time: '11:42',       unread: true,  link: 'bookings'   },
  { id: 2,  period: 'today',     icon: 'niMsg',     emoji: '💬', text: '<strong>Наталья Петрова</strong>: «Встречаемся у подъёмника №3»',     time: '09:15',       unread: true,  link: 'chat-list'  },
  { id: 3,  period: 'today',     icon: 'niSystem',  emoji: '⏰', text: 'Напоминание: занятие с <strong>Алексеем</strong> через 2 часа',       time: '08:00',       unread: true,  link: 'bookings'   },
  { id: 4,  period: 'yesterday', icon: 'niBooking', emoji: '✨', text: 'Запись на мастер-класс <strong>«Фрирайд для продвинутых»</strong> подтверждена', time: 'вчера 18:30', unread: false, link: 'mc-catalog' },
  { id: 5,  period: 'yesterday', icon: 'niMoney',   emoji: '💳', text: 'Оплата <strong>3 500 ₽</strong> за занятие с Алексеем прошла успешно', time: 'вчера 11:00', unread: false, link: 'bookings'   },
  { id: 6,  period: 'earlier',   icon: 'niReview',  emoji: '⭐', text: 'Оставьте отзыв о занятии с <strong>Натальей Петровой</strong>',       time: '20 апр',      unread: false, link: 'bookings'   },
  { id: 7,  period: 'earlier',   icon: 'niWarn',    emoji: '⚠',  text: '<strong>Дмитрий Захаров</strong> отменил занятие на 15 апреля',       time: '14 апр',      unread: false, link: 'bookings'   },
  { id: 8,  period: 'earlier',   icon: 'niSystem',  emoji: '🎿', text: 'Новый мастер-класс «Карвинг от нуля» — запись открыта',              time: '10 апр',      unread: false, link: 'mc-catalog' },
];

const PERIOD_LABELS: Record<Period, string> = {
  today:     'Сегодня',
  yesterday: 'Вчера',
  earlier:   'Раньше',
};

// Персистентное хранилище прочитанных — живёт вне компонента,
// переживает ремонт при push/pop. Ключ: `${role}-${id}`
const readIds = new Set<string>();

interface NotificationsScreenProps {
  onBack:       () => void;
  onNavigate?:  (screen: string) => void;
  role?:        'instructor' | 'guest';
}

export function NotificationsScreen({ onBack, onNavigate, role = 'instructor' }: NotificationsScreenProps) {
  const base = role === 'instructor' ? INSTR_NOTIFS : GUEST_NOTIFS;

  const [items, setItems] = useState<Notif[]>(() => [
    ...DYNAMIC_NOTIFS.map(n => ({ ...n, icon: n.icon as Notif['icon'] })),
    ...base,
  ].map(n => ({ ...n, unread: n.unread && !readIds.has(`${role}-${n.id}`) })));

  const unreadCount = items.filter(n => n.unread).length;

  function markRead(id: number) {
    readIds.add(`${role}-${id}`);
    setItems(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  }

  function handleTap(n: Notif) {
    markRead(n.id);
    if (n.link && onNavigate) onNavigate(n.link);
  }

  function markAllRead() {
    items.forEach(n => readIds.add(`${role}-${n.id}`));
    setItems(prev => prev.map(n => ({ ...n, unread: false })));
  }

  const periods: Period[] = ['today', 'yesterday', 'earlier'];

  return (
    <div className={styles.screen}>
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
