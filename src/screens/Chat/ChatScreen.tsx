import { useEffect, useRef, useState } from 'react';
import styles from './ChatScreen.module.css';
import { useTranslation } from '@/i18n/useTranslation';
import { Icon } from '@/components/Icon/Icon';

// ── Types ──────────────────────────────────────────────────────────────────

type MsgType = 'text' | 'card';

interface Message {
  id: string;
  from: 'in' | 'out';
  type: MsgType;
  text?: string;
  time: string;
  ticks?: string;
  card?: {
    date: string;
    format: string;
    place: string;
    price: string;
    accepted?: boolean;
  };
}

interface DaySep { kind: 'sep'; label: string; id: string; }
type ChatItem = Message | DaySep;

// ── Constants ──────────────────────────────────────────────────────────────

const PREVIEW_LIMIT = 3;

/**
 * Определяет, содержит ли строка российский номер телефона.
 *
 * Поддерживаемые форматы:
 *   +79821231212   79821231212   89821231212   9821231212
 *   +7 982 123 12 12   7-982-123-12-12   8 (982) 123-12-12
 *   982 123 12 12   9821231212   и любые их комбинации
 *
 * Алгоритм:
 *   1. Ищем любые «числоподобные» куски текста (цифры + разделители +/-/( ))
 *   2. Вырываем только цифры из каждого куска
 *   3. Проверяем, является ли результат валидным RU-номером:
 *      — 10 цифр, начинается с 9  (мобильный без кода)
 *      — 11 цифр, начинается с 7 или 8
 */
function hasPhone(text: string): boolean {
  const chunks = text.match(/[\+\d][\d\s\-\(\)\.]{6,18}\d/g) ?? [];
  return chunks.some(chunk => {
    const d = chunk.replace(/\D/g, '');
    return (
      (d.length === 10 && d[0] === '9') ||
      (d.length === 11 && (d[0] === '7' || d[0] === '8'))
    );
  });
}

const INITIAL: ChatItem[] = [
  { kind: 'sep', label: '25 апреля', id: 'sep1' },
  { id: 'm1', from: 'in',  type: 'text', text: 'Привет! Увидел вашу заявку — рад помочь с обучением 🏂 Расскажите о себе — вы совсем новичок или уже пробовали кататься?', time: '14:12' },
  { id: 'm2', from: 'out', type: 'text', text: 'Привет! Мы с женой абсолютные новички, никогда не стояли на доске.', time: '14:15', ticks: '✓✓' },
  {
    id: 'm3', from: 'in', type: 'card', time: '14:18',
    card: { date: '28 апреля, 10:00–12:00', format: 'Мини-группа (2 чел.)', place: 'Касса Шерегеш, вход А', price: '7 000 ₽' },
  },
  { id: 'm4', from: 'out', type: 'text', text: 'Отлично! Снаряжение нам нужно брать в аренду?', time: '14:31', ticks: '✓✓' },
  { id: 'm5', from: 'in',  type: 'text', text: 'Да, помогу подобрать в прокате прямо на месте. Приходите за 20 минут до начала.', time: '14:35' },
  { kind: 'sep', label: 'Сегодня', id: 'sep2' },
  { id: 'm6', from: 'out', type: 'text', text: 'Алексей, добрый день! Напоминаю — завтра в 10:00. Подтверждаете?', time: '09:14', ticks: '✓✓' },
];

const QUICK_REPLIES = [
  'Аренда снаряжения?',
  'Как добраться?',
  'Можно перенести?',
  'До встречи 👋',
];

// ── Props ──────────────────────────────────────────────────────────────────

export type BookingStatus = 'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED';

