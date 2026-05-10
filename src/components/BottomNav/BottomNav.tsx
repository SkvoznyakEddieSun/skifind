import styles from './BottomNav.module.css';

/* ── Icon paths (Feather-style) ── */
const ICONS = {
  home:     <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  requests: <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  chat:     <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  calendar: <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  profile:  <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  search:   <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  bookings: <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
};

export interface NavItem {
  id: string;
  label: string;
  icon: keyof typeof ICONS;
  badge?: number;
}

interface BottomNavProps {
  items: NavItem[];
  active: string;
  onTab: (id: string) => void;
}

export function BottomNav({ items, active, onTab }: BottomNavProps) {
  return (
    <nav className={styles.nav}>
      {items.map(item => (
        <button
          key={item.id}
          className={`${styles.item} ${active === item.id ? styles.itemActive : ''}`}
          onClick={() => onTab(item.id)}
        >
          <div className={styles.icon}>
            {ICONS[item.icon]}
            {item.badge ? <span className={styles.badge}>{item.badge > 99 ? '99+' : item.badge}</span> : null}
          </div>
          <span className={styles.label}>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
