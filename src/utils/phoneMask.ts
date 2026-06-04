/**
 * Formats a raw input string into a Russian phone mask: +7 (XXX) XXX-XX-XX
 * Handles input starting with 7, 8, or bare digits.
 */
export function applyPhoneMask(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  else if (d.length && !d.startsWith('7')) d = '7' + d;
  d = d.slice(0, 11);

  if (!d) return '';
  const out = '+7';
  if (d.length === 1) return out;

  const area = d.slice(1, 4);
  if (d.length < 5) return out + ' (' + area;
  const withArea = out + ' (' + area + ')';

  const mid = d.slice(4, 7);
  if (d.length < 8) return withArea + ' ' + mid;
  const withMid = withArea + ' ' + mid;

  const p1 = d.slice(7, 9);
  if (d.length < 10) return withMid + '-' + p1;

  return withMid + '-' + p1 + '-' + d.slice(9, 11);
}
