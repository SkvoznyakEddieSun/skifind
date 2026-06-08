/**
 * Helpers for MasterClass screens.
 */

export function minPartsLabel(n: number): string {
  if (n === 1) return '1 участник';
  if (n < 5)   return `${n} участника`;
  return `${n} участников`;
}
