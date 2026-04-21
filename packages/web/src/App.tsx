import { useState, lazy, Suspense } from 'react';
import LoginPage from './components/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';
import { useDarkMode } from './hooks/useDarkMode';
import { useAuth } from './hooks/useAuth';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const VoicesPage = lazy(() => import('./pages/VoicesPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const AlarmsPage = lazy(() => import('./pages/AlarmsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FriendsPage = lazy(() => import('./pages/FriendsPage'));
const GiftsPage = lazy(() => import('./pages/GiftsPage'));
const FamilyAlarmsPage = lazy(() => import('./pages/FamilyAlarmsPage'));
const CharacterPage = lazy(() => import('./pages/CharacterPage'));

type Page =
  | 'dashboard'
  | 'voices'
  | 'messages'
  | 'alarms'
  | 'family'
  | 'character'
  | 'friends'
  | 'gifts'
  | 'settings';

const NAV_ITEMS: { key: Page; label: string; emoji: string }[] = [
  { key: 'dashboard', label: '대시보드', emoji: '📊' },
  { key: 'voices', label: '음성 관리', emoji: '🎙️' },
  { key: 'messages', label: '메시지', emoji: '💌' },
  { key: 'alarms', label: '알람 설정', emoji: '⏰' },
  { key: 'family', label: '가족 알람', emoji: '🏠' },
  { key: 'character', label: '내 캐릭터', emoji: '🌱' },
  { key: 'friends', label: '친구', emoji: '👥' },
  { key: 'gifts', label: '선물', emoji: '🎁' },
  { key: 'settings', label: '설정', emoji: '⚙️' },
];

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const darkMode = useDarkMode();
  const { isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]"
        role="status"
        aria-label="인증 확인 중"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleLogout = () => {
    logout();
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <DashboardPage onNavigate={(p) => setPage(p as Page)} />;
      case 'voices':
        return <VoicesPage />;
      case 'messages':
        return <MessagesPage />;
      case 'alarms':
        return <AlarmsPage />;
      case 'family':
        return <FamilyAlarmsPage />;
      case 'character':
        return <CharacterPage />;
      case 'friends':
        return <FriendsPage />;
      case 'gifts':
        return <GiftsPage />;
      case 'settings':
        return <SettingsPage darkMode={darkMode} />;
      default:
        return <DashboardPage onNavigate={(p) => setPage(p as Page)} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--color-bg)]">
      {/* Sidebar — desktop only */}
      <nav
        aria-label="메인 메뉴"
        className="hidden md:flex w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] p-6 flex-col transition-colors duration-200"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">VoiceAlarm</h1>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">음성 관리 대시보드</p>
        </div>

        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              aria-current={page === item.key ? 'page' : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                page === item.key
                  ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
              }`}
            >
              <span className="text-xl" aria-hidden="true">
                {item.emoji}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-6 border-t border-[var(--color-border)]">
          <button
            onClick={handleLogout}
            aria-label="로그아웃"
            className="text-xs text-red-400 hover:text-red-500 transition-colors"
          >
            로그아웃
          </button>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-2">VoiceAlarm v1.0.0</p>
        </div>
      </nav>

      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] transition-colors">
        <h1 className="text-lg font-bold text-[var(--color-primary)]">VoiceAlarm</h1>
        <button
          onClick={handleLogout}
          aria-label="로그아웃"
          className="text-xs text-red-400 hover:text-red-500 transition-colors"
        >
          로그아웃
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-20 md:pb-8">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
              </div>
            }
          >
            {renderPage()}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Bottom tab bar — mobile only */}
      <nav
        aria-label="메인 메뉴"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex justify-around py-2 transition-colors z-50"
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            aria-current={page === item.key ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs transition-all ${
              page === item.key
                ? 'text-[var(--color-primary)] font-semibold'
                : 'text-[var(--color-text-tertiary)]'
            }`}
          >
            <span className="text-lg" aria-hidden="true">
              {item.emoji}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
