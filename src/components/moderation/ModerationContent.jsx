'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/pages/api/config';
import ModerationCard from './ModerationCard';

export default function ModerationContent({ user }) {
  const [discussions, setDiscussions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPendingDiscussions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${config.apiUrl}/pending-discussions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDiscussions(response.data.discussions || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Ошибка загрузки обсуждений');
      }
    };
    fetchPendingDiscussions();
  }, [user]);

  const handleModerate = async (discussionId, status, comment) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${config.apiUrl}/discussions/${discussionId}/moderate`,
        { status, moderator_comment: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDiscussions((prev) => prev.filter((d) => d.id !== discussionId));
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка модерации');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 mt-2">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Модерация обсуждений</h1>
      {error && <p className="text-red-500 text-center mb-6 bg-red-100 p-3 rounded-lg">{error}</p>}
      {discussions.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow-md text-center text-gray-500">
          Нет обсуждений на проверке
        </div>
      ) : (
        <div className="grid gap-6">
          {discussions.map((discussion) => (
            <ModerationCard key={discussion.id} discussion={discussion} onModerate={handleModerate} />
          ))}
        </div>
      )}
    </div>
  );
}