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
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useSidebar();

  // Определяем, является ли устройство мобильным
  const [isMobile, setIsMobile] = useState(false);

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // считаем мобильным, если ширина меньше 768px
    };

    handleResize(); // Проверка при монтировании
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Закрываем меню при клике вне его области (для мобильных)
  const handleLinkClick = () => {
    if (isMobile && isSidebarOpen) {
      closeSidebar();
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="flex h-full overflow-y-hidden bg-primary-bg min-w-[320px]">
      {/* Кнопка меню — отображается только на мобильных */}
      {isMobile && (
        <button
          className="fixed top-5 left-4 z-50 p-2 bg-white rounded shadow text-text-primary flex items-center"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? 'Закрыть меню' : 'Открыть меню'}
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
      )}

      {/* Сайдбар — всегда видим на десктопе, управляем через isSidebarOpen на мобильных */}
      <div
        className={`flex-none w-64 h-full bg-gray-100 shadow-md transition-all duration-300 ease-in-out overflow-hidden ${
          isMobile ? (isSidebarOpen ? 'block' : 'hidden') : 'block'
        }`}
      >
        <Sidebar onItemClick={handleLinkClick} /> {/* Передаем обработчик */}
      </div>

      {/* Основной контент */}
      <main className="flex-1 overflow-y-auto w-full sm:p-6 mt-6">
        {children}
      </main>
    </div>
  );
}