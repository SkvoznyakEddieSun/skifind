import { useState } from 'react';
import styles from './InstrProfileScreen.module.css';
import { ShareModal } from '@/components/ShareModal/ShareModal';
import { getAcceptedLessons } from '@/store/bookings';
import {
  INSTR_PRICING,
  INSTR_FLAGS,
  updateInstrPrice,
  updateInstrFlags,
} from '@/store/instructorProfile';
import { INSTRUCTORS } from '@/screens/Catalog/CatalogScreen';

// ── Конфиг длительностей ────────────────────────────────────────────────────
const DURATIONS = [
  { key: 'h1', label: '1 час'   },
  { key: 'h2', label: '2 часа'  },
  { key: 'h3', label: '3 часа'  },
  { key: 'h4', label: '4 часа'  },
] as const;

type DurKey = typeof DURATIONS[number]['key'];

/** Сбросить черновик из текущего стора */
function initDraft(): Record<string, string> {
  const d: Record<string, string> = {};
  for (const dk of ['h1','h2','h3','h4'] as DurKey[]) {
    d[`individual.${dk}`] = String(INSTR_PRICING.individual[dk]);
    d[`miniGroup.${dk}`]  = String(INSTR_PRICING.miniGroup[dk]);
  }
  d['individual.fullDay'] = INSTR_PRICING.individual.fullDay != null
    ? String(INSTR_PRICING.individual.fullDay) : '';
  d['miniGroup.fullDay']  = INSTR_PRICING.miniGroup.fullDay != null
    ? String(INSTR_PRICING.miniGroup.fullDay) : '';
  d['miniGroup.extraPersonPrice'] = String(INSTR_PRICING.miniGroup.extraPersonPrice);
  d['miniGroup.maxParticipants']  = String(INSTR_PRICING.miniGroup.maxParticipants);
  d['shortSlotPrice'] = INSTR_PRICING.shortSlotPrice != null
    ? String(INSTR_PRICING.shortSlotPrice) : '';
  return d;
}

interface ToggleSetting {
  id: string;
  title: string;
  sub: string;
  on: boolean;
}

interface InstrProfileScreenProps {
  onBalance:   () => void;
  onMyProfile: () => void;
  onLogout:    () => void;
}

