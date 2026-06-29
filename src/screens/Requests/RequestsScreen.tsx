import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import styles from './RequestsScreen.module.css';
import { applyPhoneMask } from '@/utils/phoneMask';
import { useTabSwipe } from '@/hooks/useTabSwipe';
import { getCommission, MONTH_SHORT } from '@/store/bookings';
import {
  getBookings,
  acceptBooking as apiAccept,
  declineBooking as apiDecline,
  type BookingDTO,
} from '@/lib/api';
import { shortStudentName } from '@/lib/displayName';
import { MASTER_CLASSES } from '@/screens/MasterClass/masterClassData';

// Мастер-классы текущего инструктора берём из мока по этому id (МК ещё на моках).
const CURRENT_INSTRUCTOR_ID = 'aleksey';

const AV_KEYS = ['ice', 'mint', 'straw', 'purple'] as const;
function initialsOf(name: string): string {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?';
}
function avColorFor(id: string): typeof AV_KEYS[number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AV_KEYS[h % AV_KEYS.length];
}
function lessonDateLabel(b: BookingDTO): string {
  const d = new Date(`${b.date}T00:00:00`);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} · ${b.startTime}–${b.endTime}`;
}
const formatLabelOf = (b: BookingDTO) => (b.format === 'mini_group' ? 'Мини-группа' : 'Индивидуально');

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
  onMasterClass: (id: string) => void;
  onMcGroupChat: (id: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function RequestsScreen({ onBack, onChat, onRequest, onMasterClass, onMcGroupChat }: RequestsScreenProps) {
  const [tab, setTab] = useState<'new' | 'mine' | 'mc'>('new');
  const [toast, setToast] = useState<string | null>(null);
  const [tabAnimDir, setTabAnimDir] = useState<'left' | 'right' | null>(null);
  const [tabAnimKey, setTabAnimKey] = useState(0);

  const REQ_TABS = ['new', 'mine', 'mc'] as const;
  const { onTouchStart: swipeTouchStart, onTouchEnd: swipeTouchEnd } = useTabSwipe(
    REQ_TABS, tab,
    (t, dir) => { setTabAnimDir(dir); setTabAnimKey(k => k + 1); setTab(t); },
  );
  const [showInvite, setShowInvite] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteDragY, setInviteDragY] = useState(0);
  const [inviteDragging, setInviteDragging] = useState(false);
  const inviteStartY = useRef(0);

  function closeInvite() {
    setShowInvite(false);
    setInvitePhone('');
    setInviteName('');
    setInviteDragY(0);
  }

  function onInviteTouchStart(e: React.TouchEvent) {
    inviteStartY.current = e.touches[0].clientY;
    setInviteDragging(true);
  }
  function onInviteTouchMove(e: React.TouchEvent) {
    const d = e.touches[0].clientY - inviteStartY.current;
    if (d > 0) setInviteDragY(d);
  }
  function onInviteTouchEnd() {
    setInviteDragging(false);
    if (inviteDragY >= 100) closeInvite();
    else setInviteDragY(0);
  }

  // Реальные заявки инструктора с сервера (GET /api/bookings → instructor → входящие).
  const queryClient = useQueryClient();
  const { data: serverBookings = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['bookings'],
    queryFn: getBookings,
  });
  const pending  = serverBookings.filter(b => b.status === 'PENDING');
  const accepted = serverBookings.filter(b => b.status === 'ACCEPTED');

  const [processingId, setProcessingId] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleAccept(id: string) {
    setProcessingId(id);
    const res = await apiAccept(id);
    setProcessingId(null);
    await queryClient.invalidateQueries({ queryKey: ['bookings'] });
    if (res.ok) {
      const n = res.declinedIds.length;
      showToast(n > 0
        ? `✓ Принято; ${n} ${n === 1 ? 'конфликтующая заявка отклонена' : 'конфликтующих заявок отклонено'}`
        : '✓ Заявка принята');
    } else {
      showToast(res.code === 'NOT_PENDING' ? 'Заявку уже обработали' : (res.error || 'Не удалось принять'));
    }
  }

  async function handleDecline(id: string) {
    setProcessingId(id);
    const res = await apiDecline(id);
    setProcessingId(null);
    await queryClient.invalidateQueries({ queryKey: ['bookings'] });
    showToast(res.ok ? 'Заявка отклонена' : (res.error || 'Не удалось отклонить'));
  }

  // Принятые брони с платформы → «ученики» для вкладки «Мои» (имя — короткая форма).
  const acceptedStudents = accepted.map(b => {
    const name = shortStudentName(b.counterpartyName, b.counterpartyPhone);
    return {
      id:       b.id,
      initials: initialsOf(name),
      color:    avColorFor(b.id),
      name,
      meta:     `${formatLabelOf(b)} · ${lessonDateLabel(b)}`,
      stats:    [`${(b.price ?? 0).toLocaleString('ru')} ₽`],
      status:   'active' as const,
    };
  });

  const totalStudents = OWN_STUDENTS.length + OWN_STUDENTS_INACTIVE.length + acceptedStudents.length;

  // Мастер-классы текущего инструктора
  const myMasterClasses = MASTER_CLASSES.filter(mc => mc.instructorId === CURRENT_INSTRUCTOR_ID);

  return (
    <div className={styles.screen}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.tbRow}>
          {onBack && <button className={styles.tbBack} onClick={onBack}>‹</button>}
          <div>
            <div className={styles.tbTitle}>Ученики</div>
            <div className={styles.tbSub}>
              {pending.length} новых {pending.length === 1 ? 'заявка' : pending.length < 5 ? 'заявки' : 'заявок'} · {totalStudents} своих ученика
            </div>
          </div>
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
        <button
          className={`${styles.tab} ${tab === 'mc' ? styles.tabActive : ''}`}
          onClick={() => setTab('mc')}
        >
          Мои МК<span className={`${styles.tabBadge} ${styles.tabBadgeAccent}`}>{myMasterClasses.length}</span>
        </button>
      </div>

      <div className={styles.scroll} onTouchStart={swipeTouchStart} onTouchEnd={swipeTouchEnd}>

        {/* ── NEW REQUESTS ── */}
        {tab === 'new' && (
          <div
            key={tabAnimKey}
            style={{ animation: tabAnimDir ? `${tabAnimDir === 'left' ? 'tabSlideLeft' : 'tabSlideRight'} 200ms cubic-bezier(0.25,0.46,0.45,0.94) both` : undefined }}
          >
          <>
            <div className={`${styles.infoBanner} ${styles.infoBannerIce}`}>
              Заявки с платформы — комиссия 5% при подтверждении
            </div>

            {isLoading && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>
                Загрузка заявок…
              </div>
            )}
            {isError && (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>
                Не удалось загрузить заявки
                <div style={{ marginTop: 12 }}>
                  <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => refetch()}>Повторить</button>
                </div>
              </div>
            )}
            {!isLoading && !isError && pending.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>
                Новых заявок нет
              </div>
            )}

            <div className={styles.reqList}>
              {pending.map(b => {
                const name = shortStudentName(b.counterpartyName, b.counterpartyPhone);
                const busy = processingId === b.id;
                return (
                <div key={b.id} className={styles.reqCard} onClick={() => onRequest(b.id)}>
                  <div className={styles.rcTop}>
                    <div>
                      <div className={styles.rcName}>{name}</div>
                      <span className={styles.lsPlat}>С платформы</span>
                    </div>
                    <div className={styles.rcTime}>{lessonDateLabel(b)}</div>
                  </div>

                  <div className={styles.rcTags}>
                    <span className={`${styles.tag} ${TAG_CLASS.blue}`}>{formatLabelOf(b)}</span>
                    <span className={`${styles.tag} ${TAG_CLASS.gray}`}>{b.startTime}–{b.endTime}</span>
                  </div>

                  <div className={styles.rcFee}>
                    <span className={styles.rcFeeAmt}>
                      Стоимость: <strong>{(b.price ?? 0).toLocaleString('ru')} ₽</strong>
                    </span>
                    <span className={styles.rcFeeComm}>Комиссия {(b.commission ?? getCommission(b.price ?? 0)).toLocaleString('ru')} ₽</span>
                  </div>

                  <div className={styles.rcActions}>
                    <button
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      disabled={busy}
                      onClick={e => { e.stopPropagation(); handleAccept(b.id); }}
                    >
                      {busy ? '…' : 'Принять'}
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={e => { e.stopPropagation(); onChat(b.id); }}
                    >
                      Написать
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      disabled={busy}
                      onClick={e => { e.stopPropagation(); handleDecline(b.id); }}
                    >
                      Отказать
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
          </>
          </div>
        )}

        {/* ── MY STUDENTS ── */}
        {tab === 'mine' && (
          <div
            key={tabAnimKey}
            style={{ animation: tabAnimDir ? `${tabAnimDir === 'left' ? 'tabSlideLeft' : 'tabSlideRight'} 200ms cubic-bezier(0.25,0.46,0.45,0.94) both` : undefined }}
          >
          <>
            <div className={`${styles.infoBanner} ${styles.infoBannerMint}`}>
              Свои ученики — без комиссии. Не публикуются в каталоге, отзывы видите только вы
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
          </div>
        )}

        {/* ── MY MASTER CLASSES ── */}
        {tab === 'mc' && (
          <div
            key={tabAnimKey}
            style={{ animation: tabAnimDir ? `${tabAnimDir === 'left' ? 'tabSlideLeft' : 'tabSlideRight'} 200ms cubic-bezier(0.25,0.46,0.45,0.94) both` : undefined }}
          >
          <>
            <div className={`${styles.infoBanner} ${styles.infoBannerIce}`}>
              Ваши мастер-классы — групповые занятия с фиксированной датой
            </div>

            {myMasterClasses.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 14 }}>
                У вас пока нет мастер-классов
              </div>
            ) : (
              <div className={styles.mcList}>
                {myMasterClasses.map(mc => {
                  const count     = mc.participants.length;
                  const pct       = Math.round((count / mc.maxParticipants) * 100);
                  const confirmed = count >= mc.minParticipants;
                  return (
                    <div key={mc.id} className={styles.mcCard} onClick={() => onMasterClass(mc.id)}>
                      <div className={styles.mcCardTop}>
                        <div className={styles.mcTitle}>{mc.title}</div>
                        <span className={`${styles.mcStatus} ${confirmed ? styles.mcStatusOk : styles.mcStatusWait}`}>
                          {confirmed ? 'Группа набрана' : 'Идёт набор'}
                        </span>
                      </div>
                      <div className={styles.mcMeta}>{mc.weekday}, {mc.date} · {mc.time}</div>
                      <div className={styles.mcMeta}>{mc.location}</div>

                      <div className={styles.mcBar}>
                        <div className={styles.mcBarFill} style={{ width: `${pct}%` }} />
                      </div>
                      <div className={styles.mcStats}>
                        <span>{count} / {mc.maxParticipants} участников</span>
                        <span>{confirmed ? '✓ минимум набран' : `минимум ${mc.minParticipants}`}</span>
                      </div>

                      <div className={styles.mcActions}>
                        <button
                          className={`${styles.btn} ${styles.btnSecondary}`}
                          onClick={e => { e.stopPropagation(); onMcGroupChat(mc.id); }}
                        >
                          Чат группы
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnPrimary}`}
                          onClick={e => { e.stopPropagation(); onMasterClass(mc.id); }}
                        >
                          Подробнее
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
          </div>
        )}

      </div>

      {toast && <div className={styles.toast}>{toast}</div>}

      {/* ── Invite bottom sheet ── */}
      {showInvite && (
        <div
          className={styles.inviteOverlay}
          style={{ opacity: Math.max(0, 1 - inviteDragY / 300) }}
          onClick={e => { if (e.target === e.currentTarget) closeInvite(); }}
        >
          <div
            className={styles.inviteBox}
            style={{
              transform: `translateY(${inviteDragY}px)`,
              transition: inviteDragging ? 'none' : 'transform .3s ease',
            }}
            onTouchStart={onInviteTouchStart}
            onTouchMove={onInviteTouchMove}
            onTouchEnd={onInviteTouchEnd}
          >
            <div className={styles.inviteHandle} />
            <div className={styles.inviteTitle}>Добавить ученика</div>
            <div className={styles.inviteField}>
              <label className={styles.inviteLabel}>Имя</label>
              <input
                className="input-field input-field--left"
                type="text"
                placeholder="Например, Иван"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
              />
            </div>
            <div className={styles.inviteField}>
              <label className={styles.inviteLabel}>Номер телефона</label>
              <input
                className="input-field input-field--left"
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={invitePhone}
                maxLength={18}
                onFocus={e => { if (!e.target.value) setInvitePhone('+7'); }}
                onChange={e => setInvitePhone(applyPhoneMask(e.target.value))}
              />
            </div>
            <div className={styles.inviteHint}>
              Ученик получит SMS со ссылкой на чат с вами. Занятия с ним проходят без комиссии платформы.
            </div>
            <button
              className={styles.inviteBtnPrimary}
              disabled={!invitePhone.trim()}
              onClick={() => {
                closeInvite();
                showToast('Приглашение отправлено по SMS');
              }}
            >Отправить</button>
            <button className={styles.inviteBtnSecondary} onClick={closeInvite}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
