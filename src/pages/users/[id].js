'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import config from '@/pages/api/config';
import UserProfile from '@/components/user_page/UserProfile';
import UserDiscussions from '@/components/user_page/UserDiscussions';
import SubscriptionButton from '@/components/user_page/SubscriptionButton';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import ErrorMessage from '@/components/error/ErrorMessage';
import MainLayout from '@/layouts/main.layout';
import ReportButton from '@/components/user_page/ReportButton';
import UserProfileActions from '@/components/user_page/userProfileAction';
import Head from 'next/head';

export default function UserProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasReported, setHasReported] = useState(false);

  const handleReport = useCallback(() => {
    console.log('Жалоба на пользователя', id, 'отправлена');
  }, [id]);

  const pageUrl = `http://45.153.191.235/users/${id}`;

  useEffect(() => {
    if (!id) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Требуется авторизация');
          setLoading(false);
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Получаем текущего пользователя
        const currentUserResponse = await axios.get(`${config.apiUrl}/user`, { headers });
        setCurrentUserId(currentUserResponse.data.id);

        // Получаем данные пользователя
        const [userResponse, discussionsResponse] = await Promise.all([
          axios.get(`${config.apiUrl}/users/${id}`, { headers }),
          axios.get(`${config.apiUrl}/users/${id}/discussions`, { headers }),
        ]);

        setUser(userResponse.data.user);
        setDiscussions(discussionsResponse.data.discussions || []);

        // Проверяем подписку
        const subscriptionsResponse = await axios.get(`${config.apiUrl}/subscriptions/users`, { headers });
        const userSubscriptions = subscriptionsResponse.data.subscriptions || [];
        const isUserSubscribed = userSubscriptions.some(
          (sub) => sub.type === 'user' && sub.user.id === parseInt(id)
        );
        setIsSubscribed(isUserSubscribed);
      } catch (err) {
        setError(err.response?.data?.message || 'Ошибка загрузки данных пользователя');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, router]);

  const isOwnProfile = currentUserId && user?.id === currentUserId;

  const handleSubscription = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Требуется авторизация');
        router.push('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      if (isSubscribed) {
        await axios.delete(`${config.apiUrl}/subscriptions/${id}`, { headers });
        setIsSubscribed(false);
      } else {
        await axios.post(`${config.apiUrl}/subscriptions/${id}`, {}, { headers });
        setIsSubscribed(true);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Ошибка при изменении подписки';
      setError(message);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    }
  }, [id, isSubscribed, router]);

  useEffect(() => {
    const checkReported = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !id) return;

        const response = await axios.get(`${config.apiUrl}/reports`, {
          params: { type: 'users' },
          headers: { Authorization: `Bearer ${token}` }
        });

        const reports = response.data.groups || [];
        const reported = reports.some(r => r.reportable_id === parseInt(id));
        setHasReported(reported);
      } catch (err) {
        console.error('Ошибка проверки жалобы:', err);
      }
    };

    if (!isOwnProfile) {
      checkReported();
    }
  }, [id, isOwnProfile]);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600 text-xl">Пользователь не найден</div>
      </div>
    );
  }

  const pageTitle = `${user.name} — Форум путешествий по России`;
  const pageDescription = `Профиль пользователя "${user.name}" на форуме путешествий по России. Обсуждения и активность.`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={user.avatar || '/logo.png'} />
        <meta property="profile:username" content={user.username || user.name} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={pageUrl} />

        {/* Structured Data / Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": user.name,
            "url": pageUrl,
            "image": user.avatar || "/logo.png",
            "description": pageDescription,
            "sameAs": [
              `http://45.153.191.235/users/${user.id}`
            ],
            "interactionStatistic": {
              "@type": "InteractionCounter",
              "interactionType": "https://schema.org/UserComments",
              "userInteractionCount": discussions.length
            }
          })
        }} />
      </Head>

      <MainLayout>
        <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto space-y-8">
            <div className="bg-white rounded-xl shadow-md p-6 transition-all hover:shadow-lg relative">
              <UserProfile user={user} />
              {!isOwnProfile && (
                <UserProfileActions
                  userId={user.id}
                  currentUserId={currentUserId}
                  onReport={handleReport}
                />
              )}
              {!isOwnProfile && (
                <div className="mt-4 flex space-x-4">
                  <SubscriptionButton
                    isSubscribed={isSubscribed}
                    handleSubscription={handleSubscription}
                  />
                </div>
              )}
            </div>
            <UserDiscussions discussions={discussions} />
            {error && <ErrorMessage message={error} />}
          </div>
        </main>
      </MainLayout>
    </>
  );
}