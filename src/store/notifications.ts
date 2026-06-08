/**
 * Хранилище уведомлений.
 * Пополняется динамически (например, при новой заявке от гостя).
 */
import type { IconName } from '@/components/Icon/Icon';

export interface AppNotif {
  id:     number;
  period: 'today' | 'yesterday' | 'earlier';
  icon:   'niMsg' | 'niBooking' | 'niMoney' | 'niWarn' | 'niReview' | 'niSystem';
  emoji:  IconName;
  text:   string;
  time:   string;
  unread: boolean;
}

export const DYNAMIC_NOTIFS: AppNotif[] = [];

let _id = 1000;

export function pushNotification(notif: Omit<AppNotif, 'id'>): void {
  DYNAMIC_NOTIFS.unshift({ ...notif, id: _id++ });
}
