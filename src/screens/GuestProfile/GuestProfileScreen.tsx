import { useState } from 'react';
import styles from './GuestProfileScreen.module.css';
import type { Instructor } from '@/screens/Catalog/CatalogScreen';
import { Icon } from '@/components/Icon/Icon';
import { useTheme } from '@/hooks/useTheme';

interface GuestProfileScreenProps {
  onBack: () => void;
  onBookings?: () => void;
  onBecomeInstructor?: () => void;
  onLogout?: () => void;
  favorites?: Set<string>;
  onUnfavorite?: (id: string) => void;
  blockedIds?: Set<string>;
  onUnblock?: (id: string) => void;
  allInstructors?: Instructor[];
  onViewProfile?: (id: string) => void;
}

// Инициалы из имени: «Иван Петров» → «ИП»
function nameToInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '').join('') || 'Г';
}

export function GuestProfileScreen({
  onBack: _onBack,
  onBookings,
  onBecomeInstructor,
  onLogout,
  favorites = new Set(),
  onUnfavorite,
  blockedIds = new Set(),
  onUnblock,
  allInstructors = [],
  onViewProfile,
}: GuestProfileScreenProps) {
  // Читаем данные гостя из localStorage (обновляется при каждом монтировании)
  const guestName  = localStorage.getItem('guestName')  ?? 'Гость';
  const guestPhone = localStorage.getItem('guestPhone') ?? '';
  const initials   = nameToInitials(guestName);

  // Единый источник темы — хук useTheme (localStorage + применение к DOM).
  const { theme, toggleTheme } = useTheme();
  const [pushOn, setPushOn]     = useState(true);
  const [remindOn, setRemindOn] = useState(true);
  const [toast, setToast]       = useState<string | null>(null);
  const [overlay, setOverlay]   = useState<'favorites' | 'hidden' | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  const favoriteInstrs = allInstructors.filter(i => favorites.has(i.id));
  const hiddenInstrs   = allInstructors.filter(i => blockedIds.has(i.id));

  return (
    <div className={styles.screen}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.tbRow}>
          <div className={styles.av}>{initials}</div>
          <div>
            <div className={styles.tbName}>{guestName}</div>
            <div className={styles.tbPhone}>{guestPhone || 'Телефон не указан'}</div>
          </div>
        </div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.content}>

          {/* Stats */}
          <div className={styles.secLabel}>Моя статистика</div>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statVal}>5</div>
              <div className={styles.statLbl}>занятий</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statVal}>3</div>
              <div className={styles.statLbl}>инструктора</div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statVal} ${styles.statValAccent}`}>{favorites.size}</div>
              <div className={styles.statLbl}>в избранном</div>
            </div>
          </div>

          {/* Основное */}
          <div className={styles.group}>
            <div className={styles.groupLabel}>Основное</div>
            <button className={styles.row} onClick={onBookings}>
              <div className={styles.rowIcon}><Icon name="calendar" /></div>
              <div className={styles.rowBody}>
                <div className={styles.rowTitle}>Мои занятия</div>
                <div className={styles.rowSub}>Запланированные и прошедшие</div>
              </div>
              <span className={styles.rowChevron}>›</span>
            </button>
            <button className={styles.row} onClick={() => setOverlay('favorites')}>
              <div className={styles.rowIcon}><Icon name="heart" /></div>
              <div className={styles.rowBody}>
                <div className={styles.rowTitle}>Избранные</div>
                <div className={styles.rowSub}>
                  {favorites.size > 0 ? `${favorites.size} инструктор${favorites.size === 1 ? '' : favorites.size < 5 ? 'а' : 'ов'} в подборке` : 'Нет избранных'}
                </div>
              </div>
              <span className={styles.rowChevron}>›</span>
            </button>
            <button className={styles.row} onClick={() => setOverlay('hidden')}>
              <div className={styles.rowIcon}><Icon name="eye-off" /></div>
              <div className={styles.rowBody}>
                <div className={styles.rowTitle}>Скрытые</div>
                <div className={styles.rowSub}>
                  {blockedIds.size > 0 ? `${blockedIds.size} скрыт${blockedIds.size === 1 ? '' : blockedIds.size < 5 ? 'о' : 'о'} из каталога` : 'Нет скрытых'}
                </div>
              </div>
              <span className={styles.rowChevron}>›</span>
            </button>
          </div>

          {/* Внешний вид */}
          <div className={styles.group}>
            <div className={styles.groupLabel}>Внешний вид</div>
            <div className={styles.toggleRow}>
              <div className={styles.toggleBody}>
                <div className={styles.rowTitle}>Оформление</div>
                <div className={styles.rowSub}>{theme === 'dark' ? 'Тёмная тема ☾' : 'Светлая тема ☀'}</div>
              </div>
              <button
                className={`${styles.toggleSw} ${theme === 'dark' ? styles.toggleSwOn : ''}`}
                onClick={toggleTheme}
                aria-label="Переключить тему"
              />
            </div>
          </div>

          {/* Уведомления */}
          <div className={styles.group}>
            <div className={styles.groupLabel}>Уведомления</div>
            <div className={styles.toggleRow}>
              <div className={styles.toggleBody}>
                <div className={styles.rowTitle}>Push-уведомления</div>
                <div className={styles.rowSub}>Новые сообщения и подтверждения</div>
              </div>
              <button
                className={`${styles.toggleSw} ${pushOn ? styles.toggleSwOn : ''}`}
                onClick={() => setPushOn(v => !v)}
              />
            </div>
            <div className={styles.toggleRow}>
              <div className={styles.toggleBody}>
                <div className={styles.rowTitle}>Напоминания о занятиях</div>
                <div className={styles.rowSub}>За день и за час до занятия</div>
              </div>
              <button
                className={`${styles.toggleSw} ${remindOn ? styles.toggleSwOn : ''}`}
                onClick={() => setRemindOn(v => !v)}
              />
            </div>
          </div>

          {/* Прочее */}
          <div className={styles.group} style={{ marginBottom: 14 }}>
            <button className={styles.row} onClick={onBecomeInstructor}>
              <div className={styles.rowIcon}><Icon name="ski" /></div>
              <div className={styles.rowBody}>
                <div className={`${styles.rowTitle} ${styles.rowTitleAccent}`}>Стать инструктором</div>
                <div className={styles.rowSub}>Зарабатывайте на своих навыках</div>
              </div>
              <span className={styles.rowChevronAccent}>›</span>
            </button>
            <button className={styles.row} onClick={() => showToast('SkiFind v1.0 · Агрегатор инструкторов Шерегеша')}>
              <div className={styles.rowIcon}><Icon name="info" /></div>
              <div className={styles.rowBody}>
                <div className={styles.rowTitle}>О SkiFind</div>
              </div>
              <span className={styles.rowChevron}>›</span>
            </button>
            <button className={styles.row} onClick={() => showToast('Поддержка: support@skifind.ru')}>
              <div className={styles.rowIcon}><Icon name="chat" /></div>
              <div className={styles.rowBody}>
                <div className={styles.rowTitle}>Поддержка</div>
              </div>
              <span className={styles.rowChevron}>›</span>
            </button>
          </div>

          <button className={styles.logoutBtn} onClick={onLogout}>Выйти из аккаунта</button>
          <div className={styles.version}>SkiFind v1.0 · Демо</div>

        </div>
      </div>

      {/* ── Overlay: Избранные ── */}
      {overlay === 'favorites' && (
        <div className={styles.overlayBg} onClick={() => setOverlay(null)}>
          <div className={styles.overlayBox} onClick={e => e.stopPropagation()}>
            <div className={styles.overlayHeader}>
              <div className={styles.overlayTitle}>Избранные</div>
              <button className={styles.overlayClose} onClick={() => setOverlay(null)}>✕</button>
            </div>
            {favoriteInstrs.length === 0 ? (
              <div className={styles.overlayEmpty}>Вы пока не добавили инструкторов в избранное</div>
            ) : (
              <div className={styles.overlayList}>
                {favoriteInstrs.map(instr => (
                  <div key={instr.id} className={styles.overlayItem}>
                    <div className={`${styles.overlayAv} ${styles[`av-${instr.avatarColor}`]}`}>
                      {instr.initials}
                    </div>
                    <div className={styles.overlayInfo}>
                      <div className={styles.overlayName}>{instr.name}</div>
                      <div className={styles.overlaySub}>
                        {instr.type.map(t => t === 'ski' ? 'Горные лыжи' : 'Сноуборд').join(' · ')} · ★{instr.rating}
                      </div>
                    </div>
                    <div className={styles.overlayActions}>
                      <button
                        className={styles.overlayBtnPrimary}
                        onClick={() => { setOverlay(null); onViewProfile?.(instr.id); }}
                      >
                        Открыть
                      </button>
                      <button
                        className={styles.overlayBtnDanger}
                        onClick={() => onUnfavorite?.(instr.id)}
                      >
                        <Icon name="heart" size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Overlay: Скрытые ── */}
      {overlay === 'hidden' && (
        <div className={styles.overlayBg} onClick={() => setOverlay(null)}>
          <div className={styles.overlayBox} onClick={e => e.stopPropagation()}>
            <div className={styles.overlayHeader}>
              <div className={styles.overlayTitle}>Скрытые инструкторы</div>
              <button className={styles.overlayClose} onClick={() => setOverlay(null)}>✕</button>
            </div>
            {hiddenInstrs.length === 0 ? (
              <div className={styles.overlayEmpty}>Нет скрытых инструкторов</div>
            ) : (
              <div className={styles.overlayList}>
                {hiddenInstrs.map(instr => (
                  <div key={instr.id} className={styles.overlayItem}>
                    <div className={`${styles.overlayAv} ${styles[`av-${instr.avatarColor}`]}`} style={{ opacity: 0.5 }}>
                      {instr.initials}
                    </div>
                    <div className={styles.overlayInfo}>
                      <div className={styles.overlayName}>{instr.name}</div>
                      <div className={styles.overlaySub}>
                        {instr.type.map(t => t === 'ski' ? 'Горные лыжи' : 'Сноуборд').join(' · ')} · Скрыт из каталога
                      </div>
                    </div>
                    <button
                      className={styles.overlayBtnSecondary}
                      onClick={() => { onUnblock?.(instr.id); showToast('✓ Инструктор снова виден'); }}
                    >
                      Показать
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
