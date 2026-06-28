import { describe, it, expect, beforeEach } from 'vitest';
import {
  BOOKINGS,
  getGuestBookings,
  getPendingRequests,
  getAcceptedLessons,
  getBookingById,
  acceptBooking,
  declineBooking,
  addBooking,
} from '@/store/bookings';

// Snapshot the initial BOOKINGS length so we can restore the array between tests
const INITIAL_LENGTH = BOOKINGS.length;

beforeEach(() => {
  // Restore any bookings that were added or status-mutated by tests.
  // Splice off anything added beyond the original seed.
  BOOKINGS.splice(INITIAL_LENGTH);
  // Reset statuses of the seeded bookings back to their original values.
  const origStatuses: Record<string, string> = {
    b1: 'ACCEPTED', b2: 'PENDING', b3: 'COMPLETED',
    l1: 'ACCEPTED', l2: 'ACCEPTED',
    'req-roman': 'PENDING', 'req-anna': 'PENDING', 'req-mikhail': 'PENDING',
  };
  for (const b of BOOKINGS) {
    if (origStatuses[b.id]) {
      (b as { status: string }).status = origStatuses[b.id];
    }
  }
});

describe('getGuestBookings', () => {
  it('returns only guest bookings', () => {
    const result = getGuestBookings();
    expect(result.every(b => b.isGuestBooking)).toBe(true);
  });

  it('returns the three seeded guest bookings', () => {
    const result = getGuestBookings();
    expect(result).toHaveLength(3);
    expect(result.map(b => b.id)).toEqual(expect.arrayContaining(['b1', 'b2', 'b3']));
  });
});

describe('getPendingRequests', () => {
  it('returns pending non-guest bookings for a given instructor', () => {
    const result = getPendingRequests('aleksey');
    expect(result.every(b => !b.isGuestBooking && b.status === 'PENDING')).toBe(true);
  });

  it('returns 3 pending requests for aleksey in seed data', () => {
    const result = getPendingRequests('aleksey');
    expect(result).toHaveLength(3);
  });

  it('returns nothing for an unknown instructor', () => {
    expect(getPendingRequests('nobody')).toHaveLength(0);
  });
});

describe('getAcceptedLessons', () => {
  it('returns accepted or completed non-guest lessons for instructor', () => {
    const result = getAcceptedLessons('aleksey');
    expect(result.every(b => !b.isGuestBooking && (b.status === 'ACCEPTED' || b.status === 'COMPLETED'))).toBe(true);
  });

  it('returns 2 accepted lessons for aleksey in seed data', () => {
    const result = getAcceptedLessons('aleksey');
    expect(result).toHaveLength(2);
  });
});

describe('getBookingById', () => {
  it('finds an existing booking', () => {
    expect(getBookingById('b1')).toBeDefined();
    expect(getBookingById('b1')!.id).toBe('b1');
  });

  it('returns undefined for a non-existent id', () => {
    expect(getBookingById('does-not-exist')).toBeUndefined();
  });
});

describe('acceptBooking', () => {
  it('changes a pending booking status to accepted', () => {
    acceptBooking('req-roman');
    expect(getBookingById('req-roman')!.status).toBe('ACCEPTED');
  });

  it('moves booking from pending to accepted lessons list', () => {
    const beforeAccepted = getAcceptedLessons('aleksey').length;
    const beforePending  = getPendingRequests('aleksey').length;
    acceptBooking('req-roman');
    expect(getAcceptedLessons('aleksey')).toHaveLength(beforeAccepted + 1);
    expect(getPendingRequests('aleksey')).toHaveLength(beforePending - 1);
  });

  it('does nothing for a non-existent id (no throw)', () => {
    expect(() => acceptBooking('ghost')).not.toThrow();
  });
});

describe('declineBooking', () => {
  it('changes a pending booking status to declined', () => {
    declineBooking('req-anna');
    expect(getBookingById('req-anna')!.status).toBe('DECLINED');
  });

  it('removes booking from pending requests', () => {
    const before = getPendingRequests('aleksey').length;
    declineBooking('req-anna');
    expect(getPendingRequests('aleksey')).toHaveLength(before - 1);
  });

  it('does nothing for a non-existent id (no throw)', () => {
    expect(() => declineBooking('ghost')).not.toThrow();
  });
});

describe('addBooking', () => {
  it('adds a new guest booking to BOOKINGS', () => {
    const before = BOOKINGS.length;
    addBooking({
      instructorId: 'aleksey',
      instructorName: 'Алексей Морозов',
      instructorInitials: 'АМ',
      instructorAvatarColor: 'ice',
      instructorSpec: 'Сноуборд · Шерегеш',
      instructorRating: 4.9,
      date: new Date('2026-06-15'),
      timeStart: '10:00',
      timeEnd: '12:00',
      format: 'individual',
      formatLabel: 'Индивидуальное',
      discipline: 'board',
      level: 'Новичок',
      price: 5000,
      message: 'Test booking',
    });
    expect(BOOKINGS.length).toBe(before + 1);
  });

  it('new booking has status pending and isGuestBooking true', () => {
    const booking = addBooking({
      instructorId: 'aleksey',
      instructorName: 'Алексей Морозов',
      instructorInitials: 'АМ',
      instructorAvatarColor: 'ice',
      instructorSpec: 'Сноуборд · Шерегеш',
      instructorRating: 4.9,
      date: new Date('2026-06-20'),
      timeStart: '09:00',
      timeEnd: '11:00',
      format: 'miniGroup',
      formatLabel: 'Мини-группа',
      discipline: 'ski',
      level: 'Средний',
      price: 3500,
      message: '',
    });
    expect(booking.status).toBe('PENDING');
    expect(booking.isGuestBooking).toBe(true);
  });

  it('new booking appears in getGuestBookings', () => {
    const before = getGuestBookings().length;
    addBooking({
      instructorId: 'natalya',
      instructorName: 'Наталья Петрова',
      instructorInitials: 'НП',
      instructorAvatarColor: 'mint',
      instructorSpec: 'Горные лыжи',
      instructorRating: 5.0,
      date: new Date('2026-07-01'),
      timeStart: '12:00',
      timeEnd: '13:00',
      format: 'kids',
      formatLabel: 'Детское',
      discipline: 'ski',
      level: 'Дети',
      price: 2800,
      message: '',
    });
    expect(getGuestBookings()).toHaveLength(before + 1);
  });
});
