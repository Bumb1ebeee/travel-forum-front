// components/Header.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import Image from 'next/image';
import axios from 'axios';
import config from '@/pages/api/config';
import './Header.css';
import '@/styles/common.css';

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

  // Функция для получения уведомлений
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

  // Проверка новых уведомлений каждые 30 секунд
  useEffect(() => {
    if (isAuth) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuth]);

  // Функция для отображения нового уведомления
  const showNewNotification = (notification) => {
    const notificationElement = document.createElement('div');
    notificationElement.className = 'notification-toast';
    notificationElement.innerHTML = `
      <div class="notification-content">
        <p>${notification.message}</p>
      </div>
    `;
    
    document.body.appendChild(notificationElement);
    
    // Добавляем класс для анимации появления
    setTimeout(() => {
      notificationElement.classList.add('show');
    }, 100);

    // Удаляем уведомление через 5 секунд
    setTimeout(() => {
      notificationElement.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notificationElement);
      }, 300);
    }, 5000);

    // Добавляем обработчик клика
    notificationElement.addEventListener('click', () => {
      if (notification.link) {
        router.push(notification.link);
      }
    });
  };

  // Обработка новых уведомлений
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      if (!latestNotification.is_read) {
        showNewNotification(latestNotification);
      }
    }
  }, [notifications]);

  return (
    <header className="header">
      <div className="header-content">
        <Link href="/">
          <Image
            src="/logo.svg"
            alt="TravelShare Logo"
            width={180}
            height={60}
            priority
            className="logo"
            style={{ height: '60px', width: 'auto' }}
          />
        </Link>

        <div className="header-right">
          <div className="search-container">
            <button
              className="search-button"
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
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`search-input ${isSearchOpen ? 'open' : ''}`}
              />
              {suggestions.length > 0 && (
                <ul className="suggestions-list">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
              {error && (
                <p className="error-message">{error}</p>
              )}
            </form>
          </div>

          {isAuth && (
            <Link href="/notifications" className="notifications-link">
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
                  <span className="notification-badge">
                    {unreadCount}
                  </span>
                )}
              </div>
            </Link>
          )}

          {loading ? (
            <div className="loading-text">Загрузка...</div>
          ) : isAuth ? (
            <div className="user-profile">
              <Link href="/profile">
                <Image
                  src={user?.avatar || '/default-avatar.png'}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="user-avatar"
                />
              </Link>
              <Link href="/profile">
                <span className="user-name">{user?.name || 'Пользователь'}</span>
              </Link>
            </div>
          ) : (
            <Link href="/auth/login">
              <button className="login-button">
                Вход
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}