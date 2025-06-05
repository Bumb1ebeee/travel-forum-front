'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import Sidebar from '@/components/profile/sidebar/Sidebar';
import { useSidebar } from '@/hooks/useSidebar';
import LoadingIndicator from '@/components/loader/LoadingIndicator';

export default function SidebarLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  useEffect(() => {
    const checkAuth = async () => {
      const { authenticated, user } = await isAuthenticated();
      if (!authenticated) {
        router.push('/auth/login');
      } else {
        setUser(user);
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-primary-bg min-w-[320px]">
      {/* Кнопка для открытия/закрытия сайдбара */}
      <button
        className="fixed top-12 left-4 z-50 p-2 bg-white rounded shadow text-text-primary flex items-center"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Закрыть
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Меню
          </>
        )}
      </button>

      {/* Сайдбар */}
      <div
        className={`flex-none w-64 h-full bg-gray-100 shadow-md transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarOpen ? 'w-64' : 'w-0'
        }`}
      >
        <Sidebar />
      </div>

      {/* Основной контент */}
      <main className="flex-1 overflow-y-auto hide-scrollbar w-full p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}