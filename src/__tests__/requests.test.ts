import { describe, it, expect } from 'vitest';
import { getCommission } from '@/store/bookings';

describe('getCommission', () => {
  it('returns 5% of the price, rounded', () => {
    expect(getCommission(1000)).toBe(50);
    expect(getCommission(7000)).toBe(350);
    expect(getCommission(10500)).toBe(525);
    expect(getCommission(2800)).toBe(140);
  });

  it('rounds half-values correctly', () => {
    // 5% of 1 = 0.05 → Math.round → 0
    expect(getCommission(1)).toBe(0);
    // 5% of 9 = 0.45 → Math.round → 0
    expect(getCommission(9)).toBe(0);
    // 5% of 10 = 0.5 → Math.round → 1
    expect(getCommission(10)).toBe(1);
  });

  it('returns 0 for price 0', () => {
    expect(getCommission(0)).toBe(0);
  });

  it('scales linearly', () => {
    expect(getCommission(2000)).toBe(getCommission(1000) * 2);
  });
});
