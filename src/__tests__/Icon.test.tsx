import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icon, type IconName } from '@/components/Icon/Icon';

const ALL_ICONS: IconName[] = [
  'check-circle', 'chat', 'bell', 'sparkles', 'credit-card', 'star',
  'alert-triangle', 'ski', 'bolt', 'plus', 'check', 'info', 'calendar',
  'heart', 'eye-off', 'map-pin', 'users', 'lock', 'pin', 'mountain',
  'snowboard', 'dollar-sign', 'file-text', 'clock', 'search',
];

describe('Icon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<Icon name="star" />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('defaults to size 18', () => {
    const { container } = render(<Icon name="star" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('18');
    expect(svg.getAttribute('height')).toBe('18');
  });

  it('applies correct width/height from size prop', () => {
    const { container } = render(<Icon name="star" size={32} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('32');
    expect(svg.getAttribute('height')).toBe('32');
  });

  it.each(ALL_ICONS)('renders without throwing for icon "%s"', (name) => {
    expect(() => render(<Icon name={name} />)).not.toThrow();
  });
});
