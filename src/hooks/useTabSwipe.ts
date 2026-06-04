import { useRef } from 'react';

/**
 * Horizontal swipe to switch between tabs.
 * Attach onTouchStart / onTouchEnd to the scrollable content area.
 * Does NOT call preventDefault — vertical scroll is preserved.
 */
export function useTabSwipe<T>(
  tabs: readonly T[],
  active: T,
  setTab: (t: T) => void,
  minDx = 55,   // minimum horizontal distance to trigger
) {
  const startX = useRef(0);
  const startY = useRef(0);

  const idx = tabs.indexOf(active);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    if (Math.abs(dx) < minDx) return;
    if (Math.abs(dy) > Math.abs(dx) * 0.8) return; // too vertical
    if (dx < 0 && idx < tabs.length - 1) setTab(tabs[idx + 1]); // swipe left → next
    if (dx > 0 && idx > 0)               setTab(tabs[idx - 1]); // swipe right → prev
  }

  return { onTouchStart, onTouchEnd };
}
