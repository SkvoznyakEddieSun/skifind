import { useState } from 'react';
import { BottomNav } from './components/BottomNav/BottomNav';
import { SwipeBack } from './components/SwipeBack/SwipeBack';

// Auth
import { AuthScreen }      from './screens/Auth/AuthScreen';
import { PhoneAuthScreen } from './screens/PhoneAuth/PhoneAuthScreen';
import { SmsCodeScreen }   from './screens/SmsCode/SmsCodeScreen';

// Instructor tabs
import { DashboardScreen }    from './screens/Dashboard/DashboardScreen';
import { RequestsScreen }     from './screens/Requests/RequestsScreen';
import { ScheduleScreen }     from './screens/Schedule/ScheduleScreen';
import { ChatListScreen }     from './screens/ChatList/ChatListScreen';
import { InstrProfileScreen } from './screens/InstrProfile/InstrProfileScreen';

// Guest tabs
import { CatalogScreen, INSTRUCTORS } from './screens/Catalog/CatalogScreen';
import type { Instructor }           from './screens/Catalog/CatalogScreen';
import { BookingsScreen }     from './screens/Bookings/BookingsScreen';
import { GuestProfileScreen } from './screens/GuestProfile/GuestProfileScreen';

// Overlays (shared)
import { BalanceScreen }         from './screens/Balance/BalanceScreen';
import { ReviewsScreen }         from './screens/Reviews/ReviewsScreen';
import { ChatScreen }            from './screens/Chat/ChatScreen';
import type { BookingStatus }   from './screens/Chat/ChatScreen';
import { CommunityScreen }       from './screens/Community/CommunityScreen';
import { NotificationsScreen }   from './screens/Notifications/NotificationsScreen';
import { RegisterScreen }        from './screens/Register/RegisterScreen';
import { ProfileScreen }         from './screens/Profile/ProfileScreen';
import { LessonDetailScreen }    from './screens/LessonDetail/LessonDetailScreen';
import { RequestDetailScreen }   from './screens/RequestDetail/RequestDetailScreen';
import { BookSlotScreen }           from './screens/BookSlot/BookSlotScreen';
import { MasterClassCatalogScreen } from './screens/MasterClass/MasterClassCatalogScreen';
import { MasterClassDetailScreen }  from './screens/MasterClass/MasterClassDetailScreen';
import { MasterClassCreateScreen }  from './screens/MasterClass/MasterClassCreateScreen';
import { GroupChatScreen }          from './screens/GroupChat/GroupChatScreen';
import { MASTER_CLASSES }           from './screens/MasterClass/masterClassData';
import { getPendingRequests, getBookingById, acceptBooking, declineBooking, completeBooking } from './store/bookings';
import { StudentProfileScreen }     from './screens/StudentProfile/StudentProfileScreen';
import { getStudentProfileByName }  from './screens/StudentProfile/studentData';

// ── Types ──────────────────────────────────────────────────────────────────

type Role     = 'instructor' | 'guest';
type InstrTab = 'dashboard' | 'requests' | 'chat' | 'calendar' | 'profile';
type GuestTab = 'catalog'   | 'bookings' | 'chat' | 'profile';

type Screen =
  | 'auth' | 'phone' | 'sms'
  | 'instr' | 'guest'
  | 'balance' | 'reviews' | 'chat' | 'community'
  | 'notifications' | 'register' | 'instr-profile' | 'my-profile'
  | 'lesson-detail' | 'request-detail' | 'book-slot'
  | 'mc-catalog' | 'mc-detail' | 'mc-create' | 'mc-group-chat'
  | 'student-profile'
  | 'notif-chat' | 'notif-requests' | 'notif-bookings';

// ── Nav configs ─────────────────────────────────────────────────────────────

