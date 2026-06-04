import { useState } from 'react';
import styles from './InstrProfileScreen.module.css';
import { ShareModal } from '@/components/ShareModal/ShareModal';
import { getAcceptedLessons } from '@/store/bookings';
import {
  INSTRUCTOR_PRICES,
  updatePrice,
} from '@/store/instructorProfile';

interface ToggleSetting {
  id: string;
  title: string;
  sub: string;
  on: boolean;
}

interface InstrProfileScreenProps {
  onBalance:     () => void;
  onEditProfile: () => void;
  onLogout:      () => void;
}

export function InstrProfileScreen({ onBalance, onEditProfile, onLogout }: InstrProfileScreenProps) {
  const accepted      = getAcceptedLessons('aleksey');
  const totalEarnings = accepted.reduce((s, b) => s + b.price, 0);
  const lessonCount   = accepted.length;
  const avgCheck      = lessonCount > 0 ? Math.round(totalEarnings / lessonCount) : 0;

  const [isDark, setIsDark]       = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [toast, setToast]         = useState<string | null>(null);

  // ── Цены ──────────────────────────────────────────────────────────────
  const [prices, setPrices] = useState(() =>
    INSTRUCTOR_PRICES.map(r => ({ ...r, draft: String(r.price) }))
  );
  const [pricesSaved, setPricesSaved] = useState(false);

  function handlePriceChange(format: string, val: string) {
    setPrices(prev => prev.map(r => r.format === format ? { ...r, draft: val } : r));
    setPricesSaved(false);
  }

  function savePrices() {
    prices.forEach(r => {
      const n = parseInt(r.draft, 10);
      if (!isNaN(n) && n > 0) updatePrice(r.format as any, n);
    });
    setPrices(INSTRUCTOR_PRICES.map(r => ({ ...r, draft: String(r.price) })));
    setPricesSaved(true);
    showToast('✓ Цены сохранены');
  }

  // ── Видимость ─────────────────────────────────────────────────────────
  const [settings, setSettings] = useState<ToggleSetting[]>([
    { id: 'published', title: 'Профиль опубликован',   sub: 'Виден гостям в каталоге',       on: true },
    { id: 'requests',  title: 'Принимать заявки',       sub: 'Гости могут отправлять заявки', on: true },
    { id: 'notif',     title: 'Уведомления о заявках',  sub: 'Push при новой заявке',         on: true },
    { id: 'community', title: 'Видимость в сообществе', sub: 'Коллеги могут найти вас',       on: true },
  ]);

  function toggleSetting(id: string) {
    setSettings(s => s.map(r => r.id === id ? { ...r, on: !r.on } : r));
  }

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const pricesDirty = prices.some(r => {
    const n = parseInt(r.draft, 10);
    return !isNaN(n) && n !== r.price;
  });

  return (
    <div className={styles.screen}>
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}

      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.tbRow}>
          <div className={`${styles.av} ${styles.avMd} ${styles.avBlue}`}>АМ</div>
          <div className={styles.tbInfo}>
            <div className={styles.tbName}>Алексей Морозов</div>
            <div className={styles.tbRole}>Инструктор · Сноуборд</div>
          </div>
          <button className={styles.shareBtn} aria-label="Поделиться" onClick={() => setShowShare(true)}>
            <svg viewBox="0 0 24 24">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49"/>
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.scroll}>

        {/* ── Заработок ── */}
        <div className={styles.earningsWrap}>
          <div className={styles.secLabel}>Заработок</div>
          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <div className={styles.metricVal}>{totalEarnings.toLocaleString('ru')}</div>
              <div className={styles.metricLbl}>₽ всего</div>
              <div className={styles.metricDelta}>↑ 12%</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricVal}>{lessonCount}</div>
              <div className={styles.metricLbl}>Занятий</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricVal}>{avgCheck.toLocaleString('ru')}</div>
              <div className={styles.metricLbl}>Ср. чек ₽</div>
            </div>
          </div>

          <div className={styles.secLabel}>Последние выплаты</div>
          <div className={styles.paymentList}>
            {accepted.slice(0, 3).map(b => (
              <div key={b.id} className={styles.paymentRow}>
                <div className={`${styles.av} ${styles.avSm} ${styles[`av${b.studentColor.charAt(0).toUpperCase() + b.studentColor.slice(1)}`]}`}>
                  {b.studentInitials}
                </div>
                <div className={styles.payInfo}>
                  <div className={styles.payName}>{b.studentName}</div>
                  <div className={styles.payMeta}>{b.dayNum} {b.dayMon} · {b.formatLabel}</div>
                </div>
                <div className={styles.payRight}>
                  <div className={styles.payAmount}>{b.price.toLocaleString('ru')} ₽</div>
                  <span className={`${styles.payBadge} ${styles.payBadgePaid}`}>Оплачено</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Цены на занятия ── */}
        <div className={styles.settingsWrap}>
          <div className={styles.secLabel}>Цены на занятия</div>
          <div className={styles.settingsGroup}>
            <div className={styles.settingsGroupBody}>
              {prices.map(r => {
                const n = parseInt(r.draft, 10);
                const invalid = r.draft.trim() !== '' && (isNaN(n) || n <= 0);
                return (
                  <div key={r.format} className={styles.priceRow}>
                    <div className={styles.priceLeft}>
                      <span className={styles.priceEmoji}>{r.emoji}</span>
                      <div>
                        <div className={styles.priceLabel}>{r.label}</div>
                        <div className={styles.priceHint}>{r.hint}</div>
                      </div>
                    </div>
                    <div className={styles.priceRight}>
                      <input
                        type="number"
                        inputMode="numeric"
                        className={`${styles.priceInput} ${invalid ? styles.priceInputError : ''}`}
                        value={r.draft}
                        onChange={e => handlePriceChange(r.format, e.target.value)}
                      />
                      <span className={styles.priceUnit}>{r.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button
            className={`${styles.btnBlock} ${(!pricesDirty && pricesSaved) ? styles.btnBlockSaved : ''}`}
            onClick={savePrices}
            disabled={!pricesDirty && pricesSaved}
          >
            {pricesSaved && !pricesDirty ? '✓ Цены сохранены' : 'Сохранить цены'}
          </button>
        </div>

        {/* ── Настройки ── */}
        <div className={styles.settingsWrap}>
          <div className={styles.secLabel}>Настройки</div>

          <div className={styles.settingsGroup}>
            <div className={styles.settingsGroupLabel}>Основное</div>
            <div className={styles.settingsGroupBody}>
              <div className={styles.infoRow}>
                <span className={styles.infoRowKey}>Имя</span>
                <span className={styles.infoRowValue}>Алексей Морозов</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoRowKey}>Телефон</span>
                <span className={styles.infoRowValue}>+7 909 123-45-67</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoRowKey}>Курорт</span>
                <span className={styles.infoRowValue}>Шерегеш</span>
              </div>
            </div>
          </div>

          <div className={styles.settingsGroup}>
            <div className={styles.settingsGroupLabel}>Внешний вид</div>
            <div className={styles.settingsGroupBody}>
              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <div className={styles.settingTitle}>Оформление</div>
                  <div className={styles.settingSub}>{isDark ? 'Тёмная тема ☾' : 'Светлая тема ☀️'}</div>
                </div>
                <button className={`${styles.sw} ${isDark ? styles.swOn : ''}`} onClick={toggleTheme} />
              </div>
            </div>
          </div>

          <div className={styles.settingsGroup}>
            <div className={styles.settingsGroupLabel}>Видимость</div>
            <div className={styles.settingsGroupBody}>
              {settings.map(s => (
                <div key={s.id} className={styles.settingRow}>
                  <div className={styles.settingLabel}>
                    <div className={styles.settingTitle}>{s.title}</div>
                    <div className={styles.settingSub}>{s.sub}</div>
                  </div>
                  <button
                    className={`${styles.sw} ${s.on ? styles.swOn : ''}`}
                    onClick={() => toggleSetting(s.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          <button className={styles.btnBlock} onClick={onBalance}>💰 Баланс и история платежей →</button>
          <button className={styles.btnBlock} onClick={onEditProfile}>Редактировать профиль →</button>
          <button className={`${styles.btnBlock} ${styles.btnDanger}`} onClick={onLogout}>Выйти из аккаунта</button>
        </div>

      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
