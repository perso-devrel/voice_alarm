import { useState, useEffect, lazy, Suspense } from 'react';
import LoginPage from './components/LoginPage';

const VoicesPage = lazy(() => import('./pages/VoicesPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const AlarmsPage = lazy(() => import('./pages/AlarmsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FriendsPage = lazy(() => import('./pages/FriendsPage'));
const GiftsPage = lazy(() => import('./pages/GiftsPage'));

type Page = 'voices' | 'messages' | 'alarms' | 'friends' | 'gifts' | 'settings';

const NAV_ITEMS: { key: Page; label: string; emoji: string }[] = [
  { key: 'voices', label: '음성 관리', emoji: '🎙️' },
  { key: 'messages', label: '메시지', emoji: '💌' },
  { key: 'alarms', label: '알람 설정', emoji: '⏰' },
  { key: 'friends', label: '친구', emoji: '👥' },
  { key: 'gifts', label: '선물', emoji: '🎁' },
  { key: 'settings', label: '설정', emoji: '⚙️' },
];

export default function App() {
  const [page, setPage] = useState<Page>('voices');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogin = (idToken: string) => {
    localStorage.setItem('auth_token', idToken);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (page) {
      case 'voices':
        return <VoicesPage />;
      case 'messages':
        return <MessagesPage />;
      case 'alarms':
        return <AlarmsPage />;
      case 'friends':
        return <FriendsPage />;
      case 'gifts':
        return <GiftsPage />;
      case 'settings':
        return <SettingsPage />;
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <nav
        aria-label="메인 메뉴"
        className="w-64 bg-white border-r border-[#F2E8E5] p-6 flex flex-col"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#FF7F6B]">VoiceAlarm</h1>
          <p className="text-sm text-gray-400 mt-1">음성 관리 대시보드</p>
        </div>

        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              aria-current={page === item.key ? 'page' : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                page === item.key
                  ? 'bg-[#FFF0ED] text-[#FF7F6B] font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl" aria-hidden="true">
                {item.emoji}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-6 border-t border-[#F2E8E5]">
          <button
            onClick={handleLogout}
            aria-label="로그아웃"
            className="text-xs text-red-400 hover:text-red-500 transition-colors"
          >
            로그아웃
          </button>
          <p className="text-xs text-gray-400 mt-2">VoiceAlarm v1.0.0</p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7F6B]" />
            </div>
          }
        >
          {renderPage()}
        </Suspense>
      </main>
    </div>
  );
}
