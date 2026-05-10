import { useEffect } from 'react';

/**
 * Swipe-back gesture: swipe right starting from the left edge → calls onBack.
 * Pass null to disable (e.g. when at root screen).
 */
export function useSwipeBack(onBack: (() => void) | null) {
  useEffect(() => {
    if (!onBack) return;

    let startX = 0;
    let startY = 0;

    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }

    function onTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = Math.abs(e.changedTouches[0].clientY - startY);

      // Must start within 30px of left edge, swipe right ≥ 72px, mostly horizontal
      if (startX < 30 && dx >= 72 && dy < dx * 0.6) {
        onBack!();
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend',   onTouchEnd,   { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend',   onTouchEnd);
    };
  }, [onBack]);
}
