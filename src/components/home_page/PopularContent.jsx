'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import config from '@/pages/api/config';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import DiscussionCard from '@/components/DiscussionCard';

export default function PopularContent({ user, selectedCategory: initialCategory }) {
  const router = useRouter();
  const [tags, setTags] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('most_viewed'); // Дефолтное значение соответствует бэкенду
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 10,
  });

  // Функция загрузки данных
  const fetchPopularData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = { page: currentPage, sort_by: sortBy };
      if (initialCategory) params.category_id = initialCategory;

      const endpoint = token ? '/personalized-discussions' : '/popular-discussions';

      console.log('Fetching data with params:', { endpoint, params }); // Для отладки

      const response = await axios.get(`${config.apiUrl}${endpoint}`, {
        headers,
        params,
      });

      setDiscussions(response.data.discussions || []);
      setTags(response.data.tags || []);
      setPagination(response.data.pagination || {
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 10,
      });
      setError('');
    } catch (err) {
      console.error('Error fetching data:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Ошибка загрузки данных');
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  };

  // Перезапрос данных при изменении параметров
  useEffect(() => {
    fetchPopularData();
  }, [initialCategory, user?.id, sortBy, currentPage]);

  // Обработчики событий
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

  const truncateText = (text, maxLength = 200) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getTextContent = (media) => {
    if (media.type !== 'text') return null;
    return media.content?.text_content || media.content?.text || null;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.last_page) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Загрузка...</div>;
  }

  return (
    <div className="flex-1 px-0 sm:px-6">
      {/* Сортировка */}
      <div className="mb-4">
        <label htmlFor="sortSelect" className="block text-sm font-medium text-gray-700 mb-2">
          Сортировать по:
        </label>
        <select
          id="sortSelect"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setCurrentPage(1); // Сброс на первую страницу
          }}
          className="px-3 py-2 rounded-lg bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 w-full sm:w-auto"
        >
          <option value="popular">Популярные</option>
          <option value="newest">Новые</option>
        </select>
      </div>

      {/* Популярные теги */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Популярные теги</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {tags.length === 0 ? (
          <p className="text-gray-500 text-center">Теги отсутствуют.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => router.push(`/tags/${tag.name}`)}
                className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full shadow hover:bg-gray-200 transition-colors"
              >
                {tag.name} ({tag.discussions_count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Обсуждения */}
      <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {user ? 'Рекомендуемые обсуждения' : 'Популярные обсуждения'}
        </h2>
        {discussions.length === 0 ? (
          <p className="text-gray-500 text-center">Обсуждения не найдены.</p>
        ) : (
          <ul className="space-y-6">
            {discussions.map((discussion) => (
              <li
                key={discussion.id}
                className="p-4 bg-gray-50 rounded-lg shadow hover:shadow-md cursor-pointer transition-shadow"
                onClick={() => handleDiscussionClick(discussion.id)}
              >
                <h3 className="text-lg font-semibold text-gray-900">{discussion.title}</h3>
                {discussion.description && (
                  <p className="text-gray-600 mt-1">{truncateText(discussion.description)}</p>
                )}

                <div className="mt-2 space-y-2">
                  {discussion.media?.map((media) => {
                    const content = getTextContent(media);
                    return (
                      <div key={media.id}>
                        {content && <p className="text-gray-600 mt-2">{truncateText(content)}</p>}
                        {media.type === 'image' && media.content?.image_url && (
                          <img
                            src={media.content.image_url}
                            alt="Обсуждение"
                            className="w-full h-48 object-cover rounded-lg mt-2"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/600x400';
                            }}
                          />
                        )}
                        {media.type === 'video' && media.content?.video_url && (
                          <video
                            src={media.content.video_url}
                            controls
                            className="w-full h-48 rounded-lg mt-2"
                          />
                        )}
                        {media.type === 'audio' && media.content?.music_url && (
                          <audio src={media.content.music_url} controls className="w-full mt-2" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <p className="text-sm text-gray-500 mt-2">
                  Автор: {discussion.user?.name || 'Неизвестный'} |{' '}
                  {new Date(discussion.created_at).toLocaleDateString()}
                </p>

                {/* Теги */}
                {discussion.tags?.length > 0 && (
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

      {/* Пагинация */}
      <div className="mt-6 flex justify-center items-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center ${
            currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'
          }`}
        >
          <FaArrowLeft className="mr-1" /> Предыдущая
        </button>
        <span className="px-4 py-2 text-gray-700">
          Страница {currentPage} из {pagination.last_page}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === pagination.last_page}
          className={`px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center ${
            currentPage === pagination.last_page
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-gray-200'
          }`}
        >
          Следующая <FaArrowRight className="ml-1" />
        </button>
      </div>
    </div>
  );
}