export function InstrProfileScreen({ onBalance, onMyProfile, onLogout }: InstrProfileScreenProps) {
  const accepted      = getAcceptedLessons('aleksey');
  const totalEarnings = accepted.reduce((s, b) => s + b.price, 0);
  const lessonCount   = accepted.length;
  const avgCheck      = lessonCount > 0 ? Math.round(totalEarnings / lessonCount) : 0;

  const [isDark, setIsDark]         = useState(true);
  const [showShare, setShowShare]   = useState(false);
  const [toast, setToast]           = useState<string | null>(null);
  // Читаем из стора при маунте — подхватывает изменения из RegisterScreen
  const [worksWithKids]                         = useState(() => INSTR_FLAGS.worksWithKids);
  const [allowsShortSlots, setAllowsShortSlots] = useState(() => INSTR_FLAGS.allowsShortSlots);

  // ── Цены ──────────────────────────────────────────────────────────────
  const [draft, setDraft] = useState<Record<string, string>>(initDraft);
  const [pricesSaved, setPricesSaved] = useState(false);
  const [openSections, setOpenSections] = useState({ individual: false, miniGroup: false, kids: false });
  function toggleSection(s: keyof typeof openSections) {
    setOpenSections(prev => ({ ...prev, [s]: !prev[s] }));
  }

  function handlePriceChange(path: string, val: string) {
    setDraft(prev => ({ ...prev, [path]: val }));
    setPricesSaved(false);
  }

  function savePrices() {
    for (const [path, val] of Object.entries(draft)) {
      const n = parseInt(val, 10);
      if (!isNaN(n) && n > 0) updateInstrPrice(path, n);
    }
    setDraft(initDraft());
    setPricesSaved(true);
    showToast('✓ Цены сохранены');
  }

  const OPTIONAL_PRICE_KEYS = new Set(['individual.fullDay', 'miniGroup.fullDay', 'shortSlotPrice']);
  const pricesDirty = Object.entries(draft).some(([key, val]) => {
    if (OPTIONAL_PRICE_KEYS.has(key)) return false; // empty string is valid for optional fields
    const n = parseInt(val, 10);
    return isNaN(n) || n <= 0;
  }) || (() => {
    const orig = initDraft();
    return Object.entries(draft).some(([k, v]) => v !== orig[k]);
  })();

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


  return (
    <div className={styles.screen}>
      {showShare && (
        <ShareModal
          onClose={() => setShowShare(false)}
          instructorId={INSTRUCTORS[0].id}
          instructorName={INSTRUCTORS[0].name}
        />
      )}

      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.tbRow}>
          {INSTRUCTORS[0].photoUrl ? (
            <div
              className={`${styles.av} ${styles.avMd}`}
              style={{ backgroundImage: `url(${INSTRUCTORS[0].photoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
          ) : (
            <div className={`${styles.av} ${styles.avMd} ${styles.avBlue}`}>{INSTRUCTORS[0].initials}</div>
          )}
          <div className={styles.tbInfo}>
            <div className={styles.tbName}>{INSTRUCTORS[0].name}</div>
            <div className={styles.tbRole}>Инструктор · {INSTRUCTORS[0].type.map(t => t === 'ski' ? 'Горные лыжи' : 'Сноуборд').join(', ')}</div>
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

          {/* Индивидуальное */}
          <div className={styles.settingsGroup}>
            <button className={styles.collapsibleHeader} onClick={() => toggleSection('individual')}>
              <span>🎿 Индивидуальное · один ученик</span>
              <span className={`${styles.chevron} ${openSections.individual ? styles.chevronOpen : ''}`}>›</span>
            </button>
            {openSections.individual && (
              <div className={styles.settingsGroupBody}>
                {DURATIONS.map(d => {
                  const path = `individual.${d.key}`;
                  const val = draft[path] ?? '';
                  const n = parseInt(val, 10);
                  const invalid = val.trim() !== '' && (isNaN(n) || n <= 0);
                  return (
                    <div key={d.key} className={styles.priceRow}>
                      <div className={styles.priceLabel}>{d.label}</div>
                      <div className={styles.priceRight}>
                        <input type="number" inputMode="numeric"
                          className={`input-field input-field--right input-field--sm${invalid ? ' input-field--error' : ''}`}
                          style={{ width: '72px' }}
                          value={val} onChange={e => handlePriceChange(path, e.target.value)} />
                        <span className={styles.priceUnit}>₽</span>
                      </div>
                    </div>
                  );
                })}
                {/* Весь день — необязательно */}
                {(() => {
                  const path = 'individual.fullDay';
                  const val = draft[path] ?? '';
                  const n = parseInt(val, 10);
                  const invalid = val.trim() !== '' && (isNaN(n) || n <= 0);
                  return (
                    <div className={styles.priceRow}>
                      <div className={styles.priceLabel} style={{ color: 'var(--text-dim)' }}>Весь день <span style={{ fontSize: 11 }}>(необяз.)</span></div>
                      <div className={styles.priceRight}>
                        <input type="number" inputMode="numeric"
                          className={`input-field input-field--right input-field--sm${invalid ? ' input-field--error' : ''}`}
                          style={{ width: '72px' }}
                          placeholder="—"
                          value={val} onChange={e => handlePriceChange(path, e.target.value)} />
                        <span className={styles.priceUnit}>₽</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Мини-группа */}
          <div className={styles.settingsGroup}>
            <button className={styles.collapsibleHeader} onClick={() => toggleSection('miniGroup')}>
              <span>👥 Мини-группа · база за 2 чел.</span>
              <span className={`${styles.chevron} ${openSections.miniGroup ? styles.chevronOpen : ''}`}>›</span>
            </button>
            {openSections.miniGroup && (
              <div className={styles.settingsGroupBody}>
                {DURATIONS.map(d => {
                  const path = `miniGroup.${d.key}`;
                  const val = draft[path] ?? '';
                  const n = parseInt(val, 10);
                  const invalid = val.trim() !== '' && (isNaN(n) || n <= 0);
                  return (
                    <div key={d.key} className={styles.priceRow}>
                      <div className={styles.priceLabel}>{d.label}</div>
                      <div className={styles.priceRight}>
                        <input type="number" inputMode="numeric"
                          className={`input-field input-field--right input-field--sm${invalid ? ' input-field--error' : ''}`}
                          style={{ width: '72px' }}
                          value={val} onChange={e => handlePriceChange(path, e.target.value)} />
                        <span className={styles.priceUnit}>₽</span>
                      </div>
                    </div>
                  );
                })}
                {/* Весь день — необязательно */}
                {(() => {
                  const path = 'miniGroup.fullDay';
                  const val = draft[path] ?? '';
                  const n = parseInt(val, 10);
                  const invalid = val.trim() !== '' && (isNaN(n) || n <= 0);
                  return (
                    <div className={styles.priceRow}>
                      <div className={styles.priceLabel} style={{ color: 'var(--text-dim)' }}>Весь день <span style={{ fontSize: 11 }}>(необяз.)</span></div>
                      <div className={styles.priceRight}>
                        <input type="number" inputMode="numeric"
                          className={`input-field input-field--right input-field--sm${invalid ? ' input-field--error' : ''}`}
                          style={{ width: '72px' }}
                          placeholder="—"
                          value={val} onChange={e => handlePriceChange(path, e.target.value)} />
                        <span className={styles.priceUnit}>₽</span>
                      </div>
                    </div>
                  );
                })()}
                <div className={styles.priceRow}>
                  <div className={styles.priceLabel}>Доп. участник</div>
                  <div className={styles.priceRight}>
                    <input type="number" inputMode="numeric"
                      className="input-field input-field--right input-field--sm"
                      style={{ width: '72px' }}
                      value={draft['miniGroup.extraPersonPrice'] ?? ''}
                      onChange={e => handlePriceChange('miniGroup.extraPersonPrice', e.target.value)} />
                    <span className={styles.priceUnit}>₽/чел.</span>
                  </div>
                </div>
                <div className={styles.priceRow}>
                  <div className={styles.priceLabel}>Макс. участников</div>
                  <div className={styles.priceRight}>
                    <input type="number" inputMode="numeric"
                      className="input-field input-field--right input-field--sm"
                      style={{ width: '52px' }}
                      value={draft['miniGroup.maxParticipants'] ?? ''}
                      onChange={e => handlePriceChange('miniGroup.maxParticipants', e.target.value)} />
                    <span className={styles.priceUnit}>чел.</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Короткие слоты — только если worksWithKids */}
          {worksWithKids && (
            <div className={styles.settingsGroup}>
              <div className={styles.settingsGroupBody}>
                <div className={styles.settingRow}>
                  <div className={styles.settingLabel}>
                    <div className={styles.settingTitle}>Короткие слоты 45 мин</div>
                    <div className={styles.settingSub}>Доступны при записи в детский формат</div>
                  </div>
                  <button
                    className={`${styles.sw} ${allowsShortSlots ? styles.swOn : ''}`}
                    onClick={() => setAllowsShortSlots(v => {
                      updateInstrFlags('allowsShortSlots', !v);
                      return !v;
                    })}
                  />
                </div>
                {allowsShortSlots && (
                  <div className={styles.priceRow}>
                    <div className={styles.priceLabel}>45 минут</div>
                    <div className={styles.priceRight}>
                      <input
                        type="number" inputMode="numeric"
                        className="input-field input-field--right input-field--sm"
                        style={{ width: '72px' }}
                        value={draft['shortSlotPrice'] ?? ''}
                        onChange={e => handlePriceChange('shortSlotPrice', e.target.value)}
                      />
                      <span className={styles.priceUnit}>₽</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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

          <button className={styles.btnBlock} onClick={onMyProfile}>Мой профиль →</button>
          <button className={styles.btnBlock} onClick={onBalance}>Баланс и история платежей →</button>
          <button className={`${styles.btnBlock} ${styles.btnDanger}`} onClick={onLogout}>Выйти из аккаунта</button>
        </div>

      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
