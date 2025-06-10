'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import config from '@/pages/api/config';
import MainLayout from "@/layouts/main.layout";
import DiscussionCard from '@/components/DiscussionCard';

export default function Search() {
  const router = useRouter();
  const { query } = router.query;
  const [discussions, setDiscussions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${config.apiUrl}/search`, {
          params: { query },
        });
        setDiscussions(response.data.discussions);
      } catch (err) {
        console.error('Search error:', err.response?.data);
        setError(err.response?.data?.message || 'Ошибка поиска. Проверьте соединение с сервером.');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  const handleDiscussionClick = async (discussionId) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.get(`${config.apiUrl}/discussions/${discussionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      router.push(`/discussions/${discussionId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при открытии обсуждения');
    }
  };

  return (
    <MainLayout>
      <div className="flex min-h-screen bg-primary-bg">
        <main className="flex-1 p-3 mt-12 sm:p-8">
          <div className="bg-form-bg rounded-2xl p-2 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-2 sm:mb-4">
              Результаты поиска: {query}
            </h2>
            {loading && <p className="text-text-secondary text-center mb-4">Загрузка...</p>}
            {error && <p className="text-error-text text-center mb-4">{error}</p>}
            {!loading && discussions.length === 0 ? (
              <p className="text-text-secondary text-center">Ничего не найдено.</p>
            ) : (
              <ul className="space-y-4">
                {discussions.map((discussion) => (
                  <DiscussionCard key={discussion.id} discussion={discussion} />
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </MainLayout>
  );
}