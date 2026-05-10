import { useState } from 'react';
import styles from './RequestsScreen.module.css';

interface ReqCardData {
  id: string;
  name: string;
  time: string;
  tags: { label: string; color: 'blue' | 'mint' | 'straw' | 'gray' | 'purple' }[];
  msg: string;
  price: string;
  commission: string;
}

interface StuData {
  id: string;
  initials: string;
  color: 'ice' | 'mint' | 'straw' | 'purple';
  name: string;
  meta: string;
  stats: string[];
  status: 'active' | 'pending' | 'inactive';
  dim?: boolean;
}

const REQUESTS: ReqCardData[] = [
  {
    id: 'roman',
    name: 'Роман Ефимов',
    time: 'сегодня 11:42',
    tags: [
      { label: 'Сноуборд', color: 'blue' },
      { label: 'Новичок', color: 'mint' },
      { label: '28 апр · 10:00', color: 'gray' },
    ],
    msg: '«Хотим с женой научиться с нуля. Можете взять сразу двоих?»',
    price: '7 000 ₽',
    commission: '350 ₽',
  },
  {
    id: 'anna',
    name: 'Анна Белова',
    time: 'вчера 19:05',
    tags: [
      { label: 'Горные лыжи', color: 'blue' },
      { label: 'Продвинутый', color: 'straw' },
      { label: '30 апр · 09:00', color: 'gray' },
    ],
    msg: '«Хочу поработать над техникой карвинга на красных трассах.»',
    price: '10 500 ₽',
    commission: '525 ₽',
  },
  {
    id: 'mikhail',
    name: 'Михаил Орлов',
    time: 'вчера 14:30',
    tags: [
      { label: 'Сноуборд', color: 'blue' },
      { label: 'Дети · 8 лет', color: 'purple' },
      { label: '1 мая · 11:00', color: 'gray' },
    ],
    msg: '«Сын первый раз на горе. Работаете с такими маленькими?»',
    price: '2 800 ₽',
    commission: '140 ₽',
  },
];

const STUDENTS: StuData[] = [
  {
    id: 'kirill',
    initials: 'КВ',
    color: 'ice',
    name: 'Кирилл Волков',
    meta: '+7 916 234-56-78 · Сноуборд',
    stats: ['3 занятия', 'Последнее 15 апр'],
    status: 'active',
  },
  {
    id: 'mikhail2',
    initials: 'МО',
    color: 'straw',
    name: 'Михаил Орлов',
    meta: '+7 925 567-89-01 · Сноуборд',
    stats: ['5 занятий', 'Последнее 20 апр'],
    status: 'active',
  },
  {
    id: 'elena',
    initials: 'ЕС',
    color: 'purple',
    name: 'Елена Соколова',
    meta: '+7 903 111-22-33 · Сноуборд',
    stats: ['Приглашение отправлено'],
    status: 'pending',
    dim: true,
  },
];

const INACTIVE_STUDENTS: StuData[] = [
  {
    id: 'tatyana',
    initials: 'ТН',
    color: 'mint',
    name: 'Татьяна Новикова',
    meta: '+7 903 456-78-90 · Лыжи (ребёнок)',
    stats: ['1 занятие', 'Последнее 22 мар'],
    status: 'inactive',
  },
];

const TAG_CLASS: Record<string, string> = {
  blue:   styles.tagBlue,
  mint:   styles.tagMint,
  straw:  styles.tagStraw,
  gray:   styles.tagGray,
  purple: styles.tagPurple,
};

const AV_CLASS: Record<string, string> = {
  ice:    styles.avIce,
  mint:   styles.avMint,
  straw:  styles.avStraw,
  purple: styles.avPurple,
};

const STATUS_CLASS: Record<string, string> = {
  active:   styles.stActive,
  pending:  styles.stPending,
  inactive: styles.stInactive,
};

const STATUS_LABEL: Record<string, string> = {
  active:   'Активен',
  pending:  'Ждёт',
  inactive: 'Давно',
};

interface RequestsScreenProps {
  onBack:   () => void;
  onChat:   (id: string) => void;
  onRequest:(id: string) => void;
}

