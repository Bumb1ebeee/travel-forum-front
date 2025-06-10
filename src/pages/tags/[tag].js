'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import config from '@/pages/api/config';
import MainLayout from "@/layouts/main.layout";
import DiscussionCard from '@/components/DiscussionCard';

function DiscussionsByTag() {
  const router = useRouter();
  const { tag } = router.query;
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tag) return;

    const fetchDiscussionsByTag = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${config.apiUrl}/discussions-by-tag/${tag}`);
        setDiscussions(response.data.discussions || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Ошибка загрузки обсуждений');
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussionsByTag();
  }, [tag]);

  if (loading) {
    return <div className="text-center p-8">Загрузка...</div>;
  }

  return (
    <MainLayout>
      <div className="flex p-8 pt-12 gap-6 mx-auto max-w-7xl">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-text-primary mb-6">
            Обсуждения по тегу: {tag}
          </h1>
          {error && <p className="text-error-text mb-4">{error}</p>}
          {discussions.length === 0 ? (
            <p className="text-text-secondary text-center">Обсуждения отсутствуют.</p>
          ) : (
            <ul className="space-y-4">
              {discussions.map((discussion) => (
                <DiscussionCard key={discussion.id} discussion={discussion} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default DiscussionsByTag;