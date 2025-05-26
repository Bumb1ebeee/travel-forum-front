'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import config from '@/pages/api/config';

function DiscussionsByTag() {
  const router = useRouter();
  const { tag } = router.query; // Получаем тег из URL
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tag) return; // Ждем, пока tag будет доступен

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

  // Функция для обрезки текста
  const truncateText = (text, maxLength = 200) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return <div className="text-center p-8">Загрузка...</div>;
  }

  return (
    <div className="flex p-8 gap-6 mx-auto max-w-7xl">
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
              <li
                key={discussion.id}
                className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/discussions/${discussion.id}`)}
              >
                <h3 className="text-lg font-semibold text-text-primary">{discussion.title}</h3>
                {discussion.description && (
                  <p className="text-text-secondary mt-1">
                    {truncateText(discussion.description)}
                  </p>
                )}
                <div className="mt-2 space-y-2">
                  {discussion.media &&
                    discussion.media.length > 0 &&
                    discussion.media.map((media) => (
                      <div key={media.id}>
                        {media.type === 'image' && (
                          <img
                            src={media.path}
                            alt="Discussion Image"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        )}
                        {media.type === 'video' && (
                          <video
                            src={media.path}
                            controls
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        )}
                        {media.type === 'audio' && (
                          <audio src={media.path} controls className="w-full" />
                        )}
                      </div>
                    ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Автор: {discussion.user?.name || 'Неизвестный'} | Создано:{' '}
                  {new Date(discussion.created_at).toLocaleDateString()}
                </p>
                {discussion.tags && discussion.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {discussion.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/tags/${tag.name}`);
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default DiscussionsByTag;