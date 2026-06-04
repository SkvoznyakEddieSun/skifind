import { useState } from 'react';
import styles from './RequestsScreen.module.css';
import {
  getPendingRequests,
  getAcceptedLessons,
  acceptBooking,
  declineBooking,
  getCommission,
} from '@/store/bookings';
import type { Booking } from '@/store/bookings';

// ── Pre-existing "own" students (без комиссии, добавлены до платформы) ──────

interface OwnStudent {
  id: string;
  initials: string;
  color: 'ice' | 'mint' | 'straw' | 'purple';
  name: string;
  meta: string;
  stats: string[];
  status: 'active' | 'pending' | 'inactive';
  dim?: boolean;
}

const OWN_STUDENTS: OwnStudent[] = [
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

const OWN_STUDENTS_INACTIVE: OwnStudent[] = [
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

// ── Helpers ────────────────────────────────────────────────────────────────

const DISCIPLINE_LABEL: Record<string, string> = {
  ski:   'Горные лыжи',
  board: 'Сноуборд',
};

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

// ── Props ──────────────────────────────────────────────────────────────────

interface RequestsScreenProps {
  onBack:    () => void;
  onChat:    (id: string) => void;
  onRequest: (id: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function RequestsScreen({ onBack: _onBack, onChat, onRequest }: RequestsScreenProps) {
  const [tab, setTab] = useState<'new' | 'mine'>('new');
  const [toast, setToast] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteName, setInviteName] = useState('');

  // Читаем из хранилища; локальный state для реакции на изменения
  const [pending,  setPending]  = useState<Booking[]>(() => getPendingRequests('aleksey'));
  const [accepted, setAccepted] = useState<Booking[]>(() => getAcceptedLessons('aleksey'));

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleAccept(id: string) {
    acceptBooking(id);
    setPending(getPendingRequests('aleksey'));
    setAccepted(getAcceptedLessons('aleksey'));
    showToast('✓ Заявка принята — ученик добавлен в список');
  }

  function handleDecline(id: string) {
    declineBooking(id);
    setPending(getPendingRequests('aleksey'));
    showToast('Заявка отклонена');
  }

  // Принятые заявки с платформы → превращаем в «учеников» для вкладки «Мои»
  const acceptedStudents = accepted.map(b => ({
    id:       b.id,
    initials: b.studentInitials,
    color:    b.studentColor,
    name:     b.studentName,
    meta:     `${DISCIPLINE_LABEL[b.discipline] ?? b.discipline} · ${b.dayNum} ${b.dayMon} ${b.timeStart}`,
    stats:    [`${b.formatLabel}`, `${b.dayNum} ${b.dayMon} · ${b.timeStart} — ${b.timeEnd}`],
    status:   'active' as const,
  }));

  const totalStudents = OWN_STUDENTS.length + OWN_STUDENTS_INACTIVE.length + acceptedStudents.length;

  return (
    <div className={styles.screen}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.tbTitle}>Ученики</div>
        <div className={styles.tbSub}>
          {pending.length} новых {pending.length === 1 ? 'заявка' : pending.length < 5 ? 'заявки' : 'заявок'} · {totalStudents} своих ученика
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'new' ? styles.tabActive : ''}`}
          onClick={() => setTab('new')}
        >
          Новые<span className={styles.tabBadge}>{pending.length}</span>
        </button>
        <button
          className={`${styles.tab} ${tab === 'mine' ? styles.tabActive : ''}`}
          onClick={() => setTab('mine')}
        >
          Мои<span className={`${styles.tabBadge} ${styles.tabBadgeGreen}`}>{totalStudents}</span>
        </button>
      </div>

      <div className={styles.scroll}>

        {/* ── NEW REQUESTS ── */}
        {tab === 'new' && (
          <>
            <div className={`${styles.infoBanner} ${styles.infoBannerIce}`}>
              ⚡ Заявки с платформы — комиссия 5% при подтверждении
            </div>

            {pending.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>
                Новых заявок нет
              </div>
            )}

            <div className={styles.reqList}>
              {pending.map(r => (
                <div key={r.id} className={styles.reqCard} onClick={() => onRequest(r.id)}>
                  <div className={styles.rcTop}>
                    <div>
                      <div className={styles.rcName}>{r.studentName}</div>
                      <span className={styles.lsPlat}>⚡ С платформы</span>
                    </div>
                    <div className={styles.rcTime}>{r.createdAt}</div>
                  </div>

                  <div className={styles.rcTags}>
                    <span className={`${styles.tag} ${TAG_CLASS.blue}`}>
                      {DISCIPLINE_LABEL[r.discipline] ?? r.discipline}
                    </span>
                    <span className={`${styles.tag} ${r.format === 'kids' ? TAG_CLASS.purple : TAG_CLASS.mint}`}>
                      {r.level}
                    </span>
                    <span className={`${styles.tag} ${TAG_CLASS.gray}`}>
                      {r.dayNum} {r.dayMon} · {r.timeStart}
                    </span>
                  </div>

                  {r.message ? (
                    <div className={styles.rcMsg}>«{r.message}»</div>
                  ) : null}

                  <div className={styles.rcFee}>
                    <span className={styles.rcFeeAmt}>
                      Стоимость: <strong>{r.price.toLocaleString('ru')} ₽</strong>
                    </span>
                    <span className={styles.rcFeeComm}>⚡ Комиссия {getCommission(r.price).toLocaleString('ru')} ₽</span>
                  </div>

                  <div className={styles.rcActions}>
                    <button
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={e => { e.stopPropagation(); handleAccept(r.id); }}
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
                      onClick={e => { e.stopPropagation(); handleDecline(r.id); }}
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

            <div className={styles.msaWrap} onClick={() => setShowInvite(true)}>
              <div className={styles.msaIcon}>+</div>
              <div className={styles.msaText}>
                <div className={styles.msaTitle}>Добавить своего ученика</div>
                <div className={styles.msaSub}>Отправим смс-приглашение с ссылкой на чат</div>
              </div>
              <span className={styles.msaArrow}>›</span>
            </div>

            {/* Принятые с платформы */}
            {acceptedStudents.length > 0 && (
              <>
                <div className={styles.stuSectionLabel}>С платформы ⚡</div>
                {acceptedStudents.map(s => (
                  <div key={s.id} className={styles.stuItem} onClick={() => onChat(s.id)}>
                    <div className={`${styles.av} ${AV_CLASS[s.color] ?? styles.avIce}`}>
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
                    <span className={`${styles.stuStatus} ${STATUS_CLASS.active}`}>
                      {STATUS_LABEL.active}
                    </span>
                  </div>
                ))}
              </>
            )}

            <div className={styles.stuSectionLabel}>Активные</div>

            {OWN_STUDENTS.map(s => (
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

            {OWN_STUDENTS_INACTIVE.map(s => (
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

      {/* ── Invite bottom sheet ── */}
      {showInvite && (
        <div className={styles.inviteOverlay} onClick={() => setShowInvite(false)}>
          <div className={styles.inviteBox} onClick={e => e.stopPropagation()}>
            <div className={styles.inviteTitle}>Добавить ученика</div>
            <div className={styles.inviteField}>
              <label className={styles.inviteLabel}>Имя</label>
              <input
                className={styles.inviteInput}
                type="text"
                placeholder="Например, Иван"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles.inviteField}>
              <label className={styles.inviteLabel}>Номер телефона</label>
              <input
                className={styles.inviteInput}
                type="tel"
                placeholder="+7 900 000 00 00"
                value={invitePhone}
                onChange={e => setInvitePhone(e.target.value)}
              />
            </div>
            <div className={styles.inviteHint}>
              Ученик получит SMS со ссылкой на чат с вами. Занятия с ним проходят без комиссии платформы.
            </div>
            <div className={styles.inviteActions}>
              <button
                className={styles.inviteBtnSecondary}
                onClick={() => { setShowInvite(false); setInvitePhone(''); setInviteName(''); }}
              >Отмена</button>
              <button
                className={styles.inviteBtnPrimary}
                disabled={!invitePhone.trim()}
                onClick={() => {
                  setShowInvite(false);
                  setInvitePhone('');
                  setInviteName('');
                  showToast('📲 Приглашение отправлено по SMS');
                }}
              >Отправить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
