'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import config from '@/pages/api/config';

export default function PopularContent({ user, selectedCategory }) {
  const router = useRouter();
  const [tags, setTags] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopularData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Получаем популярные теги
        const tagsResponse = await axios.get(`${config.apiUrl}/popular-tags`, {
          headers,
          params: selectedCategory ? { category_id: selectedCategory } : {},
        });
        setTags(tagsResponse.data.tags || []);

        // Получаем обсуждения
        const endpoint = token ? '/personalized-discussions' : '/popular-discussions';
        const discussionsResponse = await axios.get(`${config.apiUrl}${endpoint}`, {
          headers,
          params: selectedCategory ? { category_id: selectedCategory } : {},
        });
        console.log('Discussions response:', discussionsResponse.data);
        setDiscussions(discussionsResponse.data.discussions || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    fetchPopularData();
  }, [selectedCategory, user]);

  const handleDiscussionClick = async (discussionId) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.get(`${config.apiUrl}/discussions/${discussionId}`);
      }
      router.push(`/discussions/${discussionId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при открытии обсуждения');
    }
  };

  // Функция для обрезки текста
  const truncateText = (text, maxLength = 200) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Получение текстового контента
  const getTextContent = (media) => {
    if (media.type !== 'text') return null;
    if (typeof media.content === 'string') return media.content;
    return media.content?.text_content || media.content?.text || null;
  };

  if (loading) {
    return <div className="text-center p-8">Загрузка...</div>;
  }

  return (
    <div className="flex-1">
      <style jsx>{`
          .media-text {
              font-size: 0.875rem;
              color: #4b5563;
              white-space: normal;
              overflow-wrap: break-word;
              word-break: break-word;
              max-width: 100%;
              margin-bottom: 1rem;
          }
      `}</style>
      {/* Популярные теги */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Популярные теги</h2>
        {error && <p className="text-error-text text-center mb-4">{error}</p>}
        {tags.length === 0 ? (
          <p className="text-text-secondary text-center">Теги отсутствуют.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => router.push(`/tags/${tag.name}`)}
                className="bg-form-bg text-text-primary px-3 py-1 rounded-full shadow-md hover:bg-button-hover transition-colors"
              >
                {tag.name} ({tag.discussions_count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Обсуждения */}
      <div className="bg-form-bg rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          {user ? 'Рекомендуемые обсуждения' : 'Популярные обсуждения'}
        </h2>
        {discussions.length === 0 ? (
          <p className="text-text-secondary text-center">Обсуждения отсутствуют.</p>
        ) : (
          <ul className="space-y-4">
            {discussions.map((discussion) => (
              <li
                key={discussion.id}
                className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleDiscussionClick(discussion.id)}
              >
                <h3 className="text-lg font-semibold text-text-primary">{discussion.title}</h3>
                {discussion.description && (
                  <p className="text-text-secondary mt-1">
                    {truncateText(discussion.description, 200)}
                  </p>
                )}
                <div className="mt-2 space-y-2">
                  {discussion.media && discussion.media.length > 0 ? (
                    discussion.media.map((media) => {
                      console.log('Media:', media); // Отладка структуры медиа
                      const textContent = getTextContent(media);
                      return (
                        <div key={media.id}>
                          {media.type === 'text' && textContent && (
                            <p className="media-text">{truncateText(textContent, 200)}</p>
                          )}
                          {media.type === 'image' && media.content?.image_url && (
                            <img
                              src={media.content.image_url}
                              alt="Discussion Image"
                              className="w-full h-48 object-cover rounded-lg"
                              onError={(e) => {
                                console.error(`Ошибка загрузки изображения: ${media.content.image_url}`);
                                e.target.src = 'https://placehold.co/600x400';
                              }}
                            />
                          )}
                          {media.type === 'video' && media.content?.video_url && (
                            <video
                              src={media.content.video_url}
                              controls
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          )}
                          {media.type === 'audio' && media.content?.music_url && (
                            <audio
                              src={media.content.music_url}
                              controls
                              className="w-full"
                            />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-sm">Медиа отсутствуют</p>
                  )}
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
                        className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full"
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