import { useState } from 'react';
import styles from './GuestProfileScreen.module.css';

interface GuestProfileScreenProps {
  onBack: () => void;
  onBookings?: () => void;
  onBecomeInstructor?: () => void;
  onLogout?: () => void;
}

export function GuestProfileScreen({ onBack: _onBack, onBookings, onBecomeInstructor, onLogout }: GuestProfileScreenProps) {
  const [darkTheme, setDarkTheme] = useState(
    document.documentElement.getAttribute('data-theme') !== 'light'
  );
  const [pushOn, setPushOn] = useState(true);
  const [remindOn, setRemindOn] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  function toggleTheme() {
    const next = darkTheme ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    setDarkTheme(!darkTheme);
  }

  return (
    <div className={styles.screen}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.tbRow}>
          <div className={styles.av}>ИП</div>
          <div>
            <div className={styles.tbName}>Иван Петров</div>
            <div className={styles.tbPhone}>+7 909 ••• ••67</div>
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
              <div className={`${styles.statVal} ${styles.statValAccent}`}>2</div>
              <div className={styles.statLbl}>в избранном</div>
            </div>
          </div>

          {/* Основное */}
          <div className={styles.group}>
            <div className={styles.groupLabel}>Основное</div>
            <button className={styles.row} onClick={onBookings}>
              <div className={styles.rowIcon}>📅</div>
              <div className={styles.rowBody}>
                <div className={styles.rowTitle}>Мои занятия</div>
                <div className={styles.rowSub}>Запланированные и прошедшие</div>
              </div>
              <span className={styles.rowChevron}>›</span>
            </button>
            <button className={styles.row} onClick={() => showToast('♡ Избранные — скоро в этом разделе')}>
              <div className={styles.rowIcon}>♡</div>
              <div className={styles.rowBody}>
                <div className={styles.rowTitle}>Избранные</div>
                <div className={styles.rowSub}>2 инструктора в подборке</div>
              </div>
              <span className={styles.rowChevron}>›</span>
            </button>
            <button className={styles.row} onClick={() => showToast('Скрытые инструкторы — скоро в этом разделе')}>
              <div className={styles.rowIcon}>🙈</div>
              <div className={styles.rowBody}>
                <div className={styles.rowTitle}>Скрытые</div>
                <div className={styles.rowSub}>Не показывать в каталоге</div>
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
                <div className={styles.rowSub}>{darkTheme ? 'Тёмная тема ☾' : 'Светлая тема ☀'}</div>
              </div>
              <button
                className={`${styles.toggleSw} ${darkTheme ? styles.toggleSwOn : ''}`}
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
              <div className={styles.rowIcon}>🎿</div>
              <div className={styles.rowBody}>
                <div className={`${styles.rowTitle} ${styles.rowTitleAccent}`}>Стать инструктором</div>
                <div className={styles.rowSub}>Зарабатывайте на своих навыках</div>
              </div>
              <span className={styles.rowChevronAccent}>›</span>
            </button>
            <button className={styles.row} onClick={() => showToast('SkiFind v1.0 · Агрегатор инструкторов Шерегеша')}>
              <div className={styles.rowIcon}>ℹ</div>
              <div className={styles.rowBody}>
                <div className={styles.rowTitle}>О SkiFind</div>
              </div>
              <span className={styles.rowChevron}>›</span>
            </button>
            <button className={styles.row} onClick={() => showToast('Поддержка: support@skifind.ru')}>
              <div className={styles.rowIcon}>💬</div>
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

      {toast && (
        <div className={styles.toast}>{toast}</div>
      )}
    </div>
  );
}
