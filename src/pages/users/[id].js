import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import config from '@/pages/api/config';
import UserProfile from '@/components/user_page/UserProfile';
import UserDiscussions from '@/components/user_page/UserDiscussions';
import SubscriptionButton from '@/components/user_page/SubscriptionButton';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import ErrorMessage from '@/components/error/ErrorMessage';
import MainLayout from "@/layouts/main.layout";
import ReportButton from "@/components/user_page/ReportButton";
import UserProfileActions from "@/components/user_page/userProfileAction";

export default function UserProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleReport = useCallback(() => {
    console.log('Жалоба на пользователя', id, 'отправлена');
  }, [id]);

  const [hasReported, setHasReported] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        console.log('Token:', token);
        if (!token) {
          setError('Требуется авторизация');
          setLoading(false);
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        };

        // Загрузка данных текущего пользователя
        let currentUser = null;
        try {
          const currentUserResponse = await axios.get(`${config.apiUrl}/user`, { headers });
          currentUser = currentUserResponse.data;
          setCurrentUserId(currentUser.id);
          console.log('Current user:', currentUser);
        } catch (err) {
          console.error('Ошибка загрузки текущего пользователя:', err.response?.data || err.message);
          localStorage.removeItem('token');
          setError('Сессия истекла. Пожалуйста, войдите снова');
          router.push('/login');
          return;
        }

        // Загрузка подписок текущего пользователя
        let userSubscriptions = [];
        try {
          const subscriptionsResponse = await axios.get(`${config.apiUrl}/subscriptions/users`, { headers });
          userSubscriptions = subscriptionsResponse.data.subscriptions || [];
          console.log('User subscriptions:', userSubscriptions);
        } catch (err) {
          console.error('Ошибка загрузки подписок:', err.response?.data || err.message);
        }

        const [userResponse, discussionsResponse] = await Promise.all([
          axios.get(`${config.apiUrl}/users/${id}`, { headers }),
          axios.get(`${config.apiUrl}/users/${id}/discussions`, { headers }),
        ]);

        console.log('User response:', userResponse.data);
        setUser(userResponse.data.user);
        setDiscussions(discussionsResponse.data.discussions || []);

        // Проверка isSubscribed из ответа или подписок
        const isUserSubscribed = userResponse.data.isSubscribed || userSubscriptions.some(
          (sub) => sub.type === 'user' && sub.user.id === parseInt(id)
        );
        setIsSubscribed(isUserSubscribed);
        console.log('isSubscribed set to:', isUserSubscribed);
      } catch (err) {
        console.error('Ошибка загрузки данных:', err.response?.data || err.message);
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
      console.log('Subscription updated:', { isSubscribed: !isSubscribed });
    } catch (err) {
      console.error('Ошибка подписки:', err.response?.data || err.message);
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

        // Проверяем, что reports существует
        const reports = response.data.groups || [];
        const reported = reports.some(
          r => r.reportable_id === parseInt(id)
        );
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto space-y-8">
          <div className="bg-white rounded-xl shadow-md p-6 transition-all hover:shadow-lg relative">
            <UserProfile user={user}/>
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
          <UserDiscussions discussions={discussions}/>
          {error && <ErrorMessage message={error}/>}
        </div>
      </div>
    </MainLayout>
  );
}