export function RequestsScreen({ onBack: _onBack, onChat, onRequest }: RequestsScreenProps) {
  const [tab, setTab] = useState<'new' | 'mine'>('new');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const visible = REQUESTS.filter(r => !dismissed.has(r.id));

  return (
    <div className={styles.screen}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.tbTitle}>Ученики</div>
        <div className={styles.tbSub}>
          {visible.length} новых заявки · 4 своих ученика
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'new' ? styles.tabActive : ''}`}
          onClick={() => setTab('new')}
        >
          Новые<span className={styles.tabBadge}>{visible.length}</span>
        </button>
        <button
          className={`${styles.tab} ${tab === 'mine' ? styles.tabActive : ''}`}
          onClick={() => setTab('mine')}
        >
          Мои<span className={`${styles.tabBadge} ${styles.tabBadgeGreen}`}>4</span>
        </button>
      </div>

      <div className={styles.scroll}>

        {/* ── NEW REQUESTS ── */}
        {tab === 'new' && (
          <>
            <div className={`${styles.infoBanner} ${styles.infoBannerIce}`}>
              ⚡ Заявки с платформы — комиссия 5% при подтверждении
            </div>
            <div className={styles.reqList}>
              {visible.map(r => (
                <div key={r.id} className={styles.reqCard} onClick={() => onRequest(r.id)}>
                  <div className={styles.rcTop}>
                    <div>
                      <div className={styles.rcName}>{r.name}</div>
                      <span className={styles.lsPlat}>⚡ С платформы</span>
                    </div>
                    <div className={styles.rcTime}>{r.time}</div>
                  </div>

                  <div className={styles.rcTags}>
                    {r.tags.map(t => (
                      <span key={t.label} className={`${styles.tag} ${TAG_CLASS[t.color]}`}>
                        {t.label}
                      </span>
                    ))}
                  </div>

                  <div className={styles.rcMsg}>{r.msg}</div>

                  <div className={styles.rcFee}>
                    <span className={styles.rcFeeAmt}>
                      Стоимость: <strong>{r.price}</strong>
                    </span>
                    <span className={styles.rcFeeComm}>⚡ Комиссия {r.commission}</span>
                  </div>

                  <div className={styles.rcActions}>
                    <button
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={e => { e.stopPropagation(); setDismissed(s => new Set([...s, r.id])); }}
                    >
                      ✓ Принять
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={e => { e.stopPropagation(); onChat(r.id); }}
                    >
                      💬 Написать
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={e => { e.stopPropagation(); setDismissed(s => new Set([...s, r.id])); }}
                    >
                      Отказать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── MY STUDENTS ── */}
        {tab === 'mine' && (
          <>
            <div className={`${styles.infoBanner} ${styles.infoBannerMint}`}>
              ★ Свои ученики — без комиссии. Не публикуются в каталоге, отзывы видите только вы
            </div>

            <div className={styles.msaWrap} onClick={() => showToast('📲 Приглашение отправлено ученику по SMS')}>
              <div className={styles.msaIcon}>+</div>
              <div>
                <div className={styles.msaTitle}>Добавить своего ученика</div>
                <div className={styles.msaSub}>Отправим ему смс-приглашение с ссылкой на чат</div>
              </div>
            </div>

            <div className={styles.stuSectionLabel}>Активные</div>

            {STUDENTS.map(s => (
              <div key={s.id} className={styles.stuItem} onClick={() => onChat(s.id)}>
                <div
                  className={`${styles.av} ${AV_CLASS[s.color]}`}
                  style={s.dim ? { opacity: 0.6 } : undefined}
                >
                  {s.initials}
                </div>
                <div className={styles.stuInfo}>
                  <div className={styles.stuName}>{s.name}</div>
                  <div className={styles.stuMeta}>{s.meta}</div>
                  <div className={styles.stuStats}>
                    {s.stats.map(st => (
                      <div key={st} className={styles.stuStat}>{st}</div>
                    ))}
                  </div>
                </div>
                <span className={`${styles.stuStatus} ${STATUS_CLASS[s.status]}`}>
                  {STATUS_LABEL[s.status]}
                </span>
              </div>
            ))}

            <div className={styles.stuSectionLabel}>Неактивные</div>

            {INACTIVE_STUDENTS.map(s => (
              <div key={s.id} className={styles.stuItem} onClick={() => onChat(s.id)}>
                <div className={`${styles.av} ${AV_CLASS[s.color]}`}>{s.initials}</div>
                <div className={styles.stuInfo}>
                  <div className={styles.stuName}>{s.name}</div>
                  <div className={styles.stuMeta}>{s.meta}</div>
                  <div className={styles.stuStats}>
                    {s.stats.map(st => (
                      <div key={st} className={styles.stuStat}>{st}</div>
                    ))}
                  </div>
                </div>
                <span className={`${styles.stuStatus} ${STATUS_CLASS[s.status]}`}>
                  {STATUS_LABEL[s.status]}
                </span>
              </div>
            ))}
          </>
        )}

      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
