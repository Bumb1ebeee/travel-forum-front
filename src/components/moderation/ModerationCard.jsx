'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import config from '@/pages/api/config';
import { isAuthenticated } from '@/utils/auth';

// Проверка ролей пользователя
const hasRole = (user, roles) => {
  if (!user) return false;
  const userRoles = Array.isArray(user.roles) ? user.roles : user.role ? [user.role] : [];
  return roles.some((role) => userRoles.includes(role));
};

export default function ModerationCard({ discussion, onModerate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaItems, setMediaItems] = useState([]);
  const [user, setUser] = useState(null);

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { authenticated, user } = await isAuthenticated();
        if (authenticated) {
          setUser(user);
          if (!hasRole(user, ['admin', 'moderator'])) {
            toast.warn('Ограниченный доступ: только просмотр');
          }
        } else {
          setError('Требуется авторизация');
          toast.error('Требуется авторизация');
        }
      } catch (err) {
        console.error('Ошибка проверки авторизации:', err);
        setError('Ошибка проверки авторизации');
        toast.error('Ошибка проверки авторизации');
      }
    };
    checkAuth();
  }, []);

  // Загрузка медиа
  useEffect(() => {
    console.log('Discussion:', discussion); // Отладка
    if (!discussion || !user) return;

    // Используем discussion.media, если есть
    if (discussion?.media && discussion.media.length > 0) {
      console.log('Используем discussion.media:', discussion.media);
      setMediaItems(discussion.media.map((item) => ({
        id: String(item.id),
        type: item.type,
        content: item.content || { text_content: '', map_points: [] },
      })));
    } else {
      // Попытка загрузки медиа через API
      const fetchMedia = async () => {
        if (!discussion?.id) return;
        setIsLoading(true);
        try {
          const token = localStorage.getItem('token');
          if (!token) throw new Error('Токен отсутствует');
          const response = await axios.get(`${config.apiUrl}/media`, {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              mediable_id: discussion.id,
              mediable_type: 'App\\Models\\Discussion',
            },
          });
          console.log('Полученные медиа:', response.data.media);
          const normalizedMedia = response.data.media.map((item) => ({
            id: String(item.id),
            type: item.type,
            content: item.content || { text_content: '', map_points: [] },
          }));
          setMediaItems(normalizedMedia);
        } catch (err) {
          console.error('Ошибка загрузки медиа:', err.response?.data || err.message);
          setError('Не удалось загрузить медиа');
          toast.error('Не удалось загрузить медиа');
        } finally {
          setIsLoading(false);
        }
      };
      fetchMedia();
    }
  }, [discussion, user]);

  // Загрузка тегов
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Токен отсутствует');
        const response = await axios.get(`${config.apiUrl}/tags`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Полученные теги:', response.data);
        setTags(response.data.tags || []);
        setFilteredTags(response.data.tags || []);
      } catch (err) {
        console.error('Ошибка загрузки тегов:', err.response?.data || err.message);
        setError('Не удалось загрузить теги');
        toast.error('Не удалось загрузить теги');
      } finally {
        setIsLoading(false);
      }
    };
    if (isTagsModalOpen && user && hasRole(user, ['admin', 'moderator'])) {
      fetchTags();
    }
  }, [isTagsModalOpen, user]);

  // Фильтрация тегов
  useEffect(() => {
    setFilteredTags(
      tags.filter((tag) =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, tags]);

  // Обрезка текста
  const truncateText = (text, maxLength = 200) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Получение текстового контента
  const getTextContent = (media) => {
    if (media.type !== 'text') return null;
    if (typeof media.content === 'string') return media.content;
    return media.content?.text_content || media.content?.text || '';
  };

  // Обработчик выбора тега
  const handleTagSelect = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Добавление нового тега
  const handleAddTag = async () => {
    if (!newTag.trim() || !hasRole(user, ['admin', 'moderator'])) {
      toast.error('Недостаточно прав или тег пуст');
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Токен отсутствует');
      const response = await axios.post(
        `${config.apiUrl}/tags`,
        { name: newTag.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const createdTag = response.data;
      setTags((prev) => [...prev, createdTag]);
      setFilteredTags((prev) => [...prev, createdTag]);
      setSelectedTagIds((prev) => [...prev, createdTag.id]);
      setNewTag('');
      toast.success('Тег добавлен');
    } catch (err) {
      console.error('Ошибка создания тега:', err.response?.data || err.message);
      setError('Не удалось создать тег');
      toast.error('Не удалось создать тег');
    } finally {
      setIsLoading(false);
    }
  };

  // Одобрение с тегами
  const handleApprove = async () => {
    if (!hasRole(user, ['admin', 'moderator'])) {
      toast.error('Недостаточно прав для модерации');
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Токен отсутствует');
      if (selectedTagIds.length > 0) {
        await axios.post(
          `${config.apiUrl}/discussions/${discussion.id}/tags`,
          { tag_ids: selectedTagIds },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      await onModerate(discussion.id, 'approved', comment);
      setIsTagsModalOpen(false);
      setIsModalOpen(false);
      toast.success('Обсуждение одобрено');
    } catch (err) {
      console.error('Ошибка одобрения:', err.response?.data || err.message);
      setError('Не удалось одобрить обсуждение');
      toast.error('Не удалось одобрить обсуждение');
    } finally {
      setIsLoading(false);
    }
  };

  // Отклонение
  const handleReject = async () => {
    if (!hasRole(user, ['admin', 'moderator'])) {
      toast.error('Недостаточно прав для модерации');
      return;
    }
    try {
      await onModerate(discussion.id, 'rejected', comment);
      setIsModalOpen(false);
      toast.success('Обсуждение отклонено');
    } catch (err) {
      console.error('Ошибка отклонения:', err.response?.data || err.message);
      setError('Не удалось отклонить обсуждение');
      toast.error('Не удалось отклонить обсуждение');
    }
  };

  if (error && !user) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <>
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
      {/* Карточка */}
      <div
        className="bg-white p-6 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setIsModalOpen(true)}
      >
        <h2 className="text-xl font-semibold text-gray-800">{discussion?.title || 'Без заголовка'}</h2>
        {discussion?.category && (
          <span className="inline-block bg-indigo-100 text-indigo-800 text-sm px-2 py-1 rounded-full mt-2">
            {discussion.category.name}
          </span>
        )}
        {discussion?.description && (
          <p className="text-gray-600 mt-2">{truncateText(discussion.description)}</p>
        )}
      </div>

      {/* Модальное окно обсуждения */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{discussion?.title || 'Без заголовка'}</h2>
            {discussion?.category && (
              <span className="inline-block bg-indigo-100 text-indigo-800 text-sm px-2 py-1 rounded-full mb-4">
                {discussion.category.name}
              </span>
            )}
            {discussion?.description && (
              <p className="text-gray-600 mb-4">{discussion.description}</p>
            )}
            {isLoading ? (
              <p className="text-gray-500">Загрузка медиа...</p>
            ) : mediaItems.length > 0 ? (
              <div className="space-y-4">
                {mediaItems.map((media) => {
                  console.log('Media item:', media); // Отладка
                  const textContent = getTextContent(media);
                  return (
                    <div key={media.id}>
                      {media.type === 'text' && textContent && (
                        <p className="media-text">{truncateText(textContent, 200)}</p>
                      )}
                      {media.type === 'image' && media.content?.image_url && (
                        <img
                          src={media.content.image_url}
                          alt="Media"
                          className="w-full h-64 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/600x400';
                            console.error('Ошибка загрузки изображения:', media.content.image_url);
                          }}
                        />
                      )}
                      {media.type === 'video' && media.content?.video_url && (
                        <video
                          src={media.content.video_url}
                          controls
                          className="w-full h-64 object-cover rounded-lg"
                          onError={(e) => {
                            console.error('Ошибка загрузки видео:', media.content.video_url);
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      {media.type === 'audio' && media.content?.music_url && (
                        <audio
                          src={media.content.music_url}
                          controls
                          className="w-full"
                          onError={(e) => {
                            console.error('Ошибка загрузки аудио:', media.content.music_url);
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      {media.type === 'map' && media.content?.map_points?.length > 0 && (
                        <div className="p-4 bg-gray-100 rounded-lg">
                          <p>Карта ({media.content.map_points.length} точек)</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">Медиа отсутствуют</p>
            )}
            <p className="text-sm text-gray-500 mt-4">
              Автор: {discussion?.user?.name || 'Неизвестный'} | Создано:{' '}
              {discussion?.created_at ? new Date(discussion.created_at).toLocaleDateString() : 'Неизвестно'}
            </p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mt-4"
              placeholder="Комментарий для автора (опционально)"
              rows="3"
              disabled={isLoading || !hasRole(user, ['admin', 'moderator'])}
            />
            <div className="flex gap-4 mt-4">
              <button
                onClick={() => setIsTagsModalOpen(true)}
                className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-all shadow-md"
                disabled={isLoading || !hasRole(user, ['admin', 'moderator'])}
              >
                Одобрить
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition-all shadow-md"
                disabled={isLoading || !hasRole(user, ['admin', 'moderator'])}
              >
                Отклонить
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-gray-200 text-gray-700 p-3 rounded-lg hover:bg-gray-300 transition-all shadow-md"
                disabled={isLoading}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно тегов */}
      {isTagsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Выберите теги</h2>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mb-4"
              placeholder="Поиск тегов..."
              disabled={isLoading}
            />
            <div className="max-h-60 overflow-y-auto space-y-2">
              {isLoading ? (
                <p className="text-gray-600">Загрузка тегов...</p>
              ) : filteredTags.length > 0 ? (
                filteredTags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
                      selectedTagIds.includes(tag.id) ? 'bg-indigo-100' : ''
                    }`}
                    onClick={() => handleTagSelect(tag.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={() => handleTagSelect(tag.id)}
                      className="mr-2"
                      disabled={isLoading}
                    />
                    <span className="text-gray-800">{tag.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">Теги не найдены</p>
              )}
            </div>
            <div className="mt-4">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Новый тег"
                disabled={isLoading}
              />
              <button
                onClick={handleAddTag}
                className="mt-2 w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-all shadow-md"
                disabled={isLoading || !newTag.trim()}
              >
                Добавить тег
              </button>
            </div>
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleApprove}
                className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-all shadow-md"
                disabled={isLoading || !hasRole(user, ['admin', 'moderator'])}
              >
                Подтвердить
              </button>
              <button
                onClick={() => {
                  setIsTagsModalOpen(false);
                  setSelectedTagIds([]);
                  setSearchQuery('');
                  setNewTag('');
                  setError(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 p-3 rounded-lg hover:bg-gray-300 transition-all shadow-md"
                disabled={isLoading}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}