interface ChatScreenProps {
  onBack: () => void;
  onProfile?: () => void;
  onBook?: () => void;
  bookingStatus?: BookingStatus;   // default: 'PENDING'
  instructorPhone?: string;
  personName?: string;
  personInitials?: string;
  personAvColor?: string;          // 'ice' | 'mint' | 'blue' | 'straw' | 'purple' | 'coral'
  isInstructor?: boolean;          // true → no preview wall/limits (instructor-side view)
  onAcceptBooking?: () => void;    // инструктор принимает заявку из чата
  onDeclineBooking?: () => void;   // инструктор отклоняет заявку из чата
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * Экран приватного чата.
 * Preview-режим: максимум 3 исходящих сообщения суммарно (включая INITIAL),
 * затем — стена с кнопкой «Записаться».
 * Фильтр: телефонные номера блокируются до записи.
 * DECLINED: чат закрыт, показывается баннер «Заявка отклонена».
 * ACCEPTED: полный чат, кнопка «Позвонить» активна.
 */
export function ChatScreen({
  onBack,
  onProfile,
  onBook,
  bookingStatus = 'PENDING',
  instructorPhone,
  personName = 'Собеседник',
  personInitials = '?',
  personAvColor = 'ice',
  isInstructor = false,
  onAcceptBooking,
  onDeclineBooking,
}: ChatScreenProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ChatItem[]>(INITIAL);
  const [inputVal, setInputVal] = useState('');
  const [bookingVisible, setBookingVisible] = useState(true);
  const [typing, setTyping] = useState(false);
  // Если бронирование уже принято — карточка предложения сразу в состоянии «Принято»
  const [cardAccepted, setCardAccepted] = useState(() => bookingStatus === 'ACCEPTED');
  const [phoneBlocked, setPhoneBlocked] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Count ALL outgoing messages (including those in INITIAL history)
  const outMsgCount = items.filter(
    i => !('kind' in i) && (i as Message).from === 'out'
  ).length;

  const isAccepted = bookingStatus === 'ACCEPTED';
  const isDeclined = bookingStatus === 'DECLINED';
  // Preview restrictions apply only to guest side; instructors always have full access
  const previewExhausted = !isInstructor && !isAccepted && outMsgCount >= PREVIEW_LIMIT;
  const remaining = Math.max(0, PREVIEW_LIMIT - outMsgCount);

  function fireToast(msg: string) {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2500);
  }

  function handleCall() {
    if (!isAccepted) {
      fireToast('📞 Звонок откроется после подтверждения заявки');
      return;
    }
    const phone = instructorPhone ?? '+79000000000';
    window.location.href = phone.startsWith('tel:') ? phone : `tel:${phone}`;
  }

