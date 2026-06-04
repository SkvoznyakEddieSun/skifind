import { useEffect, useRef, useState, ReactNode } from 'react';
import styles from './SwipeBack.module.css';

const EDGE_PX   = 20;    // зона срабатывания у левого края
const THRESHOLD = 0.38;  // доля ширины экрана для подтверждения свайпа
const PREV_PULL = 0.28;  // насколько предыдущий экран выдвигается навстречу

interface Props {
  children:    ReactNode;
  prevContent: ReactNode | null;
  canSwipe:    boolean;
  onBack:      () => void;
}

export function SwipeBack({ children, prevContent, canSwipe, onBack }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Rendering state ---
  const [dx, setDx]             = useState(0);   // текущее смещение (px)
  const [animating, setAnimating] = useState(false); // идёт CSS-переход?
  const [prevMounted, setPrevMounted] = useState(false); // показывать предыдущий экран?

  // --- Refs (для event handlers, без stale closure) ---
  const trackingRef    = useRef(false);
  const horizontalRef  = useRef(false);
  const startXRef      = useRef(0);
  const startYRef      = useRef(0);
  const dxRef          = useRef(0);
  const canSwipeRef    = useRef(canSwipe);
  const prevContentRef = useRef(prevContent);

  canSwipeRef.current    = canSwipe;
  prevContentRef.current = prevContent;

  // Добавляем non-passive touchmove, чтобы можно было вызвать preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onMove(e: TouchEvent) {
      if (!trackingRef.current) return;

      const touch  = e.touches[0];
      const rawDx  = touch.clientX - startXRef.current;
      const rawDy  = touch.clientY - startYRef.current;

      if (!horizontalRef.current) {
        if (Math.abs(rawDx) > Math.abs(rawDy) * 1.5) {
          horizontalRef.current = true;
        } else if (Math.abs(rawDy) > Math.abs(rawDx) * 1.2) {
          // вертикальный скролл — отменяем трекинг
          trackingRef.current = false;
          setPrevMounted(false);
          return;
        } else {
          return; // неопределённо, ждём
        }
      }

      e.preventDefault(); // блокируем скролл страницы
      const newDx = Math.max(0, rawDx);
      dxRef.current = newDx;
      setDx(newDx);
    }

    el.addEventListener('touchmove', onMove, { passive: false });
    return () => el.removeEventListener('touchmove', onMove);
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    if (!canSwipeRef.current || !prevContentRef.current) return;
    const touch = e.touches[0];
    if (touch.clientX > EDGE_PX) return;

    trackingRef.current   = true;
    horizontalRef.current = false;
    startXRef.current     = touch.clientX;
    startYRef.current     = touch.clientY;
    dxRef.current         = 0;
    setDx(0);
    setAnimating(false);
    setPrevMounted(true); // монтируем предыдущий экран
  }

  function handleTouchEnd() {
    if (!trackingRef.current) return;
    trackingRef.current = false;

    if (!horizontalRef.current || dxRef.current === 0) {
      setPrevMounted(false);
      return;
    }

    const W        = window.innerWidth;
    const progress = dxRef.current / W;
    setAnimating(true);

    if (progress >= THRESHOLD) {
      // Подтверждаем — анимируем до конца, затем pop
      setDx(W);
      setTimeout(() => {
        onBack();
        setDx(0);
        setAnimating(false);
        setPrevMounted(false);
      }, 280);
    } else {
      // Отменяем — возвращаем на место
      setDx(0);
      setTimeout(() => {
        setAnimating(false);
        setPrevMounted(false);
      }, 280);
    }
  }

  const W        = typeof window !== 'undefined' ? window.innerWidth : 390;
  const progress = dx / W;
  const isActive = prevMounted;
  const easing   = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  const tr       = animating ? `transform 0.28s ${easing}` : 'none';

  const currentX = isActive ? dx : 0;
  const prevX    = isActive ? (progress - 1) * PREV_PULL * W : -PREV_PULL * W;
  const overlayO = isActive ? 0.28 * (1 - progress) : 0;

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Предыдущий экран (за текущим) */}
      {isActive && prevContent && (
        <div
          className={styles.prevScreen}
          style={{ transform: `translateX(${prevX}px)`, transition: tr }}
        >
          {prevContent}
          {/* Затемнение поверх предыдущего */}
          <div className={styles.dimOverlay} style={{ opacity: overlayO }} />
        </div>
      )}

      {/* Текущий экран */}
      <div
        className={styles.currentScreen}
        style={{
          transform:  `translateX(${currentX}px)`,
          transition: tr,
          boxShadow:  isActive ? '-6px 0 24px rgba(0,0,0,0.35)' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
