'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FaUser, FaCog, FaGavel, FaBell, FaExclamationTriangle, FaChartLine, FaUserShield, FaHome } from 'react-icons/fa';
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

// Простая функция debounce
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const Sidebar = React.memo(({ toggleSidebar }) => {
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
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);

  const requestInProgress = useRef(false);
  const isMounted = useRef(false);

  const isActive = (path) => pathname === path;

  // Проверка аутентификации
  const checkAuth = useCallback(async () => {
    const { authenticated, user } = await isAuthenticated();
    if (!authenticated) {
      router.push('/auth/login');
    } else {
      console.log('Пользователь аутентифицирован:', user);
      setUser(user);
      setLoading(false);
    }
  }, [router]);

  // Проверка необходимости обновления данных
  const shouldFetchData = () => {
    const now = Date.now();
    return !sidebarCache.lastFetchTime || now - sidebarCache.lastFetchTime > sidebarCache.CACHE_DURATION;
  };

  // Получение подписок (аналогично обсуждениям)
  const fetchSubscriptions = useCallback(async () => {
    if (!user || user.role === 'moderator' || requestInProgress.current || !shouldFetchData()) return;
    requestInProgress.current = true;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Токен отсутствует, подписки не загружаются');
        setUserSubscriptions([]);
        setDiscussionSubscriptions([]);
        setArchiveSubscriptions([]);
        return;
      }
      console.log('Запрос подписок...');
      const endpoints = ['/subscriptions/users', '/subscriptions/discussions', '/discussions/archived'];
      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          axios
            .get(`${config.apiUrl}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch((err) => ({
              error: err,
              endpoint,
              data: { subscriptions: [], discussions: [] },
            }))
        )
      );
      const [userSubsRes, discussionSubsRes, archiveSubsRes] = responses;
      if (userSubsRes.error) console.error('Ошибка загрузки подписок на пользователей:', userSubsRes.error.response?.data || userSubsRes.error.message);
      if (discussionSubsRes.error) console.error('Ошибка загрузки подписок на обсуждения:', discussionSubsRes.error.response?.data || discussionSubsRes.error.message);
      if (archiveSubsRes.error) console.error('Ошибка загрузки архивированных подписок:', archiveSubsRes.error.response?.data || archiveSubsRes.error.message);
      const newUserSubscriptions = userSubsRes.data.subscriptions || [];
      const newDiscussionSubscriptions = discussionSubsRes.data.subscriptions || [];
      const newArchiveSubscriptions = archiveSubsRes.data.discussions || [];
      console.log('Получены подписки:', {
        userSubscriptions: newUserSubscriptions,
        discussionSubscriptions: newDiscussionSubscriptions,
        archiveSubscriptions: newArchiveSubscriptions,
      });
      sidebarCache.userSubscriptions = newUserSubscriptions;
      sidebarCache.discussionSubscriptions = newDiscussionSubscriptions;
      sidebarCache.archiveSubscriptions = newArchiveSubscriptions;
      sidebarCache.lastFetchTime = Date.now();
      setUserSubscriptions(newUserSubscriptions);
      setDiscussionSubscriptions(newDiscussionSubscriptions);
      setArchiveSubscriptions(newArchiveSubscriptions);
    } catch (err) {
      console.error('Общая ошибка загрузки подписок:', err.response?.data || err.message);
      setUserSubscriptions([]);
      setDiscussionSubscriptions([]);
      setArchiveSubscriptions([]);
    } finally {
      requestInProgress.current = false;
    }
  }, [user]);

  // Получение обсуждений
  const fetchDiscussions = useCallback(async () => {
    if (!user || requestInProgress.current || !shouldFetchData()) return;
    requestInProgress.current = true;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Токен отсутствует, обсуждения не загружаются');
        setDrafts([]);
        setPublished([]);
        setPending([]);
        setRejected([]);
        return;
      }
      console.log('Запрос обсуждений...');
      const endpoints = ['/discussions/drafts', '/discussions/published', '/discussions/pending', '/discussions/rejected'];
      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          axios
            .get(`${config.apiUrl}${endpoint}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch((err) => ({
              error: err,
              endpoint,
              data: { discussions: [] },
            }))
        )
      );
      const [draftsRes, publishedRes, pendingRes, rejectedRes] = responses;
      if (draftsRes.error) console.error('Ошибка загрузки черновиков:', draftsRes.error.response?.data || draftsRes.error.message);
      if (publishedRes.error) console.error('Ошибка загрузки опубликованных обсуждений:', publishedRes.error.response?.data || publishedRes.error.message);
      if (pendingRes.error) console.error('Ошибка загрузки ожидающих обсуждений:', pendingRes.error.response?.data || pendingRes.error.message);
      if (rejectedRes.error) console.error('Ошибка загрузки отклонённых обсуждений:', rejectedRes.error.response?.data || rejectedRes.error.message);
      const newDrafts = draftsRes.data.discussions || [];
      const newPublished = publishedRes.data.discussions || [];
      const newPending = pendingRes.data.discussions || [];
      const newRejected = rejectedRes.data.discussions || [];
      console.log('Получены обсуждения:', { drafts: newDrafts, published: newPublished, pending: newPending, rejected: newRejected });
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
      setDrafts([]);
      setPublished([]);
      setPending([]);
      setRejected([]);
    } finally {
      requestInProgress.current = false;
    }
  }, [user]);

  // Получение уведомлений с debounce
  const fetchNotifications = useCallback(
    debounce(async () => {
      if (requestInProgress.current || !shouldFetchData()) return;
      requestInProgress.current = true;
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('Токен отсутствует, уведомления не загружаются');
          setUnreadNotifications(0);
          return;
        }
        console.log('Запрос уведомлений...');
        const response = await axios.get(`${config.apiUrl}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const notifications = response.data.notifications || [];
        const unreadCount = notifications.filter((notification) => !notification.is_read).length;
        console.log('Получены уведомления:', { unreadCount });
        sidebarCache.unreadNotifications = unreadCount;
        sidebarCache.lastFetchTime = Date.now();
        setUnreadNotifications(unreadCount);
      } catch (err) {
        console.error('Ошибка загрузки уведомлений:', err.response?.data || err.message);
        setUnreadNotifications(0);
      } finally {
        requestInProgress.current = false;
      }
    }, 1000),
    []
  );

  // Проверка аутентификации при монтировании
  useEffect(() => {
    if (!isMounted.current) {
      resetSidebarCache(); // Сбрасываем кэш при монтировании
      checkAuth();
      isMounted.current = true;
    }
  }, [checkAuth]);

  // Загрузка данных при наличии пользователя
  useEffect(() => {
    if (!user) {
      resetSidebarCache();
      return;
    }
    console.log('Роль пользователя:', user.role);
    const fetchData = async () => {
      setLoadingSubscriptions(true);
      try {
        await Promise.all([
          fetchNotifications(),
          user.role === 'user' && fetchDiscussions(),
          user.role === 'user' && fetchSubscriptions(),
        ].filter(Boolean));
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
      } finally {
        setLoadingSubscriptions(false);
      }
    };
    fetchData();
    let interval;
    if (user.role === 'user') {
      interval = setInterval(fetchNotifications, 60000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, fetchNotifications, fetchDiscussions, fetchSubscriptions]);

  if (loading) {
    return <div className="w-64 bg-gray-100 p-4 pt-8 shadow-md">Загрузка...</div>;
  }

  return (
    <aside className="fixed z-10 w-full h-full bg-gray-100 p-4 pt-12 sm:pt-8 shadow-md sm:w-64">
      <SidebarButton
        isActive={isActive('/')}
        onClick={() => {
          router.push('/');
          toggleSidebar?.();
        }}
        icon={FaHome}
      >
        Главная
      </SidebarButton>

      <SidebarButton
        isActive={isActive('/profile')}
        onClick={() => {
          router.push('/profile');
          toggleSidebar?.();
        }}
        icon={FaUser}
      >
        Профиль
      </SidebarButton>

      {user?.role === 'user' && (
        <DiscussionsMenu
          isActive={isActive('/discussions')}
          drafts={drafts}
          published={published}
          pending={pending}
          rejected={rejected}
          router={router}
          toggleSidebar={toggleSidebar}
        />
      )}

      {user?.role === 'user' && (
        <SidebarButton
          isActive={isActive('/repliesReport')}
          onClick={() => {
            router.push('/repliesReport');
            toggleSidebar?.();
          }}
          icon={FaBell}
        >
          Жалобы
        </SidebarButton>
      )}

      {user?.role === 'user' && (
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
          toggleSidebar={toggleSidebar}
          loadingSubscriptions={loadingSubscriptions}
        />
      )}

      {user?.role === 'moderator' && (
        <>
          <SidebarButton
            isActive={isActive('/moderation')}
            onClick={() => {
              router.push('/moderation');
              toggleSidebar?.();
            }}
            icon={FaGavel}
          >
            Модерация
          </SidebarButton>
          <SidebarButton
            isActive={isActive('/reports')}
            onClick={() => {
              router.push('/reports');
              toggleSidebar?.();
            }}
            icon={FaExclamationTriangle}
          >
            Жалобы
          </SidebarButton>
        </>
      )}

      <SidebarButton
        isActive={isActive('/admin/dashboard')}
        onClick={() => {
          router.push('/admin/dashboard');
          toggleSidebar?.();
        }}
        icon={FaChartLine}
      >
        Статистика
      </SidebarButton>

      {user?.role === 'admin' && (
        <SidebarButton
          isActive={isActive('/admin/staff')}
          onClick={() => {
            router.push('/admin/staff');
            toggleSidebar?.();
          }}
          icon={FaUserShield}
        >
          Пользователи
        </SidebarButton>
      )}

      {user?.role === 'user' && (
        <SidebarButton
          isActive={isActive('/notifications')}
          onClick={() => {
            router.push('/notifications');
            toggleSidebar?.();
          }}
          icon={FaBell}
          badge={unreadNotifications}
        >
          Уведомления
        </SidebarButton>
      )}

      <SidebarButton
        isActive={isActive('/settings')}
        onClick={() => {
          router.push('/settings');
          toggleSidebar?.();
        }}
        icon={FaCog}
      >
        Настройки
      </SidebarButton>
    </aside>
  );
});

// Функция для сброса кэша
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