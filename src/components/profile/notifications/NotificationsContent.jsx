'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import config from '@/pages/api/config';

export default function NotificationsContent({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Инициализация WebSocket через Laravel Echo
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Настройка Pusher и Laravel Echo
    window.Pusher = Pusher;
    const echo = new Echo({
      broadcaster: 'pusher',
      key: process.env.NEXT_PUBLIC_PUSHER_KEY, // Укажите в .env
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER, // Укажите в .env
      forceTLS: true,
      authEndpoint: `${config.apiUrl}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Подписка на приватный канал уведомлений пользователя
    echo.private(`App.Models.User.${user.id}`).notification((notification) => {
      setNotifications((prev) => [notification, ...prev]); // Добавляем новое уведомление в начало
    });

    // Очистка при размонтировании
    return () => {
      echo.leave(`App.Models.User.${user.id}`);
    };
  }, [user]);

  // Получение начальных уведомлений через REST API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${config.apiUrl}/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setNotifications(response.data.notifications || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Ошибка загрузки уведомлений');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // Пометить уведомление как прочитанное
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${config.apiUrl}/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read_at: new Date().toISOString() } : notif
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при обновлении уведомления');
    }
  };

  if (loading) {
    return <div className="text-center p-8">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">Уведомления</h2>
        {error && (
          <p className="text-red-500 text-center mb-6 bg-red-100 p-3 rounded-lg">{error}</p>
        )}
        {notifications.length === 0 ? (
          <p className="text-gray-600 text-center">Уведомлений нет</p>
        ) : (
          <ul className="space-y-4">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`p-4 rounded-lg shadow-md transition-all ${
                  notification.read_at ? 'bg-gray-50' : 'bg-indigo-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-800 font-medium">{notification.data.message}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read_at && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      Прочитать
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}