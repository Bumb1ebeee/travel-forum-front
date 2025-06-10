'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import Image from 'next/image';
import axios from 'axios';
import config from '@/pages/api/config';

export default function Header() {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Проверка аутентификации
  useEffect(() => {
    const checkAuth = async () => {
      const { authenticated, user } = await isAuthenticated();
      setIsAuth(authenticated);
      setUser(user);
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Поиск
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await axios.get(`${config.apiUrl}/autocomplete`, {
          params: { query: searchQuery },
        });
        setSuggestions(response.data.suggestions || []);
      } catch (err) {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [searchQuery]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuth(false);
    setUser(null);
    router.push('/auth/login');
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post(
          `${config.apiUrl}/save-search-query`,
          { query: searchQuery },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      router.push(`/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setSuggestions([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при сохранении поискового запроса');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setSuggestions([]);
  };

  // Получение уведомлений
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${config.apiUrl}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const unread = response.data.notifications.filter(n => !n.is_read);
      setUnreadCount(unread.length);
      setNotifications(response.data.notifications);
    } catch (err) {
      console.error('Ошибка при получении уведомлений:', err);
    }
  };

  useEffect(() => {
    if (isAuth) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // каждые 30 секунд
      return () => clearInterval(interval);
    }
  }, [isAuth]);

  // Отображение уведомления
  const showNewNotification = (notification) => {
    const notificationElement = document.createElement('div');
    notificationElement.className = 'fixed bottom-8 right-8 bg-white rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px] translate-x-full transition-transform duration-300 z-50 cursor-pointer';
    notificationElement.innerHTML = `
      <div class="text-gray-800 text-sm leading-5">
        <p>${notification.message}</p>
      </div>
    `;

    document.body.appendChild(notificationElement);

    setTimeout(() => {
      notificationElement.classList.add('translate-x-0');
    }, 100);

    setTimeout(() => {
      notificationElement.classList.remove('translate-x-0');
      setTimeout(() => {
        document.body.removeChild(notificationElement);
      }, 300);
    }, 5000);

    notificationElement.addEventListener('click', () => {
      if (notification.link) {
        router.push(notification.link);
      }
    });
  };

  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      if (!latestNotification.is_read) {
        showNewNotification(latestNotification);
      }
    }
  }, [notifications]);

  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 w-full z-40">
      <div className="flex justify-between items-center px-4 sm:px-8 py-2 max-w-screen-xl mx-auto">
        {/* Логотип */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/logo.svg"
            alt="TravelShare Logo"
            width={160}
            height={50}
            priority
            className="h-10 sm:h-12 w-auto object-contain"
          />
        </Link>

        {/* Поиск + Уведомления + Профиль (на десктопе) */}
        <div className="hidden md:flex items-center gap-2">
          <div className="relative flex items-center mr-4">
            <button
              className="p-2 text-gray-500 hover:text-gray-600"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-0 p-2 border border-gray-200 rounded-lg transition-all duration-300 opacity-0 ${
                  isSearchOpen ? 'w-[200px] sm:w-[300px] opacity-100' : ''
                } focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100`}
              />
              {suggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-2 shadow-md z-10 max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
              {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
            </form>
          </div>

          {isAuth && (
            <Link href="/notifications" className="relative mr-4 p-2 rounded-lg hover:bg-blue-50 transition-colors">
              <svg
                className="w-6 h-6 text-gray-600 hover:text-blue-500 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold min-w-[1.25rem] h-5 rounded-full flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          {loading ? (
            <div className="text-gray-500">Загрузка...</div>
          ) : isAuth ? (
            <div className="flex items-center gap-3">
              <Link href="/profile" className="relative">
                <Image
                  src={user?.avatar || `${config.url}/storage/avatars/default.jpg`}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="rounded-full object-cover w-10 h-10"
                />
              </Link>
              <Link href="/profile" className="text-gray-600 hidden sm:block">
                {user?.name || 'Пользователь'}
              </Link>
            </div>
          ) : (
            <Link href="/auth/login">
              <button className="bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-600 transition-colors">
                Вход
              </button>
            </Link>
          )}
        </div>

        {/* Мобильное меню */}
        <div className="md:hidden flex items-center gap-4">
          {isAuth && (
            <Link href="/notifications" className="relative p-2 rounded-lg">
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-semibold min-w-[1.25rem] h-5 rounded-full flex items-center justify-center px-1">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* Кнопка меню для мобильных */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-600 focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Мобильное меню */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg rounded-b-lg absolute top-16 left-0 right-0 p-4 space-y-3">
          {/* Поле поиска на мобильном */}
          <div className="relative mb-4">
            <form onSubmit={handleSearch} className="flex items-center">
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              />
              <button type="submit" className="ml-2 p-2 bg-indigo-500 text-white rounded-lg">
                Поиск
              </button>
            </form>
            {suggestions.length > 0 && (
              <ul className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-lg mt-2 max-h-40 overflow-y-auto z-50">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
            {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
          </div>

          {/* Меню на мобильном */}
          <div className="flex flex-col space-y-2">
            {isAuth ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded"
                >
                  <Image
                    src={user?.avatar || `${config.url}/storage/avatars/default.jpg`}
                    alt="Avatar"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span>{user?.name || 'Профиль'}</span>
                </Link>

                <Link
                  href="/notifications"
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded relative"
                >
                  <span>Уведомления</span>
                  {unreadCount > 0 && (
                    <span className="absolute right-4 top-2 bg-red-500 text-white text-xs font-semibold min-w-[1.25rem] h-5 rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-100 rounded"
                >
                  Выход
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="block text-center px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}