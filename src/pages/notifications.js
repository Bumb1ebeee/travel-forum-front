'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import config from '@/pages/api/config';
import SidebarLayout from '@/layouts/sidebar.layout';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import Head from 'next/head';

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
          router.push('/auth/login');
          return;
        }

        const response = await axios.get(`${config.apiUrl}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedNotifications = response.data.notifications || [];
        setNotifications(fetchedNotifications);

        // Помечаем непрочитанные уведомления как прочитанные
        const unreadNotifications = fetchedNotifications.filter(notif => !notif.is_read);
        if (unreadNotifications.length > 0) {
          await Promise.all(
            unreadNotifications.map(async (notif) => {
              try {
                await axios.patch(
                  `${config.apiUrl}/notifications/${notif.id}/read`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
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
        setError(err.response?.data?.message || 'Ошибка загрузки уведомлений');
        if (err.response?.status === 401) {
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [router]);

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

  const filteredNotifications = showOnlyUnread
    ? notifications.filter((notif) => !notif.is_read)
    : notifications;

  const pageUrl = 'http://45.153.191.235/notifications';

  if (loading) return <LoadingIndicator />;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <>
      <Head>
        <title>Уведомления | Форум путешествий по России</title>
        <meta name="description" content="Просмотр ваших уведомлений на форуме путешествий по России." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Уведомления | Форум путешествий по России" />
        <meta property="og:description" content="Просмотр ваших уведомлений на форуме путешествий по России." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:site_name" content="Форум путешествий по России" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={pageUrl} />

        {/* Structured Data / Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Уведомления",
            "description": "Просмотр ваших уведомлений на форуме путешествий по России.",
            "url": pageUrl,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": pageUrl
            },
            "publisher": {
              "@type": "Organization",
              "name": "Форум путешествий по России",
              "logo": {
                "@type": "ImageObject",
                "url": "/logo.png"
              }
            }
          })
        }} />
      </Head>

      <SidebarLayout>
        <main className="p-2 sm:m-4 m-2 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Уведомления</h1>

          <div className="mb-4 flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showOnlyUnread}
                onChange={(e) => setShowOnlyUnread(e.target.checked)}
                className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
              />
              <span className="text-sm text-gray-700">Показать только непрочитанные</span>
            </label>
          </div>

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
        </main>
      </SidebarLayout>
    </>
  );
}