'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FaUser, FaCog, FaGavel, FaBell, FaExclamationTriangle, FaChartLine, FaUserShield, FaClipboardList, FaBook } from 'react-icons/fa';
import axios from 'axios';
import config from '@/pages/api/config';
import { isAuthenticated } from '@/utils/auth';
import SidebarButton from './SidebarButton';
import SubscriptionsMenu from './SubscriptionsMenu';
import DiscussionsMenu from './DiscussionsMenu';

const Sidebar = React.memo(() => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [discussionSubscriptions, setDiscussionSubscriptions] = useState([]);
  const [archiveSubscriptions, setArchiveSubscriptions] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [published, setPublished] = useState([]);
  const [pending, setPending] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [loading, setLoading] = useState(true);

  const isActive = (path) => pathname === path;

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

  const fetchUserSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || user?.role === 'moderator') return;

      const response = await axios.get(`${config.apiUrl}/subscriptions/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserSubscriptions(response.data.subscriptions || []);
    } catch (err) {
      console.error('Ошибка загрузки подписок на пользователей:', err.response?.data || err.message);
    }
  };

  const fetchDiscussionSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || user?.role === 'moderator') return;

      const response = await axios.get(`${config.apiUrl}/subscriptions/discussions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDiscussionSubscriptions(response.data.subscriptions || []);
    } catch (err) {
      console.error('Ошибка загрузки подписок на обсуждения:', err.response?.data || err.message);
    }
  };

  const fetchArchiveSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || user?.role === 'moderator') return;

      const response = await axios.get(`${config.apiUrl}/discussions/archived`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setArchiveSubscriptions(response.data.discussions || []);
    } catch (err) {
      console.error('Ошибка загрузки архивированных подписок:', err.response?.data || err.message);
    }
  };

  const fetchDiscussions = async () => {
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

      setDrafts(draftsRes.data.discussions || []);
      setPublished(publishedRes.data.discussions || []);
      setPending(pendingRes.data.discussions || []);
      setRejected(rejectedRes.data.discussions || []);
    } catch (err) {
      console.error('Общая ошибка загрузки обсуждений:', err.response?.data || err.message);
    }
  };

  const fetchNotifications = async () => {
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
      setUnreadNotifications(unreadCount);
    } catch (err) {
      console.error('Ошибка загрузки уведомлений:', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchDiscussions();
      fetchUserSubscriptions();
      fetchDiscussionSubscriptions();
      fetchArchiveSubscriptions();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading) {
    return <div className="w-64 bg-gray-100 p-4 shadow-md">Загрузка...</div>;
  }

  return (
    <aside className="bg-gray-100 w-64 h-[calc(100vh-64px)] p-4 shadow-md overflow-y-auto hide-scrollbar">
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
          <SidebarButton
            isActive={isActive('/admin/tests')}
            onClick={() => router.push('/admin/tests')}
            icon={FaClipboardList}
          >
            Тесты
          </SidebarButton>
        </>
      )}

      {user.role === 'user' && (
        <SidebarButton
          isActive={isActive('/tests')}
          onClick={() => router.push('/tests')}
          icon={FaBook}
        >
          Тесты
        </SidebarButton>
      )}

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

export default Sidebar;