const INSTR_NAV = [
  { id: 'dashboard', label: 'Главная',    icon: 'home'     as const },
  { id: 'requests',  label: 'Заявки',     icon: 'requests' as const, badge: 3 },
  { id: 'chat',      label: 'Чат',        icon: 'chat'     as const, badge: 2 },
  { id: 'calendar',  label: 'Расписание', icon: 'calendar' as const },
  { id: 'profile',   label: 'Профиль',    icon: 'profile'  as const },
];

const GUEST_NAV = [
  { id: 'catalog',  label: 'Найти',   icon: 'search'   as const },
  { id: 'bookings', label: 'Занятия', icon: 'bookings' as const },
  { id: 'chat',     label: 'Чат',     icon: 'chat'     as const, badge: 1 },
  { id: 'profile',  label: 'Профиль', icon: 'profile'  as const },
];

const shellStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
};

// ── Part 1: Сессионный ID гостя ────────────────────────────────────────────
// Генерируется при первом открытии и сохраняется навсегда (до явного логаута).
void (localStorage.getItem('guestId') ?? (() => {
  localStorage.setItem('guestId', crypto.randomUUID());
})());

// ── App ─────────────────────────────────────────────────────────────────────

export function App() {
  const [stack, setStack]       = useState<Screen[]>(['auth']);
  const [role, setRole]         = useState<Role>('instructor');
  const [instrTab, setInstrTab] = useState<InstrTab>('dashboard');
  const [guestTab, setGuestTab] = useState<GuestTab>('catalog');
  const [phone, setPhone]           = useState('');
  const [activeMcId, setActiveMcId] = useState('mc1');
  const [chatBookingStatus, setChatBookingStatus] = useState<BookingStatus>('PENDING');
  const [chatInstructorPhone, setChatInstructorPhone] = useState<string | undefined>(undefined);
  const [chatPersonName, setChatPersonName] = useState('');
  const [chatPersonInitials, setChatPersonInitials] = useState('');
  const [chatPersonAvColor, setChatPersonAvColor] = useState('ice');
  const [chatPersonHasProfile, setChatPersonHasProfile] = useState(false);
  const [chatPersonProfileType, setChatPersonProfileType] = useState<'instructor' | 'student'>('instructor');
  const [chatIsInstructor, setChatIsInstructor] = useState(false);
  const [activeChatBookingId, setActiveChatBookingId] = useState('');
  const [activeStudentId, setActiveStudentId] = useState('');
  const [activeInstructor, setActiveInstructor] = useState<Instructor>(INSTRUCTORS[0]);
  const [joinedMcIds, setJoinedMcIds]   = useState<Set<string>>(new Set());
  const [blockedIds, setBlockedIds]     = useState<Set<string>>(new Set());
  const [favorites, setFavorites]       = useState<Set<string>>(new Set());
  const [activeRequestId, setActiveRequestId] = useState<string>('');
  const [activeLessonId,  setActiveLessonId]  = useState<string>('');

  /** Open chat pre-filled with the active instructor's identity (always guest-side). */
  function openInstrChat() {
    setChatPersonName(activeInstructor.name);
    setChatPersonInitials(activeInstructor.initials);
    setChatPersonAvColor(activeInstructor.avatarColor);
    setChatPersonHasProfile(true);
    setChatPersonProfileType('instructor');
    setChatIsInstructor(false);   // гость смотрит на инструктора
    push('chat');
  }

  /** Open instructor-side chat with a student by booking id. */
  function openStudentChat(bookingId: string) {
    const b = getBookingById(bookingId);
    const profile = b ? getStudentProfileByName(b.studentName) : undefined;
    if (b && !profile) {
      console.error(`Профиль студента не найден: ${b.studentName}`);
    }
    setChatPersonName(b?.studentName ?? 'Ученик');
    setChatPersonInitials(b?.studentInitials ?? '?');
    setChatPersonAvColor(b?.studentColor ?? 'ice');
    setChatPersonHasProfile(true);
    setChatPersonProfileType('student');
    setActiveStudentId(profile?.id ?? '');
    setChatBookingStatus(b?.status === 'accepted' ? 'ACCEPTED' : 'PENDING');
    setChatIsInstructor(true);
    setActiveChatBookingId(bookingId);
    push('chat');
  }

  function handleToggleFavorite(id: string) {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleToggleBlock(instructorId: string, blocked: boolean) {
    setBlockedIds(prev => {
      const next = new Set(prev);
      blocked ? next.add(instructorId) : next.delete(instructorId);
      return next;
    });
  }

  // ── Анимация навигации ──────────────────────────────────────────────────
  const [animKey, setAnimKey] = useState(0);
  const [animDir, setAnimDir] = useState<'push' | 'pop' | 'none'>('none');

  const screen = stack[stack.length - 1];

  // push — новый экран въезжает справа
  function push(s: Screen) {
    setAnimDir('push');
    setAnimKey(k => k + 1);
    setStack(p => [...p, s]);
  }

  // pop — возврат: предыдущий экран плавно выезжает из лёгкого смещения слева
  function pop() {
    setAnimDir('pop');
    setAnimKey(k => k + 1);
    setStack(p => p.length > 1 ? p.slice(0, -1) : p);
  }

  // Переходы без анимации (смена роли / таб-свитч)
  function goHome(r: Role)  { setRole(r); setAnimDir('none'); setAnimKey(k => k + 1); setStack([r === 'instructor' ? 'instr' : 'guest']); }
  function switchInstrTab(tab: InstrTab) { setInstrTab(tab); setStack(['instr']); }
  function switchGuestTab(tab: GuestTab) { setGuestTab(tab); setStack(['guest']); }

  // pop без анимации — используется при свайп-назад (SwipeBack сам анимирует)
  function popNoAnim() {
    setAnimDir('none');
    setStack(p => p.length > 1 ? p.slice(0, -1) : p);
  }

  // ── Навигация общая ──────────────────────────────────────────────────────
  const pendingCount = getPendingRequests('aleksey').length;
  const instrNavLive = INSTR_NAV.map(item =>
    item.id === 'requests' ? { ...item, badge: pendingCount > 0 ? pendingCount : undefined } : item
  );

  // ── Собираем контент ─────────────────────────────────────────────────────
  function buildContent(s: Screen): React.ReactNode {

  // Auth
  if (s === 'auth') {
    return <AuthScreen onGuest={() => goHome('guest')} onLoginByPhone={() => push('phone')} />;
  }
  else if (s === 'phone') {
    return <PhoneAuthScreen onBack={pop} onSubmit={p => { setPhone(p); push('sms'); }} />;
  }
  else if (s === 'sms') {
    return <SmsCodeScreen phone={phone} onBack={pop} onVerified={() => goHome('instructor')} />;
  }

  // Overlays
  else if (s === 'balance') {
    return <BalanceScreen onBack={pop} />;
  }
  else if (s === 'reviews') {
    return <ReviewsScreen onBack={pop} />;
  }
  else if (s === 'chat') {
    return (
      <ChatScreen
        onBack={pop}
        onProfile={chatPersonHasProfile ? () => push(chatPersonProfileType === 'student' ? 'student-profile' : 'instr-profile') : undefined}
        onBook={() => push('book-slot')}
        bookingStatus={chatBookingStatus}
        instructorPhone={chatInstructorPhone}
        personName={chatPersonName || undefined}
        personInitials={chatPersonInitials || undefined}
        personAvColor={chatPersonAvColor || undefined}
        role={chatIsInstructor ? 'instructor' : 'guest'}
        onAcceptBooking={chatIsInstructor && activeChatBookingId ? () => {
          acceptBooking(activeChatBookingId);
          setChatBookingStatus('ACCEPTED');
        } : undefined}
        onDeclineBooking={chatIsInstructor && activeChatBookingId ? () => {
          declineBooking(activeChatBookingId);
          setChatBookingStatus('DECLINED');
        } : undefined}
      />
    );
  }
  else if (s === 'community') {
    return <CommunityScreen onBack={pop} />;
  }
  else if (s === 'notifications') {
    return <NotificationsScreen
      onBack={pop}
      role={role}
      onNavigate={nav => {
        if (nav === 'chat-list') push('notif-chat');
        else if (nav === 'requests') push('notif-requests');
        else if (nav === 'bookings') push('notif-bookings');
        else push(nav as Screen);
      }}
    />;
  }
  else if (s === 'notif-chat') {
    const chatContent = role === 'instructor'
      ? <ChatListScreen
          onBack={pop}
          onChat={(id, status, phone, name, initials, avColor, chatRole) => {
            const isStudent = chatRole === 'ученик' || chatRole === 'ученица';
            const instr = INSTRUCTORS.find(i => i.id === id);
            if (isStudent) { setActiveStudentId(id); setChatPersonHasProfile(true); setChatPersonProfileType('student'); }
            else if (instr) { setActiveInstructor(instr); setChatPersonHasProfile(true); setChatPersonProfileType('instructor'); }
            else { setChatPersonHasProfile(false); }
            setChatBookingStatus(status === 'DECLINED' ? 'NONE' : status);
            setChatInstructorPhone(phone);
            setChatPersonName(name ?? ''); setChatPersonInitials(initials ?? ''); setChatPersonAvColor(avColor ?? 'ice');
            setChatIsInstructor(true);
            push('chat');
          }}
          isInstructor
        />
      : <ChatListScreen
          onBack={pop}
          onChat={(id, status, phone, name, initials, avColor) => {
            const instr = INSTRUCTORS.find(i => i.id === id);
            if (instr) setActiveInstructor(instr);
            setChatPersonHasProfile(true); setChatPersonProfileType('instructor');
            setChatBookingStatus(status); setChatInstructorPhone(phone);
            setChatPersonName(name ?? ''); setChatPersonInitials(initials ?? ''); setChatPersonAvColor(avColor ?? 'ice');
            setChatIsInstructor(false);
            push('chat');
          }}
          joinedMcIds={joinedMcIds}
          onGroupChat={mcId => { setActiveMcId(mcId); push('mc-group-chat'); }}
        />;
    return (
      <div style={shellStyle}>
        {chatContent}
        {role === 'instructor'
          ? <BottomNav items={instrNavLive} active={instrTab} onTab={t => switchInstrTab(t as InstrTab)} />
          : <BottomNav items={GUEST_NAV}   active={guestTab} onTab={t => switchGuestTab(t as GuestTab)} />}
      </div>
    );
  }
  else if (s === 'notif-requests') {
    return (
      <div style={shellStyle}>
        <RequestsScreen
          onBack={pop}
          onChat={openStudentChat}
          onRequest={id => { setActiveRequestId(id); push('request-detail'); }}
        />
        <BottomNav items={instrNavLive} active={instrTab} onTab={t => switchInstrTab(t as InstrTab)} />
      </div>
    );
  }
  else if (s === 'notif-bookings') {
    return (
      <div style={shellStyle}>
        <BookingsScreen
          onBack={pop}
          onChat={instructorId => {
            const instr = INSTRUCTORS.find(i => i.id === instructorId) ?? activeInstructor;
            setActiveInstructor(instr);
            setChatPersonName(instr.name); setChatPersonInitials(instr.initials); setChatPersonAvColor(instr.avatarColor);
            setChatPersonHasProfile(true);
            setChatIsInstructor(false);
            push('chat');
          }}
          onBookAgain={instructorId => {
            const instr = INSTRUCTORS.find(i => i.id === instructorId) ?? INSTRUCTORS[0];
            setActiveInstructor(instr);
            push('book-slot');
          }}
        />
        <BottomNav items={GUEST_NAV} active={guestTab} onTab={t => switchGuestTab(t as GuestTab)} />
      </div>
    );
  }
  else if (s === 'register') {
    // isEditMode = true когда открыт из профиля инструктора (не из каталога)
    const isEditMode = role === 'instructor';
    return <RegisterScreen onBack={pop} isEditMode={isEditMode} />;
  }
  else if (s === 'instr-profile') {
    return (
      <ProfileScreen
        instructor={activeInstructor}
        onBack={pop}
        onBook={() => push('book-slot')}
        onAskQuestion={openInstrChat}
        onAllReviews={() => push('reviews')}
        onChat={openInstrChat}
        isBlocked={blockedIds.has(activeInstructor.id)}
        onToggleBlock={handleToggleBlock}
      />
    );
  }
  else if (s === 'my-profile') {
    return (
      <ProfileScreen
        instructor={INSTRUCTORS[0]}
        onBack={pop}
        onBook={pop}
        onAskQuestion={pop}
        onAllReviews={() => push('reviews')}
        isOwnProfile
        onEditProfile={() => push('register')}
      />
    );
  }
  else if (s === 'lesson-detail') {
    return (
      <LessonDetailScreen
        key={activeLessonId}
        lessonId={activeLessonId}
        onBack={pop}
        onChat={() => openStudentChat(activeLessonId)}
        onCancel={pop}
        onComplete={() => { completeBooking(activeLessonId); pop(); }}
      />
    );
  }
  else if (s === 'request-detail') {
    return (
      <RequestDetailScreen
        key={activeRequestId}
        requestId={activeRequestId}
        onBack={pop}
        onChat={() => openStudentChat(activeRequestId)}
        onAccepted={pop}
      />
    );
  }
  else if (s === 'book-slot') {
    return (
      <BookSlotScreen
        onBack={pop}
        onBooked={() => { switchGuestTab('bookings'); }}
        instructor={activeInstructor}
      />
    );
  }
  else if (s === 'mc-catalog') {
    return (
      <MasterClassCatalogScreen
        onBack={pop}
        onDetail={id => { setActiveMcId(id); push('mc-detail'); }}
        joinedMcIds={joinedMcIds}
      />
    );
  }
  else if (s === 'mc-detail') {
    const detailMc = MASTER_CLASSES.find(m => m.id === activeMcId);
    const isOwnMc  = role === 'instructor' && detailMc?.instructorId === INSTRUCTORS[0].id;
    return (
      <MasterClassDetailScreen
        key={activeMcId}
        id={activeMcId}
        role={role}
        onBack={pop}
        onJoined={() => {
          // Добавляем 'guest' в participants для синхронизации GroupChat
          if (detailMc && !detailMc.participants.includes('guest')) {
            detailMc.participants.push('guest');
          }
          setJoinedMcIds(prev => new Set([...prev, activeMcId]));
          push('mc-group-chat');
        }}
        isAlreadyJoined={joinedMcIds.has(activeMcId)}
        onLeave={() => {
          // Удаляем 'guest' из participants
          if (detailMc) {
            const idx = detailMc.participants.indexOf('guest');
            if (idx !== -1) detailMc.participants.splice(idx, 1);
          }
          setJoinedMcIds(prev => {
            const next = new Set(prev);
            next.delete(activeMcId);
            return next;
          });
        }}
        onInstructorProfile={instructorId => {
          const instr = INSTRUCTORS.find(i => i.id === instructorId) ?? INSTRUCTORS[0];
          setActiveInstructor(instr);
          push('instr-profile');
        }}
        onCancel={isOwnMc ? () => {
          // Очищаем joinedMcIds если гость был записан
          setJoinedMcIds(prev => {
            const next = new Set(prev);
            next.delete(activeMcId);
            return next;
          });
          // Возвращаемся в каталог МК
          const idx = stack.lastIndexOf('mc-catalog');
          setAnimDir('pop');
          setAnimKey(k => k + 1);
          if (idx >= 0) setStack(stack.slice(0, idx + 1));
          else setStack(role === 'instructor' ? ['instr'] : ['guest']);
        } : undefined}
      />
    );
  }
  else if (s === 'mc-create') {
    return (
      <MasterClassCreateScreen
        onBack={pop}
        onPublished={() => { switchInstrTab('dashboard'); }}
      />
    );
  }
  else if (s === 'mc-group-chat') {
    const activeMc = MASTER_CLASSES.find(m => m.id === activeMcId);
    const participantCount = activeMc?.participants.length ?? 0;
    const isGroupConfirmed = activeMc
      ? participantCount >= activeMc.minParticipants
      : false;
    return (
      <GroupChatScreen
        mcTitle={activeMc?.title}
        isConfirmed={isGroupConfirmed}
        participantCount={participantCount}
        date={activeMc?.date}
        location={activeMc?.location}
        role={role}
        onBack={() => {
          const idx = stack.lastIndexOf('mc-catalog');
          setAnimDir('pop');
          setAnimKey(k => k + 1);
          if (idx >= 0) setStack(stack.slice(0, idx + 1));
          else setStack(['guest']);
        }}
      />
    );
  }

  else if (s === 'student-profile') {
    return (
      <StudentProfileScreen
        studentId={activeStudentId}
        onBack={pop}
        onChat={() => { pop(); }}
      />
    );
  }

  // ── Instructor shell ──────────────────────────────────────────────────────
  else if (s === 'instr') {
    let tabContent: React.ReactNode;

    if (instrTab === 'dashboard') {
      tabContent = (
        <DashboardScreen
          onRequests={() => switchInstrTab('requests')}
          onCalendar={() => switchInstrTab('calendar')}
          onBalance={() => push('balance')}
          onReviews={() => push('reviews')}
          onNotifications={() => push('notifications')}
          onLesson={id => { setActiveLessonId(id); push('lesson-detail'); }}
          onCreateMasterClass={() => push('mc-create')}
        />
      );
    } else if (instrTab === 'requests') {
      tabContent = (
        <RequestsScreen
          onBack={() => switchInstrTab('dashboard')}
          onChat={openStudentChat}
          onRequest={id => { setActiveRequestId(id); push('request-detail'); }}
        />
      );
    } else if (instrTab === 'chat') {
      tabContent = (
        <ChatListScreen
          onChat={(id, status, phone, name, initials, avColor, role) => {
            const isStudent = role === 'ученик' || role === 'ученица';
            const instr = INSTRUCTORS.find(i => i.id === id);
            if (isStudent) {
              setActiveStudentId(id);
              setChatPersonHasProfile(true);
              setChatPersonProfileType('student');
            } else if (instr) {
              setActiveInstructor(instr);
              setChatPersonHasProfile(true);
              setChatPersonProfileType('instructor');
            } else {
              setChatPersonHasProfile(false);
            }
            setChatBookingStatus(status === 'DECLINED' ? 'NONE' : status);
            setChatInstructorPhone(phone);
            setChatPersonName(name ?? '');
            setChatPersonInitials(initials ?? '');
            setChatPersonAvColor(avColor ?? 'ice');
            setChatIsInstructor(true);
            push('chat');
          }}
          onCommunity={() => push('community')}
          isInstructor
        />
      );
    } else if (instrTab === 'calendar') {
      tabContent = <ScheduleScreen onLesson={id => { setActiveLessonId(id ?? ''); push('lesson-detail'); }} onChat={() => { setChatIsInstructor(true); push('chat'); }} onCreateMasterClass={() => push('mc-create')} />;
    } else {
      tabContent = (
        <InstrProfileScreen
          onBalance={() => push('balance')}
          onMyProfile={() => push('my-profile')}
          onLogout={() => setStack(['auth'])}
        />
      );
    }

    return (
      <div style={shellStyle}>
        {tabContent}
        <BottomNav items={instrNavLive} active={instrTab} onTab={t => switchInstrTab(t as InstrTab)} />
      </div>
    );
  }

  // ── Guest shell ───────────────────────────────────────────────────────────
  else if (s === 'guest') {
    let tabContent: React.ReactNode;

    if (guestTab === 'catalog') {
      tabContent = (
        <CatalogScreen
          onProfile={id => {
            const instr = INSTRUCTORS.find(i => i.id === id) ?? INSTRUCTORS[0];
            setActiveInstructor(instr);
            push('instr-profile');
          }}
          onBook={id => {
            const instr = INSTRUCTORS.find(i => i.id === id) ?? INSTRUCTORS[0];
            setActiveInstructor(instr);
            push('book-slot');
          }}
          onNotifications={() => push('notifications')}
          onBecomeInstructor={() => push('register')}
          onMasterClasses={() => push('mc-catalog')}
          blockedIds={blockedIds}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
        />
      );
    } else if (guestTab === 'bookings') {
      tabContent = (
        <BookingsScreen
          onChat={instructorId => {
            const instr = INSTRUCTORS.find(i => i.id === instructorId) ?? activeInstructor;
            setActiveInstructor(instr);
            setChatPersonName(instr.name);
            setChatPersonInitials(instr.initials);
            setChatPersonAvColor(instr.avatarColor);
            setChatPersonHasProfile(true);
            setChatIsInstructor(false);
            push('chat');
          }}
          onBookAgain={instructorId => {
            const instr = INSTRUCTORS.find(i => i.id === instructorId) ?? INSTRUCTORS[0];
            setActiveInstructor(instr);
            push('book-slot');
          }}
        />
      );
    } else if (guestTab === 'chat') {
      tabContent = (
        <ChatListScreen
          onChat={(id, status, phone, name, initials, avColor) => {
            // Гостевые чаты — только инструкторы
            const instr = INSTRUCTORS.find(i => i.id === id);
            if (instr) setActiveInstructor(instr);
            setChatPersonHasProfile(true);
            setChatPersonProfileType('instructor');
            setChatBookingStatus(status);
            setChatInstructorPhone(phone);
            setChatPersonName(name ?? '');
            setChatPersonInitials(initials ?? '');
            setChatPersonAvColor(avColor ?? 'ice');
            setChatIsInstructor(false);
            push('chat');
          }}
          joinedMcIds={joinedMcIds}
          onGroupChat={mcId => { setActiveMcId(mcId); push('mc-group-chat'); }}
        />
      );
    } else {
      tabContent = (
        <GuestProfileScreen
          onBack={() => switchGuestTab('catalog')}
          onBecomeInstructor={() => push('register')}
          onBookings={() => switchGuestTab('bookings')}
          onLogout={() => {
            localStorage.removeItem('guestId');
            localStorage.removeItem('guestName');
            localStorage.removeItem('guestPhone');
            setStack(['auth']);
          }}
          favorites={favorites}
          onUnfavorite={handleToggleFavorite}
          blockedIds={blockedIds}
          onUnblock={id => handleToggleBlock(id, false)}
          allInstructors={INSTRUCTORS}
          onViewProfile={id => {
            const instr = INSTRUCTORS.find(i => i.id === id) ?? INSTRUCTORS[0];
            setActiveInstructor(instr);
            push('instr-profile');
          }}
        />
      );
    }

    return (
      <div style={shellStyle}>
        {tabContent}
        <BottomNav items={GUEST_NAV} active={guestTab} onTab={t => switchGuestTab(t as GuestTab)} />
      </div>
    );
  }

    return null;
  } // end buildContent

  const content    = buildContent(screen);
  const prevScreen = stack.length > 1 ? stack[stack.length - 2] : null;
  const prevContent = prevScreen ? buildContent(prevScreen) : null;

  if (!content) return null;

  // ── Единственный return: анимированная обёртка ────────────────────────────
  // key={animKey} заставляет React размонтировать/монтировать обёртку →
  // CSS-анимация гарантированно воспроизводится с начала при каждой навигации.
  return (
    <SwipeBack
      canSwipe={stack.length > 1}
      prevContent={prevContent}
      onBack={popNoAnim}
    >
      <div
        key={animKey}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: animDir === 'push'
            ? 'navPush 260ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both'
            : animDir === 'pop'
            ? 'navPop  260ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both'
            : undefined,
        }}
      >
        {content}
      </div>
    </SwipeBack>
  );
}
