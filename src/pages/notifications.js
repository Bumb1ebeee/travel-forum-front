'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import config from '@/pages/api/config';
import SidebarLayout from '@/layouts/sidebar.layout';
import LoadingIndicator from '@/components/loader/LoadingIndicator';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Получение уведомлений и автоматическая пометка как прочитанных
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('Токен отсутствует, редирект на логин');
          router.push('/auth/login');
          return;
        }

        console.log('Запрос уведомлений с токеном:', token);
        const response = await axios.get(`${config.apiUrl}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Notifications response:', response.data);
        const fetchedNotifications = response.data.notifications || [];
        setNotifications(fetchedNotifications);

        // Помечаем все непрочитанные уведомления как прочитанные
        const unreadNotifications = fetchedNotifications.filter(notif => !notif.is_read);
        if (unreadNotifications.length > 0) {
          await Promise.all(
            unreadNotifications.map(async (notif) => {
              try {
                await axios.patch(
                  `${config.apiUrl}/notifications/${notif.id}/read`,
                  {},
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );
              } catch (err) {
                console.error(`Ошибка при отметке уведомления ${notif.id}:`, err);
              }
            })
          );

          // Обновляем локальное состояние
          setNotifications((prev) =>
            prev.map((notif) =>
              unreadNotifications.some(unread => unread.id === notif.id)
                ? { ...notif, is_read: true }
                : notif
            )
          );
        }
      } catch (err) {
        console.error('Ошибка загрузки уведомлений:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Ошибка загрузки уведомлений');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [router]);

  // Иконки для типов уведомлений
  const getIconForType = (type) => {
    switch (type) {
      case 'reply_reply':
        return <span className="text-blue-500 mr-2">💬</span>;
      case 'discussion_reply':
        return <span className="text-green-500 mr-2">📝</span>;
      case 'discussion_status':
        return <span className="text-yellow-500 mr-2">⚠️</span>;
      default:
        return <span className="text-gray-500 mr-2">🔔</span>;
    }
  };

  // Фильтрация уведомлений
  const filteredNotifications = showOnlyUnread
    ? notifications.filter((notif) => !notif.is_read)
    : notifications;

  if (loading) return <LoadingIndicator />;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <SidebarLayout>
      <div className="p-2 sm:m-4 m-2 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Уведомления</h1>

        {filteredNotifications.length === 0 ? (
          <p className="text-gray-600">
            {showOnlyUnread ? 'Нет непрочитанных уведомлений.' : 'Нет уведомлений.'}
          </p>
        ) : (
          <ul className="space-y-4">
            {filteredNotifications.map((notification) => (
              <li
                key={notification.id}
                className={`p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer ${
                  notification.is_read ? 'bg-gray-100' : 'bg-white'
                }`}
                onClick={() => router.push(notification.link || '/')}
              >
                <div className="flex items-center">
                  {getIconForType(notification.type)}
                  <div>
                    <p
                      className={`text-lg ${
                        notification.is_read ? 'text-gray-600' : 'text-gray-800 font-semibold'
                      }`}
                    >
                      {notification.message}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(notification.published_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SidebarLayout>
  );
}