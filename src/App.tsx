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

// ── Types ──────────────────────────────────────────────────────────────────

type Role     = 'instructor' | 'guest';
type InstrTab = 'dashboard' | 'requests' | 'chat' | 'calendar' | 'profile';
type GuestTab = 'catalog'   | 'bookings' | 'chat' | 'profile';

type Screen =
  | 'auth' | 'phone' | 'sms'
  | 'instr' | 'guest'
  | 'balance' | 'reviews' | 'chat' | 'community'
  | 'notifications' | 'register' | 'instr-profile'
  | 'lesson-detail' | 'request-detail' | 'book-slot'
  | 'mc-catalog' | 'mc-detail' | 'mc-create' | 'mc-group-chat';

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
  const [activeInstructor, setActiveInstructor] = useState<Instructor>(INSTRUCTORS[0]);
  const [joinedMcIds, setJoinedMcIds] = useState<Set<string>>(new Set());

  const screen = stack[stack.length - 1];

  function push(s: Screen)  { setStack(p => [...p, s]); }
  function pop()            { setStack(p => p.length > 1 ? p.slice(0, -1) : p); }

  // Swipe-back: активен только когда есть куда возвращаться (оверлеи поверх шелла)
  useSwipeBack(stack.length > 1 ? pop : null);
  function goHome(r: Role)  { setRole(r); setStack([r === 'instructor' ? 'instr' : 'guest']); }

  function switchInstrTab(tab: InstrTab) { setInstrTab(tab); setStack(['instr']); }
  function switchGuestTab(tab: GuestTab) { setGuestTab(tab); setStack(['guest']); }

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (screen === 'auth') {
    return <AuthScreen onSelectRole={r => goHome(r as Role)} onLoginByPhone={() => push('phone')} />;
  }
  if (screen === 'phone') {
    return <PhoneAuthScreen onBack={pop} onSubmit={p => { setPhone(String(p)); push('sms'); }} />;
  }
  if (screen === 'sms') {
    return <SmsCodeScreen phone={phone} onBack={pop} onVerified={() => goHome(role)} />;
  }

  // ── Overlays ──────────────────────────────────────────────────────────────
  if (screen === 'balance') {
    return <BalanceScreen onBack={pop} />;
  }
  if (screen === 'reviews') {
    return <ReviewsScreen onBack={pop} />;
  }
  if (screen === 'chat') {
    return (
      <ChatScreen
        onBack={pop}
        onProfile={() => push('instr-profile')}
        onBook={() => push('book-slot')}
        bookingStatus={chatBookingStatus}
        instructorPhone={chatInstructorPhone}
      />
    );
  }
  if (screen === 'community') {
    return <CommunityScreen onBack={pop} />;
  }
  if (screen === 'notifications') {
    return <NotificationsScreen onBack={pop} />;
  }
  if (screen === 'register') {
    return <RegisterScreen onBack={pop} />;
  }
  if (screen === 'instr-profile') {
    return (
      <ProfileScreen
        instructor={activeInstructor}
        onBack={pop}
        onBook={() => push('book-slot')}
        onAskQuestion={() => push('chat')}
        onAllReviews={() => push('reviews')}
        onChat={() => push('chat')}
      />
    );
  }
  if (screen === 'lesson-detail') {
    return (
      <LessonDetailScreen
        onBack={pop}
        onChat={() => push('chat')}
        onCancel={pop}
      />
    );
  }
  if (screen === 'request-detail') {
    return (
      <RequestDetailScreen
        onBack={pop}
        onChat={() => push('chat')}
        onAccepted={pop}
      />
    );
  }
  if (screen === 'book-slot') {
    return (
      <BookSlotScreen
        onBack={pop}
        onBooked={() => { switchGuestTab('bookings'); }}
        instructor={activeInstructor}
      />
    );
  }
  if (screen === 'mc-catalog') {
    return (
      <MasterClassCatalogScreen
        onBack={pop}
        onDetail={id => { setActiveMcId(id); push('mc-detail'); }}
        joinedMcIds={joinedMcIds}
      />
    );
  }
  if (screen === 'mc-detail') {
    return (
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
      />
    );
  }
  if (screen === 'mc-create') {
    return (
      <MasterClassCreateScreen
        onBack={pop}
        onPublished={() => { switchInstrTab('dashboard'); }}
      />
    );
  }
  if (screen === 'mc-group-chat') {
    const activeMc = MASTER_CLASSES.find(m => m.id === activeMcId);
    return (
      <GroupChatScreen
        mcTitle={activeMc?.title}
        isConfirmed={false}
        date={activeMc?.date}
        location={activeMc?.location}
        onBack={() => {
          // Возвращаемся в каталог МК, пропуская экран деталей
          const idx = stack.lastIndexOf('mc-catalog');
          if (idx >= 0) setStack(stack.slice(0, idx + 1));
          else setStack(['guest']);
        }}
      />
    );
  }

  // ── Instructor shell ──────────────────────────────────────────────────────
  if (screen === 'instr') {
    let tabContent: React.ReactNode;

    if (instrTab === 'dashboard') {
      tabContent = (
        <DashboardScreen
          onRequests={() => switchInstrTab('requests')}
          onCalendar={() => switchInstrTab('calendar')}
          onBalance={() => push('balance')}
          onReviews={() => push('reviews')}
          onNotifications={() => push('notifications')}
          onLesson={() => push('lesson-detail')}
          onCreateMasterClass={() => push('mc-create')}
        />
      );
    } else if (instrTab === 'requests') {
      tabContent = (
        <RequestsScreen
          onBack={() => switchInstrTab('dashboard')}
          onChat={() => push('chat')}
          onRequest={() => push('request-detail')}
        />
      );
    } else if (instrTab === 'chat') {
      tabContent = (
        <ChatListScreen
          onChat={(_id, status, phone) => { setChatBookingStatus(status); setChatInstructorPhone(phone); push('chat'); }}
          onCommunity={() => push('community')}
        />
      );
    } else if (instrTab === 'calendar') {
      tabContent = <ScheduleScreen onLesson={() => push('lesson-detail')} onChat={() => push('chat')} onCreateMasterClass={() => push('mc-create')} />;
    } else {
      tabContent = (
        <InstrProfileScreen
          onBalance={() => push('balance')}
          onEditProfile={() => push('register')}
          onLogout={() => setStack(['auth'])}
        />
      );
    }

    return (
      <div style={shellStyle}>
        {tabContent}
        <BottomNav items={INSTR_NAV} active={instrTab} onTab={t => switchInstrTab(t as InstrTab)} />
      </div>
    );
  }

  // ── Guest shell ───────────────────────────────────────────────────────────
  if (screen === 'guest') {
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
        />
      );
    } else if (guestTab === 'bookings') {
      tabContent = (
        <BookingsScreen
          onChat={() => push('chat')}
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
          onChat={(_id, status, phone) => { setChatBookingStatus(status); setChatInstructorPhone(phone); push('chat'); }}
          // onCommunity не передаётся — гости не видят чат инструкторов
        />
      );
    } else {
      tabContent = (
        <GuestProfileScreen
          onBack={() => switchGuestTab('catalog')}
          onBecomeInstructor={() => push('register')}
          onBookings={() => switchGuestTab('bookings')}
          onLogout={() => setStack(['auth'])}
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
}
