'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FaUser, FaCog, FaGavel, FaBell, FaExclamationTriangle, FaChartLine, FaUserShield, FaClipboardList, FaBook } from 'react-icons/fa';
import axios from 'axios';
import config from '@/pages/api/config';
import { isAuthenticated } from '@/utils/auth';
import SidebarButton from './SidebarButton';
import SubscriptionsMenu from './SubscriptionsMenu';
import DiscussionsMenu from './DiscussionsMenu';

// Глобальный кэш для данных Sidebar
const sidebarCache = {
  userSubscriptions: [],
  discussionSubscriptions: [],
  archiveSubscriptions: [],
  drafts: [],
  published: [],
  pending: [],
  rejected: [],
  unreadNotifications: 0,
  lastFetchTime: null,
  CACHE_DURATION: 5 * 60 * 1000, // 5 минут
};

// Простая функция для debounce
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const Sidebar = React.memo(() => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [userSubscriptions, setUserSubscriptions] = useState(sidebarCache.userSubscriptions);
  const [discussionSubscriptions, setDiscussionSubscriptions] = useState(sidebarCache.discussionSubscriptions);
  const [archiveSubscriptions, setArchiveSubscriptions] = useState(sidebarCache.archiveSubscriptions);
  const [drafts, setDrafts] = useState(sidebarCache.drafts);
  const [published, setPublished] = useState(sidebarCache.published);
  const [pending, setPending] = useState(sidebarCache.pending);
  const [rejected, setRejected] = useState(sidebarCache.rejected);
  const [unreadNotifications, setUnreadNotifications] = useState(sidebarCache.unreadNotifications);
  const [loading, setLoading] = useState(true);
  const requestInProgress = useRef(false); // Флаг для предотвращения параллельных запросов
  const isMounted = useRef(false); // Флаг для отслеживания монтирования

  const isActive = (path) => pathname === path;

  // Проверка аутентификации
  const checkAuth = useCallback(async () => {
    const { authenticated, user } = await isAuthenticated();
    if (!authenticated) {
      router.push('/auth/login');
    } else {
      setUser(user);
      setLoading(false);
    }
  }, [router]);

  // Проверка, нужно ли обновлять данные
  const shouldFetchData = () => {
    const now = Date.now();
    return !sidebarCache.lastFetchTime || now - sidebarCache.lastFetchTime > sidebarCache.CACHE_DURATION;
  };

  // Получение подписок на пользователей
  const fetchUserSubscriptions = useCallback(async () => {
    if (!user || user.role === 'moderator' || userSubscriptions.length > 0 || requestInProgress.current || !shouldFetchData()) {
      return;
    }

    requestInProgress.current = true;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${config.apiUrl}/subscriptions/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subscriptions = response.data.subscriptions || [];
      sidebarCache.userSubscriptions = subscriptions;
      sidebarCache.lastFetchTime = Date.now();
      setUserSubscriptions(subscriptions);
    } catch (err) {
      console.error('Ошибка загрузки подписок на пользователей:', err.response?.data || err.message);
    } finally {
      requestInProgress.current = false;
    }
  }, [user, userSubscriptions.length]);

  // Получение подписок на обсуждения
  const fetchDiscussionSubscriptions = useCallback(async () => {
    if (!user || user.role === 'moderator' || discussionSubscriptions.length > 0 || requestInProgress.current || !shouldFetchData()) {
      return;
    }

    requestInProgress.current = true;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${config.apiUrl}/subscriptions/discussions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subscriptions = response.data.subscriptions || [];
      sidebarCache.discussionSubscriptions = subscriptions;
      sidebarCache.lastFetchTime = Date.now();
      setDiscussionSubscriptions(subscriptions);
    } catch (err) {
      console.error('Ошибка загрузки подписок на обсуждения:', err.response?.data || err.message);
    } finally {
      requestInProgress.current = false;
    }
  }, [user, discussionSubscriptions.length]);

  // Получение архивированных подписок
  const fetchArchiveSubscriptions = useCallback(async () => {
    if (!user || user.role === 'moderator' || archiveSubscriptions.length > 0 || requestInProgress.current || !shouldFetchData()) {
      return;
    }

    requestInProgress.current = true;
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${config.apiUrl}/discussions/archived`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const discussions = response.data.discussions || [];
      sidebarCache.archiveSubscriptions = discussions;
      sidebarCache.lastFetchTime = Date.now();
      setArchiveSubscriptions(discussions);
    } catch (err) {
      console.error('Ошибка загрузки архивированных подписок:', err.response?.data || err.message);
    } finally {
      requestInProgress.current = false;
    }
  }, [user, archiveSubscriptions.length]);

  // Получение обсуждений
  const fetchDiscussions = useCallback(async () => {
    if (!user || (drafts.length > 0 && published.length > 0 && pending.length > 0 && rejected.length > 0) || requestInProgress.current || !shouldFetchData()) {
      return;
    }

    requestInProgress.current = true;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Токен отсутствует, обсуждения не загружаются');
        return;
      }

      const endpoints = [
        '/discussions/drafts',
        '/discussions/published',
        '/discussions/pending',
        '/discussions/rejected',
      ];

      const responses = await Promise.all(
        endpoints.map(endpoint =>
          axios.get(`${config.apiUrl}${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(err => ({
            error: err,
            endpoint,
            data: { discussions: [] },
          }))
        )
      );

      const [draftsRes, publishedRes, pendingRes, rejectedRes] = responses;

      if (draftsRes.error) {
        console.error('Ошибка загрузки черновиков:', draftsRes.error.response?.data || draftsRes.error.message);
      }
      if (publishedRes.error) {
        console.error('Ошибка загрузки опубликованных обсуждений:', publishedRes.error.response?.data || publishedRes.error.message);
      }
      if (pendingRes.error) {
        console.error('Ошибка загрузки ожидающих обсуждений:', pendingRes.error.response?.data || pendingRes.error.message);
      }
      if (rejectedRes.error) {
        console.error('Ошибка загрузки отклонённых обсуждений:', rejectedRes.error.response?.data || rejectedRes.error.message);
      }

      const newDrafts = draftsRes.data.discussions || [];
      const newPublished = publishedRes.data.discussions || [];
      const newPending = pendingRes.data.discussions || [];
      const newRejected = rejectedRes.data.discussions || [];

      sidebarCache.drafts = newDrafts;
      sidebarCache.published = newPublished;
      sidebarCache.pending = newPending;
      sidebarCache.rejected = newRejected;
      sidebarCache.lastFetchTime = Date.now();

      setDrafts(newDrafts);
      setPublished(newPublished);
      setPending(newPending);
      setRejected(newRejected);
    } catch (err) {
      console.error('Общая ошибка загрузки обсуждений:', err.response?.data || err.message);
    } finally {
      requestInProgress.current = false;
    }
  }, [user, drafts.length, published.length, pending.length, rejected.length]);

  // Получение уведомлений с debounce
  const fetchNotifications = useCallback(
    debounce(async () => {
      if (requestInProgress.current || !shouldFetchData()) return;

      requestInProgress.current = true;
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('Токен отсутствует, уведомления не загружаются');
          return;
        }

        const response = await axios.get(`${config.apiUrl}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const notifications = response.data.notifications || [];
        const unreadCount = notifications.filter(notification => !notification.is_read).length;
        sidebarCache.unreadNotifications = unreadCount;
        sidebarCache.lastFetchTime = Date.now();
        setUnreadNotifications(unreadCount);
      } catch (err) {
        console.error('Ошибка загрузки уведомлений:', err.response?.data || err.message);
      } finally {
        requestInProgress.current = false;
      }
    }, 1000), // Задержка 1 секунда
    []
  );

  // Проверка аутентификации при монтировании
  useEffect(() => {
    if (!isMounted.current) {
      checkAuth();
      isMounted.current = true;
    }
  }, [checkAuth]);

  // Загрузка данных при наличии пользователя
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      await Promise.all([
        fetchNotifications(),
        user.role === 'user' && fetchDiscussions(),
        user.role === 'user' && fetchUserSubscriptions(),
        user.role === 'user' && fetchDiscussionSubscriptions(),
        user.role === 'user' && fetchArchiveSubscriptions(),
      ].filter(Boolean));
    };

    fetchData();

    // Установка интервала для уведомлений только для пользователей
    let interval;
    if (user.role === 'user') {
      interval = setInterval(fetchNotifications, 60000); // 60 секунд
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, fetchNotifications, fetchDiscussions, fetchUserSubscriptions, fetchDiscussionSubscriptions, fetchArchiveSubscriptions]);

  if (loading) {
    return <div className="w-64 bg-gray-100 p-4 shadow-md">Загрузка...</div>;
  }

  return (
    <aside className="w-64 h-[calc(100vh-64px)] bg-gray-100 p-4 shadow-md overflow-y-auto scrollbar-hidden">
      <SidebarButton
        isActive={isActive('/profile')}
        onClick={() => router.push('/profile')}
        icon={FaUser}
      >
        Профиль
      </SidebarButton>

      {user.role === 'user' && (
        <DiscussionsMenu
          isActive={isActive('/discussions')}
          drafts={drafts}
          published={published}
          pending={pending}
          rejected={rejected}
          router={router}
        />
      )}

      {user.role === 'user' && (
        <SubscriptionsMenu
          isActive={
            isActive('/subscriptions/users') ||
            isActive('/subscriptions/discussions') ||
            isActive('/subscriptions/archive')
          }
          userSubscriptions={userSubscriptions}
          discussionSubscriptions={discussionSubscriptions}
          archiveSubscriptions={archiveSubscriptions}
          router={router}
        />
      )}

      {user.role === 'moderator' && (
        <>
          <SidebarButton
            isActive={isActive('/moderation')}
            onClick={() => router.push('/moderation')}
            icon={FaGavel}
          >
            Модерация
          </SidebarButton>

          <SidebarButton
            isActive={isActive('/reports')}
            onClick={() => router.push('/reports')}
            icon={FaExclamationTriangle}
          >
            Жалобы
          </SidebarButton>
        </>
      )}
      <SidebarButton
        isActive={isActive('/admin/dashboard')}
        onClick={() => router.push('/admin/dashboard')}
        icon={FaChartLine}
      >
        Статистика
      </SidebarButton>

      {user.role === 'admin' && (
        <>
          <SidebarButton
            isActive={isActive('/admin/staff')}
            onClick={() => router.push('/admin/staff')}
            icon={FaUserShield}
          >
            Сотрудники
          </SidebarButton>
          {/*<SidebarButton*/}
          {/*  isActive={isActive('/admin/tests')}*/}
          {/*  onClick={() => router.push('/admin/tests')}*/}
          {/*  icon={FaClipboardList}*/}
          {/*>*/}
          {/*  Тесты*/}
          {/*</SidebarButton>*/}
        </>
      )}

      {/*{user.role === 'user' && (*/}
      {/*  <SidebarButton*/}
      {/*    isActive={isActive('/tests')}*/}
      {/*    onClick={() => router.push('/tests')}*/}
      {/*    icon={FaBook}*/}
      {/*  >*/}
      {/*    Тесты*/}
      {/*  </SidebarButton>*/}
      {/*)}*/}

      {user.role === 'user' && (
        <SidebarButton
          isActive={isActive('/notifications')}
          onClick={() => router.push('/notifications')}
          icon={FaBell}
          badge={unreadNotifications}
        >
          Уведомления
        </SidebarButton>
      )}

      <SidebarButton
        isActive={isActive('/settings')}
        onClick={() => router.push('/settings')}
        icon={FaCog}
      >
        Настройки
      </SidebarButton>
    </aside>
  );
});

// Функция для сброса кэша (например, при выходе или изменении данных)
export const resetSidebarCache = () => {
  sidebarCache.userSubscriptions = [];
  sidebarCache.discussionSubscriptions = [];
  sidebarCache.archiveSubscriptions = [];
  sidebarCache.drafts = [];
  sidebarCache.published = [];
  sidebarCache.pending = [];
  sidebarCache.rejected = [];
  sidebarCache.unreadNotifications = 0;
  sidebarCache.lastFetchTime = null;
};

export default Sidebar;