'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import axios from 'axios';
import config from '@/pages/api/config';
import SidebarLayout from '@/layouts/sidebar.layout';
import LoadingIndicator from '@/components/loader/LoadingIndicator';

export default function DiscussionSubscriptionsPage() {
  const [user, setUser] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const { authenticated, user } = await isAuthenticated();
      if (!authenticated) {
        router.push('/auth/login');
        return;
      }

      setUser(user);
      try {
        const response = await axios.get(`${config.apiUrl}/subscriptions/discussions`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setSubscriptions(response.data.subscriptions || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Ошибка загрузки подписок');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [router]);

  if (loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <SidebarLayout>
      <div className="mt-6 m-3 sm:mt-0">
        <h2 className="text-xl sm:text-2xl mb-3 font-bold text-gray-900">Подписки на обсуждения</h2>
        {subscriptions.length === 0 ? (
          <p className="text-gray-600">Вы не подписаны ни на одно обсуждение.</p>
        ) : (
          <ul className="space-y-4">
            {subscriptions.map((sub) => (
              <li
                key={sub.id}
                className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/discussions/${sub.discussion.id}`)}
              >
                <span className="text-lg text-gray-800">{sub.discussion.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SidebarLayout>
);
}