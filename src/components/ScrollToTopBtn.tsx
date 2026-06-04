/**
 * Плавающая кнопка «Наверх» — появляется после скролла > 300px.
 * Принимает show (bool) и onClick; позиционируется fixed над BottomNav.
 */

interface ScrollToTopBtnProps {
  show: boolean;
  onClick: () => void;
  bottomOffset?: number; // px от низа экрана (по умолчанию 80 — над BottomNav)
}

export function ScrollToTopBtn({ show, onClick, bottomOffset = 80 }: ScrollToTopBtnProps) {
  return (
    <button
      aria-label="Наверх"
      onClick={onClick}
      style={{
        position:      'fixed',
        left:          16,
        bottom:        bottomOffset,
        width:         44,
        height:        44,
        borderRadius:  '50%',
        background:    'var(--accent)',
        color:         'var(--accent-text)',
        border:        'none',
        fontSize:      20,
        fontWeight:    700,
        display:       'flex',
        alignItems:    'center',
        justifyContent:'center',
        cursor:        'pointer',
        zIndex:        50,
        opacity:       show ? 1 : 0,
        pointerEvents: show ? 'auto' : 'none',
        transition:    'opacity .2s',
        boxShadow:     '0 2px 12px rgba(0,0,0,.18)',
        lineHeight:    1,
      }}
    >
      ↑
    </button>
  );
}
