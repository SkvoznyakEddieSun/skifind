import { describe, it, expect, beforeEach } from 'vitest';
import { DYNAMIC_NOTIFS, pushNotification } from '@/store/notifications';
import type { AppNotif } from '@/store/notifications';

function makeNotif(overrides: Partial<Omit<AppNotif, 'id'>> = {}): Omit<AppNotif, 'id'> {
  return {
    period: 'today',
    icon: 'niBooking',
    emoji: 'sparkles',
    text: 'Test notification',
    time: '10:00',
    unread: true,
    ...overrides,
  };
}

describe('notifications store', () => {
  beforeEach(() => {
    // Reset the array before each test by splicing in-place
    DYNAMIC_NOTIFS.splice(0, DYNAMIC_NOTIFS.length);
  });

  it('starts empty after reset', () => {
    expect(DYNAMIC_NOTIFS).toHaveLength(0);
  });

  it('pushNotification adds an item to the store', () => {
    pushNotification(makeNotif());
    expect(DYNAMIC_NOTIFS).toHaveLength(1);
  });

  it('pushNotification prepends (unshift) — latest is first', () => {
    pushNotification(makeNotif({ text: 'first' }));
    pushNotification(makeNotif({ text: 'second' }));
    expect(DYNAMIC_NOTIFS[0].text).toBe('second');
    expect(DYNAMIC_NOTIFS[1].text).toBe('first');
  });

  it('pushNotification assigns a unique incremental id', () => {
    pushNotification(makeNotif());
    pushNotification(makeNotif());
    const [a, b] = DYNAMIC_NOTIFS;
    expect(typeof a.id).toBe('number');
    expect(typeof b.id).toBe('number');
    expect(a.id).not.toBe(b.id);
  });

  it('preserves all fields from the notif arg', () => {
    pushNotification(makeNotif({ text: 'Hello', period: 'yesterday', unread: false }));
    const notif = DYNAMIC_NOTIFS[0];
    expect(notif.text).toBe('Hello');
    expect(notif.period).toBe('yesterday');
    expect(notif.unread).toBe(false);
  });

  it('pushNotification sets unread:true correctly', () => {
    pushNotification(makeNotif({ unread: true }));
    expect(DYNAMIC_NOTIFS[0].unread).toBe(true);
  });

  it('can push multiple notifications and they all appear', () => {
    for (let i = 0; i < 5; i++) pushNotification(makeNotif({ text: `notif ${i}` }));
    expect(DYNAMIC_NOTIFS).toHaveLength(5);
  });
});
