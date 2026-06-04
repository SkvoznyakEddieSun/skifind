/**
 * Хранилище уведомлений.
 * Пополняется динамически (например, при новой заявке от гостя).
 */

export interface AppNotif {
  id:     number;
  period: 'today' | 'yesterday' | 'earlier';
  icon:   'niMsg' | 'niBooking' | 'niMoney' | 'niWarn' | 'niReview' | 'niSystem';
  emoji:  string;
  text:   string;
  time:   string;
  unread: boolean;
}

export const DYNAMIC_NOTIFS: AppNotif[] = [];

let _id = 1000;

export function pushNotification(notif: Omit<AppNotif, 'id'>): void {
  DYNAMIC_NOTIFS.unshift({ ...notif, id: _id++ });
}