  // Scroll to bottom
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items, typing, previewExhausted]);

  function sendMsg(text?: string) {
    if (previewExhausted || isDeclined) return;
    const msg = (text ?? inputVal).trim();
    if (!msg) return;

    // Phone filter
    if (hasPhone(msg)) {
      setPhoneBlocked(true);
      return;
    }
    setPhoneBlocked(false);

    const newMsg: Message = {
      id: `m${Date.now()}`,
      from: 'out',
      type: 'text',
      text: msg,
      time: new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
      ticks: '✓',
    };
    setItems(prev => [...prev, newMsg]);
    setInputVal('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Typing indicator: show for 2-3 seconds after user sends a message
    setTyping(true);
    setTimeout(() => setTyping(false), 2500);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMsg();
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  return (
    <div className={styles.screen}>
      {/* ── Top bar ── */}
      <div className={styles.chatTop}>
        <button className={styles.tbBack} onClick={onBack} aria-label="Назад">‹</button>
        <div className={styles.avatarWrap}>
          <div className={`${styles.av} ${styles.avSm} ${styles[`av-${personAvColor}`]}`}>{personInitials}</div>
          <div className={styles.onlineDot} />
        </div>
        <div className={styles.ctInfo}>
          <div className={styles.ctName}>{personName}</div>
          <div className={styles.ctStatus}>{t('chat.online')} · Шерегеш</div>
        </div>
        <div className={styles.ctActions}>
          {onProfile && (
            <button className={styles.ctBtn} onClick={onProfile} aria-label="Профиль">
              <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/></svg>
            </button>
          )}
          <button
            className={styles.ctBtn}
            aria-label="Позвонить"
            onClick={handleCall}
            style={!isAccepted ? { opacity: 0.3 } : undefined}
          >
            <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.22 2.18 2 2 0 012.18 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.46-.46a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>
          </button>
        </div>
      </div>

      {/* ── Booking strip ── */}
      {bookingVisible && !isDeclined && (
        <div className={styles.bookingStrip}>
          <div className={styles.bsLeft}>
            <div className={styles.bsIcon}><Icon name="calendar" /></div>
            <div>
              <div className={styles.bsTitle}>{t('chat.bookingRequest')}</div>
              <div className={styles.bsSub}>28 апр · 10:00 · 2 ч · 7 000 ₽</div>
            </div>
          </div>
          <button className={styles.bsClose} onClick={() => setBookingVisible(false)}>✕</button>
        </div>
      )}

      {/* ── Preview banner (while not exhausted and not accepted) ── */}
      {!isAccepted && !isDeclined && !previewExhausted && outMsgCount > 0 && (
        <div className={styles.previewBanner}>
          <span className={styles.previewBannerText}>
            Предпросмотр: осталось {remaining} {remaining === 1 ? 'сообщение' : 'сообщения'}
          </span>
        </div>
      )}

      {/* ── DECLINED banner ── */}
      {isDeclined ? (
        <div className={styles.declinedBanner}>
          <div className={styles.declinedIcon}>✕</div>
          <div className={styles.declinedTitle}>Заявка отклонена</div>
          <div className={styles.declinedSub}>
            Инструктор не смог принять запрос. Попробуйте найти другого специалиста в каталоге.
          </div>
          <button className={styles.declinedBtn} onClick={onBack}>
            Найти другого →
          </button>
        </div>
      ) : (
        <>
          {/* ── Messages ── */}
          <div className={styles.messages} ref={messagesRef}>
            {items.map(item => {
              if ('kind' in item) {
                return (
                  <div key={item.id} className={styles.daySep}>{item.label}</div>
                );
              }

              const msg = item as Message;

              // INITIAL хранит перспективу гостя: 'in' = инструктор, 'out' = ученик.
              // Для инструктора переворачиваем: его сообщения → вправо, ученика → влево.
              const dir: 'in' | 'out' = isInstructor
                ? (msg.from === 'in' ? 'out' : 'in')
                : msg.from;

              if (msg.type === 'card' && msg.card) {
                // Карточка отправлена инструктором (from:'in' в гостевой перспективе).
                // У инструктора — справа (outgoing), у гостя — слева с аватаром АМ.
                const cardDir = isInstructor ? 'out' : 'in';
                return (
                  <div key={msg.id} className={`${styles.mrow} ${cardDir === 'out' ? styles.mrowOut : ''}`}>
                    {cardDir === 'in' && (
                      <div className={`${styles.av} ${styles.avSm} ${styles['av-ice']}`}>АМ</div>
                    )}
                    <div>
                      <div className={styles.cardBubble}>
                        <div className={styles.cbHead}>
                          <div className={styles.cbHeadT}><Icon name="file-text" size={13} /> {t('chat.lessonProposal')}</div>
                        </div>
                        <div className={styles.cbBody}>
                          <div className={styles.cbRow}><span>{t('chat.date')}</span><span>{msg.card.date}</span></div>
                          <div className={styles.cbRow}><span>{t('chat.format')}</span><span>{msg.card.format}</span></div>
                          <div className={styles.cbRow}><span>{t('chat.place')}</span><span>{msg.card.place}</span></div>
                          <div className={`${styles.cbRow} ${styles.cbRowPrice}`}>
                            <span>{t('chat.cost')}</span>
                            <span className={styles.cbPrice}>{msg.card.price}</span>
                          </div>
                        </div>
                        {isInstructor ? (
                          cardAccepted ? (
                            <div className={`${styles.cbActions} ${styles.cbAcceptedLabel}`}>
                              ✓ {t('chat.accepted')}
                            </div>
                          ) : (
                            // Инструктор может принять или отклонить прямо из чата
                            <div className={styles.cbActions}>
                              <button
                                className={`${styles.cbBtn} ${styles.cbAccept}`}
                                onClick={() => {
                                  setCardAccepted(true);
                                  onAcceptBooking?.();
                                  fireToast('✓ Заявка принята');
                                }}
                              >
                                ✓ Принять
                              </button>
                              <button
                                className={`${styles.cbBtn} ${styles.cbDecline}`}
                                onClick={() => {
                                  onDeclineBooking?.();
                                  fireToast('Заявка отклонена');
                                  onBack();
                                }}
                              >
                                Отказать
                              </button>
                            </div>
                          )
                        ) : (
                          <>
                            {!cardAccepted && (
                              <div className={styles.cbActions}>
                                <button className={`${styles.cbBtn} ${styles.cbAccept}`} onClick={() => setCardAccepted(true)}>
                                  ✓ {t('chat.accept')}
                                </button>
                                <button className={`${styles.cbBtn} ${styles.cbDecline}`} onClick={() => fireToast('✓ Запрос на другое время отправлен')}>
                                  {t('chat.propose')}
                                </button>
                              </div>
                            )}
                            {cardAccepted && (
                              <div className={`${styles.cbActions} ${styles.cbAcceptedLabel}`}>
                                ✓ {t('chat.accepted')}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <span className={styles.mt}>{msg.time}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`${styles.mrow} ${dir === 'out' ? styles.mrowOut : ''}`}>
                  {dir === 'in' && (
                    // Входящее: у гостя это инструктор (АМ), у инструктора это ученик
                    <div className={`${styles.av} ${styles.avSm} ${isInstructor ? styles[`av-${personAvColor}`] : styles['av-ice']}`}>
                      {isInstructor ? personInitials : 'АМ'}
                    </div>
                  )}
                  <div>
                    <div className={`${styles.bubble} ${dir === 'in' ? styles.bubbleIn : styles.bubbleOut}`}>
                      {msg.text}
                    </div>
                    <span className={styles.mt}>{msg.time}{msg.ticks ? ` ${msg.ticks}` : ''}</span>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator — у инструктора это ученик печатает, у гостя — инструктор */}
            {typing && !previewExhausted && (
              <div className={styles.mrow}>
                <div className={`${styles.av} ${styles.avSm} ${isInstructor ? styles[`av-${personAvColor}`] : styles['av-ice']}`}>
                  {isInstructor ? personInitials : 'АМ'}
                </div>
                <div className={styles.typingBubble}>
                  <div className={styles.td} /><div className={styles.td} /><div className={styles.td} />
                </div>
              </div>
            )}

            {/* Preview wall */}
            {previewExhausted && (
              <div className={styles.previewWall}>
                <div className={styles.previewWallIcon}><Icon name="lock" size={32} /></div>
                <div className={styles.previewWallTitle}>Предпросмотр завершён</div>
                <div className={styles.previewWallSub}>
                  Запишитесь на занятие, чтобы продолжить общение с инструктором
                </div>
                {onBook && (
                  <button className={styles.previewWallBtn} onClick={onBook}>
                    Записаться →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Quick replies ── */}
          {!previewExhausted && (
            <div className={styles.quickReplies}>
              {QUICK_REPLIES.map(qr => (
                <button key={qr} className={styles.qr} onClick={() => sendMsg(qr)}>
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* ── Phone warning ── */}
          {phoneBlocked && (
            <div className={styles.phoneWarning}>
              📵 Обмен контактами недоступен до записи на занятие
              <button className={styles.phoneWarningClose} onClick={() => setPhoneBlocked(false)}>✕</button>
            </div>
          )}

          {/* ── Input ── */}
          {previewExhausted ? (
            <div className={styles.lockedBar}>
              <div className={styles.lockedBarText}><Icon name="lock" size={14} /> Запишитесь, чтобы продолжить переписку</div>
              {onBook && (
                <button className={styles.lockedBarBtn} onClick={onBook}>Записаться</button>
              )}
            </div>
          ) : (
            <div className={styles.inputWrap}>
              <>
              <input
                type="file"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                id="chat-attach"
                onChange={e => {
                  if (e.target.files?.[0]) {
                    const name = e.target.files[0].name;
                    fireToast('📎 Прикреплён: ' + name);
                    e.target.value = '';
                  }
                }}
              />
              <button
                className={styles.attachBtn}
                aria-label="Прикрепить"
                onClick={() => document.getElementById('chat-attach')?.click()}
              >
                <svg viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
              </button>
              </>
              <textarea
                ref={textareaRef}
                className={styles.chatInput}
                placeholder={t('chat.placeholder')}
                rows={1}
                value={inputVal}
                onChange={e => {
                  setInputVal(e.target.value);
                  autoResize(e.target);
                  if (phoneBlocked) setPhoneBlocked(false);
                }}
                onKeyDown={handleKeyDown}
              />
              <button className={styles.sendBtn} onClick={() => sendMsg()} aria-label="Отправить">
                <svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/></svg>
              </button>
            </div>
          )}
        </>
      )}

      {showToast && (
        <div className={styles.toast} onClick={() => setShowToast(null)}>
          {showToast}
        </div>
      )}
    </div>
  );
}
