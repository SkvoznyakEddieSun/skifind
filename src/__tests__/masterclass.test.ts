import { describe, it, expect } from 'vitest';
import { minPartsLabel } from '@/utils/masterClassHelpers';
import { MASTER_CLASSES } from '@/screens/MasterClass/masterClassData';
import type { MasterClass } from '@/screens/MasterClass/masterClassData';

describe('minPartsLabel', () => {
  it('returns "1 участник" for 1', () => {
    expect(minPartsLabel(1)).toBe('1 участник');
  });

  it('returns "2 участника" for 2', () => {
    expect(minPartsLabel(2)).toBe('2 участника');
  });

  it('returns "3 участника" for 3', () => {
    expect(minPartsLabel(3)).toBe('3 участника');
  });

  it('returns "4 участника" for 4', () => {
    expect(minPartsLabel(4)).toBe('4 участника');
  });

  it('returns "5 участников" for 5', () => {
    expect(minPartsLabel(5)).toBe('5 участников');
  });

  it('returns "10 участников" for 10', () => {
    expect(minPartsLabel(10)).toBe('10 участников');
  });
});

describe('MASTER_CLASSES data', () => {
  const REQUIRED_FIELDS: (keyof MasterClass)[] = [
    'id', 'title', 'sport', 'level', 'levelLabel', 'levelColor',
    'instructorId', 'instructorName', 'instructorRating',
    'price', 'maxParticipants', 'minParticipants', 'currentParticipants',
    'description', 'eventDateISO',
  ];

  it('has at least one master class', () => {
    expect(MASTER_CLASSES.length).toBeGreaterThan(0);
  });

  it.each(MASTER_CLASSES)('$title has all required fields', (mc) => {
    for (const field of REQUIRED_FIELDS) {
      expect(mc[field], `field "${field}" should be defined`).toBeDefined();
    }
  });

  it.each(MASTER_CLASSES)('$title has a valid sport', (mc) => {
    expect(['ski', 'board']).toContain(mc.sport);
  });

  it.each(MASTER_CLASSES)('$title has a positive price', (mc) => {
    expect(mc.price).toBeGreaterThan(0);
  });

  it.each(MASTER_CLASSES)('$title has maxParticipants >= minParticipants', (mc) => {
    expect(mc.maxParticipants).toBeGreaterThanOrEqual(mc.minParticipants);
  });

  it.each(MASTER_CLASSES)('$title currentParticipants is within bounds', (mc) => {
    expect(mc.currentParticipants).toBeGreaterThanOrEqual(0);
    expect(mc.currentParticipants).toBeLessThanOrEqual(mc.maxParticipants);
  });

  it('all ids are unique', () => {
    const ids = MASTER_CLASSES.map(mc => mc.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
