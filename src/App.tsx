import { useState } from 'react';
import { BottomNav } from './components/BottomNav/BottomNav';
import { useSwipeBack } from './hooks/useSwipeBack';

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
import { getPendingRequests }       from './store/bookings';
import { StudentProfileScreen }     from './screens/StudentProfile/StudentProfileScreen';

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
  | 'student-profile';

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
  const [activeStudentId, setActiveStudentId] = useState('');
  const [activeInstructor, setActiveInstructor] = useState<Instructor>(INSTRUCTORS[0]);
  const [joinedMcIds, setJoinedMcIds]   = useState<Set<string>>(new Set());
  const [blockedIds, setBlockedIds]     = useState<Set<string>>(new Set());
  const [favorites, setFavorites]       = useState<Set<string>>(new Set());
  const [activeRequestId, setActiveRequestId] = useState<string>('');
  const [activeLessonId,  setActiveLessonId]  = useState<string>('');

  /** Open chat pre-filled with the active instructor's identity. */
  function openInstrChat() {
    setChatPersonName(activeInstructor.name);
    setChatPersonInitials(activeInstructor.initials);
    setChatPersonAvColor(activeInstructor.avatarColor);
    setChatPersonHasProfile(true);
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

  // Swipe-back: активен только когда есть куда возвращаться
  useSwipeBack(stack.length > 1 ? pop : null);

  // Переходы без анимации (смена роли / таб-свитч)
  function goHome(r: Role)  { setRole(r); setAnimDir('none'); setAnimKey(k => k + 1); setStack([r === 'instructor' ? 'instr' : 'guest']); }
  function switchInstrTab(tab: InstrTab) { setInstrTab(tab); setStack(['instr']); }
  function switchGuestTab(tab: GuestTab) { setGuestTab(tab); setStack(['guest']); }

  // ── Собираем контент (единственный return внизу) ─────────────────────────
  let content: React.ReactNode = null;

  // Auth
  if (screen === 'auth') {
    content = <AuthScreen onSelectRole={r => goHome(r as Role)} onLoginByPhone={() => push('phone')} />;
  }
  else if (screen === 'phone') {
    content = <PhoneAuthScreen onBack={pop} onSubmit={({ phone: p }) => { setPhone(p); push('sms'); }} />;
  }
  else if (screen === 'sms') {
    content = <SmsCodeScreen phone={phone} onBack={pop} onVerified={() => goHome(role)} />;
  }

  // Overlays
  else if (screen === 'balance') {
    content = <BalanceScreen onBack={pop} />;
  }
  else if (screen === 'reviews') {
    content = <ReviewsScreen onBack={pop} />;
  }
  else if (screen === 'chat') {
    content = (
      <ChatScreen
        onBack={pop}
        onProfile={chatPersonHasProfile ? () => push(chatPersonProfileType === 'student' ? 'student-profile' : 'instr-profile') : undefined}
        onBook={() => push('book-slot')}
        bookingStatus={chatBookingStatus}
        instructorPhone={chatInstructorPhone}
        personName={chatPersonName || undefined}
        personInitials={chatPersonInitials || undefined}
        personAvColor={chatPersonAvColor || undefined}
      />
    );
  }
  else if (screen === 'community') {
    content = <CommunityScreen onBack={pop} />;
  }
  else if (screen === 'notifications') {
    content = <NotificationsScreen onBack={pop} />;
  }
  else if (screen === 'register') {
    // isEditMode = true когда открыт из профиля инструктора (не из каталога)
    const isEditMode = role === 'instructor';
    content = <RegisterScreen onBack={pop} isEditMode={isEditMode} />;
  }
  else if (screen === 'instr-profile') {
    content = (
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
  else if (screen === 'my-profile') {
    content = (
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
  else if (screen === 'lesson-detail') {
    content = (
      <LessonDetailScreen
        key={activeLessonId}
        lessonId={activeLessonId}
        onBack={pop}
        onChat={openInstrChat}
        onCancel={pop}
      />
    );
  }
  else if (screen === 'request-detail') {
    content = (
      <RequestDetailScreen
        key={activeRequestId}
        requestId={activeRequestId}
        onBack={pop}
        onChat={openInstrChat}
        onAccepted={pop}
      />
    );
  }
  else if (screen === 'book-slot') {
    content = (
      <BookSlotScreen
        onBack={pop}
        onBooked={() => { switchGuestTab('bookings'); }}
        instructor={activeInstructor}
      />
    );
  }
  else if (screen === 'mc-catalog') {
    content = (
      <MasterClassCatalogScreen
        onBack={pop}
        onDetail={id => { setActiveMcId(id); push('mc-detail'); }}
        joinedMcIds={joinedMcIds}
      />
    );
  }
  else if (screen === 'mc-detail') {
    content = (
      <MasterClassDetailScreen
        key={activeMcId}
        id={activeMcId}
        onBack={pop}
        onJoined={() => {
          setJoinedMcIds(prev => new Set([...prev, activeMcId]));
          push('mc-group-chat');
        }}
        isAlreadyJoined={joinedMcIds.has(activeMcId)}
        onLeave={() => setJoinedMcIds(prev => {
          const next = new Set(prev);
          next.delete(activeMcId);
          return next;
        })}
        onInstructorProfile={instructorId => {
          const instr = INSTRUCTORS.find(i => i.id === instructorId) ?? INSTRUCTORS[0];
          setActiveInstructor(instr);
          push('instr-profile');
        }}
      />
    );
  }
  else if (screen === 'mc-create') {
    content = (
      <MasterClassCreateScreen
        onBack={pop}
        onPublished={() => { switchInstrTab('dashboard'); }}
      />
    );
  }
  else if (screen === 'mc-group-chat') {
    const activeMc = MASTER_CLASSES.find(m => m.id === activeMcId);
    content = (
      <GroupChatScreen
        mcTitle={activeMc?.title}
        isConfirmed={false}
        date={activeMc?.date}
        location={activeMc?.location}
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

  else if (screen === 'student-profile') {
    content = (
      <StudentProfileScreen
        studentId={activeStudentId}
        onBack={pop}
        onChat={() => { pop(); }}
      />
    );
  }

  // ── Instructor shell ──────────────────────────────────────────────────────
  else if (screen === 'instr') {
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
          onChat={() => push('chat')}
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
            push('chat');
          }}
          onCommunity={() => push('community')}
        />
      );
    } else if (instrTab === 'calendar') {
      tabContent = <ScheduleScreen onLesson={id => { setActiveLessonId(id ?? ''); push('lesson-detail'); }} onChat={() => push('chat')} onCreateMasterClass={() => push('mc-create')} />;
    } else {
      tabContent = (
        <InstrProfileScreen
          onBalance={() => push('balance')}
          onMyProfile={() => push('my-profile')}
          onLogout={() => setStack(['auth'])}
        />
      );
    }

    const pending = getPendingRequests('aleksey').length;
    const instrNavLive = INSTR_NAV.map(item =>
      item.id === 'requests'
        ? { ...item, badge: pending > 0 ? pending : undefined }
        : item
    );

    content = (
      <div style={shellStyle}>
        {tabContent}
        <BottomNav items={instrNavLive} active={instrTab} onTab={t => switchInstrTab(t as InstrTab)} />
      </div>
    );
  }

  // ── Guest shell ───────────────────────────────────────────────────────────
  else if (screen === 'guest') {
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
            const instr = INSTRUCTORS.find(i => i.id === id);
            if (instr) {
              setActiveInstructor(instr);
              setChatPersonHasProfile(true);
              setChatPersonProfileType('instructor');
            } else {
              setChatPersonHasProfile(false);
            }
            setChatBookingStatus(status);
            setChatInstructorPhone(phone);
            setChatPersonName(name ?? '');
            setChatPersonInitials(initials ?? '');
            setChatPersonAvColor(avColor ?? 'ice');
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
          onLogout={() => setStack(['auth'])}
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

    content = (
      <div style={shellStyle}>
        {tabContent}
        <BottomNav items={GUEST_NAV} active={guestTab} onTab={t => switchGuestTab(t as GuestTab)} />
      </div>
    );
  }

  if (!content) return null;

  // ── Единственный return: анимированная обёртка ────────────────────────────
  // key={animKey} заставляет React размонтировать/монтировать обёртку →
  // CSS-анимация гарантированно воспроизводится с начала при каждой навигации.
  return (
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
  );
}
