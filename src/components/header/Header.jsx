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
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { authenticated, user } = await isAuthenticated();
      setIsAuth(authenticated);
      setUser(user);
      setLoading(false);
    };
    checkAuth();
  }, []);

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
        setSuggestions(response.data.suggestions);
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
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuth]);

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
    <header className="flex justify-between items-center px-8 py-2 bg-white shadow-sm">
      <div className="flex justify-between items-center w-full max-w-screen-4xl mx-auto">
        <Link href="/">
          <Image
            src="/logo.svg"
            alt="TravelShare Logo"
            width={180}
            height={60}
            priority
            className="h-[60px] w-auto object-contain"
          />
        </Link>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <button
              className="p-2 text-gray-500 hover:text-gray-600"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-0 p-2 border border-gray-200 rounded-lg transition-all duration-300 opacity-0 ${isSearchOpen ? 'w-[300px] opacity-100' : ''} focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100`}
              />
              {suggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-2 shadow-md z-10">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-4 py-3 cursor-pointer hover:bg-gray-100"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
              {error && (
                <p className="text-red-600 text-sm mt-1">{error}</p>
              )}
            </form>
          </div>

          {isAuth && (
            <Link href="/notifications" className="flex items-center mr-4 p-2 rounded-lg hover:bg-blue-50 transition-colors">
              <div className="relative">
                <svg
                  className="w-6 h-6 text-gray-600 hover:text-blue-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
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
              </div>
            </Link>
          )}

          {loading ? (
            <div className="text-gray-500 text-sm">Загрузка...</div>
          ) : isAuth ? (
            <div className="flex items-center gap-3">
              <Link href="/profile">
                <Image
                  src={user?.avatar || '/default-avatar.png'}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              </Link>
              <Link href="/profile">
                <span className="text-gray-600 text-sm">{user?.name || 'Пользователь'}</span>
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
      </div>
    </header>
  );
}