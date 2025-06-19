
import React, { useState, useEffect } from 'react';
import { HeartIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import parse from 'html-react-parser';
import axios from 'axios';
import OptionsMenu from '@/components/common/OptionsMenu';
import config from '@/pages/api/config';
import UserAvatar from "@/components/profile/profile/userAvatar";

const ReplyItem = ({ reply, level = 0, isJoined, setReplyTo }) => {
  const [likes, setLikes] = useState(reply.likes || 0);
  const [userReaction, setUserReaction] = useState(reply.userReaction || null);
  const [visibleChildrenCount, setVisibleChildrenCount] = useState(2);
  const [showChildren, setShowChildren] = useState(false);
  const [mediaUrls, setMediaUrls] = useState({});
  const [loadingMedia, setLoadingMedia] = useState({});
  const [errorMedia, setErrorMedia] = useState({});

  const visualLevel = Math.min(level, 5);
  const indent = visualLevel * 20;

  const normalizeYandexUrl = (url) => {
    if (!url) return null;
    if (url.includes('downloader.disk.yandex.ru')) {
      console.warn('Обнаружена временная ссылка, требуется обновление:', url);
      return null;
    }
    if (url.match(/^https:\/\/yadi\.sk\/[di]\//)) {
      const separator = url.includes('?') ? '&' : '?';
      if (!url.includes('disposition=inline')) {
        console.log('Добавлен disposition=inline к URL:', url);
        return `${url}${separator}disposition=inline`;
      }
      return url;
    }
    return url;
  };

  const handleReport = async (reason) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Пожалуйста, войдите в систему, чтобы отправить жалобу');
        return;
      }

      const response = await axios.post(
        `${config.apiUrl}/reports`,
        {
          reason,
          reportable_id: reply.id,
          reportable_type: 'App\\Models\\Reply',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message || 'Жалоба успешно отправлена');
    } catch (error) {
      console.error('Ошибка при отправке жалобы:', error.response?.data || error.message);
      alert('Не удалось отправить жалобу: ' + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    const fetchReaction = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const reactionResponse = await axios.get(
          `${config.apiUrl}/reactions?reactable_id=${reply.id}&reactable_type=App\\Models\\Reply`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUserReaction(reactionResponse.data.reaction || null);
        setLikes(reactionResponse.data.likes || likes);
      } catch (error) {
        console.error('Ошибка при загрузке реакции:', error.message);
      }
    };

    fetchReaction();
  }, [reply.id, likes]);

  useEffect(() => {
    if (reply.media?.length > 0) {
      console.log('Структура reply.media:', JSON.stringify(reply.media, null, 2));
    }
  }, [reply.media]);

  const countAllChildren = (reply) => {
    if (!reply.children?.length) return 0;
    let total = reply.children.length;
    reply.children.forEach(child => total += countAllChildren(child));
    return total;
  };

  const flattenChildren = (reply) => {
    if (!reply.children?.length) return [];
    let children = [...reply.children];
    reply.children.forEach(child => children.push(...flattenChildren(child)));
    return children;
  };

  const visibleChildren = flattenChildren(reply).slice(0, visibleChildrenCount);
  const hasMoreChildren = flattenChildren(reply).length > visibleChildrenCount;

  const loadMoreChildren = () => {
    setVisibleChildrenCount(prev => prev + 2);
  };

  const toggleChildren = () => {
    setShowChildren(prev => !prev);
  };

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Пожалуйста, войдите в систему для добавления лайка');
        return;
      }

      let response;
      if (userReaction === 'like') {
        response = await axios.delete(`${config.apiUrl}/reactions`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          data: { reactable_id: reply.id, reactable_type: 'App\\Models\\Reply' },
        });
        setLikes(response.data.likes || likes - 1);
        setUserReaction(null);
      } else {
        response = await axios.post(`${config.apiUrl}/reactions`, {
          reactable_id: reply.id,
          reactable_type: 'App\\Models\\Reply',
          reaction: 'like',
        }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        setLikes(response.data.likes || likes + 1);
        setUserReaction('like');
      }
    } catch (error) {
      console.error('Ошибка при установке лайка:', error.message);
      alert('Не удалось поставить лайк');
    }
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'сейчас';

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      const minutesWord = diffInMinutes === 1 ? 'минуту' : diffInMinutes >= 2 && diffInMinutes <= 4 ? 'минуты' : 'минут';
      return `${diffInMinutes} ${minutesWord} назад`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      const hoursWord = diffInHours === 1 ? 'час' : diffInHours >= 2 && diffInHours <= 4 ? 'часа' : 'часов';
      return `${diffInHours} ${hoursWord} назад`;
    }

    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month}, ${year}`;
  };

  const handleMediaError = async (media, e, retryCount = 0) => {
    const mediaId = media.id;
    if (loadingMedia[mediaId] || retryCount > 2) return;

    console.error(`Ошибка загрузки медиа: ${media.content[`${media.type}_url`]}`, { mediaId, retryCount });

    setLoadingMedia(prev => ({ ...prev, [mediaId]: true }));

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Токен отсутствует, невозможно обновить ссылку');
      setErrorMedia(prev => ({ ...prev, [mediaId]: 'Токен отсутствует' }));
      e.target.src = '/default-image.png';
      setLoadingMedia(prev => ({ ...prev, [mediaId]: false }));
      return;
    }

    try {
      const response = await axios.get(
        `${config.apiUrl}/media/${mediaId}/refresh`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.url) {
        const normalizedUrl = normalizeYandexUrl(response.data.url);
        if (normalizedUrl) {
          setMediaUrls(prev => ({ ...prev, [mediaId]: normalizedUrl }));
          e.target.src = normalizedUrl;
        } else {
          throw new Error('Invalid URL format received');
        }
      } else {
        console.warn('Получена пустая ссылка от сервера', { mediaId });
        setErrorMedia(prev => ({ ...prev, [mediaId]: 'Пустая ссылка от сервера' }));
        e.target.src = '/default-image.png';
      }
    } catch (err) {
      console.error('Не удалось обновить ссылку:', {
        mediaId,
        message: err.response?.data?.message || err.message,
        status: err.response?.status,
      });
      setErrorMedia(prev => ({ ...prev, [mediaId]: err.response?.data?.message || err.message }));
      if (retryCount < 2) {
        setTimeout(() => handleMediaError(media, e, retryCount + 1), 1000);
      } else {
        e.target.src = '/default-image.png';
      }
    } finally {
      setLoadingMedia(prev => ({ ...prev, [mediaId]: false }));
    }
  };

  const hasTextContent = reply.content && reply.content.trim() !== '';

  return (
    <li className="sm:py-2" style={{ marginLeft: `${indent}px` }}>
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0">
          <UserAvatar user={reply.user} size="small" />
        </div>

        <div className="flex-1 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium">{reply.user?.username || 'Неизвестный'}</span>
            <div className="flex items-center gap-2">
              <button onClick={handleLike} className="flex items-center gap-1 text-red-500">
                <HeartIcon className={`h-5 w-5 ${userReaction === 'like' ? 'fill-red-500' : ''}`} />
                <span>{likes}</span>
              </button>
              <OptionsMenu
                onReport={handleReport}
                isJoined={isJoined}
                isArchived={false}
                isAuthor={false} // Уточните логику определения автора ответа
                isReply={true}
              />
            </div>
          </div>

          {hasTextContent && (
            <p className="text-black mt-1 prose max-w-none">
              {parse(reply.content)}
            </p>
          )}

          {reply.media?.length > 0 && (
            <div className="mt-2 space-y-2">
              {reply.media.map(media => (
                <div key={media.id}>
                  {media.content && media.type === 'image' && media.content.image_url ? (
                    <div className="relative">
                      {loadingMedia[media.id] && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50 rounded-lg">
                          <span className="text-gray-600">Загрузка...</span>
                        </div>
                      )}
                      {errorMedia[media.id] && (
                        <div className="text-red-500 text-sm">{errorMedia[media.id]}</div>
                      )}
                      <img
                        src={normalizeYandexUrl(mediaUrls[media.id] || media.content.image_url) || '/default-image.png'}
                        alt="Медиа"
                        className="max-w-full max-h-48 object-contain rounded-lg bg-gray-100"
                        onError={(e) => handleMediaError(media, e)}
                      />
                    </div>
                  ) : media.content && media.type === 'video' && media.content.video_url ? (
                    <video
                      src={normalizeYandexUrl(mediaUrls[media.id] || media.content.video_url)}
                      controls
                      className="w-full max-h-48 object-contain rounded"
                      onError={(e) => {
                        console.error(`Ошибка загрузки видео: ${media.content.video_url}`, { mediaId: media.id });
                        setErrorMedia(prev => ({ ...prev, [media.id]: 'Ошибка загрузки видео' }));
                      }}
                    >
                      Ваш браузер не поддерживает видео.
                    </video>
                  ) : media.content && media.type === 'music' && media.content.music_url ? (
                    <audio
                      src={normalizeYandexUrl(mediaUrls[media.id] || media.content.music_url)}
                      controls
                      className="w-full"
                      onError={(e) => {
                        console.error(`Ошибка загрузки аудио: ${media.content.music_url}`, { mediaId: media.id });
                        setErrorMedia(prev => ({ ...prev, [media.id]: 'Ошибка загрузки аудио' }));
                      }}
                    >
                      Ваш браузер не поддерживает аудио.
                    </audio>
                  ) : (
                    <div className="text-red-500 text-sm">
                      Некорректные данные медиа: {JSON.stringify(media)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-2 flex items-center text-xs text-gray-500">
            {isJoined && (
              <button
                onClick={() => setReplyTo(reply.id)}
                className="mr-4 hover:underline"
              >
                Ответить
              </button>
            )}
            <span>{formatRelativeTime(reply.created_at)}</span>
            {reply.children?.length > 0 && (
              <button
                onClick={toggleChildren}
                className="ml-4 hover:underline flex items-center"
              >
                {showChildren ? 'Скрыть' : `Показать (${countAllChildren(reply)})`}
                {showChildren ? (
                  <ChevronUpIcon className="h-4 w-4 inline ml-1" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 inline ml-1" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {showChildren && visibleChildren.length > 0 && (
        <ul className="mt-2 space-y-2">
          {visibleChildren.map(child => (
            <ReplyItem
              key={child.id}
              reply={child}
              level={level + 1}
              isJoined={isJoined}
              setReplyTo={setReplyTo}
            />
          ))}
        </ul>
      )}

      {showChildren && hasMoreChildren && (
        <button
          onClick={loadMoreChildren}
          className="mt-2 text-indigo-600 text-sm hover:underline"
        >
          Показать еще ({flattenChildren(reply).length - visibleChildrenCount})
        </button>
      )}
    </li>
  );
};

const RepliesList = ({ replies, isJoined, setReplyTo }) => {
  const [visibleRepliesCount, setVisibleRepliesCount] = useState(5);
  const visibleReplies = replies.slice(0, visibleRepliesCount);
  const hasMoreReplies = replies.length > visibleRepliesCount;

  const loadMoreReplies = () => {
    setVisibleRepliesCount((prev) => prev + 5);
  };

  return (
    <div className="bg-white p-1 sm:p-4">
      {replies.length === 0 ? (
        <p className="text-gray-600">Комментариев пока нет. Будьте первым!</p>
      ) : (
        <>
          <ul className="space-y-2">
            {visibleReplies.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                isJoined={isJoined}
                setReplyTo={setReplyTo}
              />
            ))}
          </ul>
          {hasMoreReplies && (
            <button
              onClick={loadMoreReplies}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Показать еще ({replies.length - visibleRepliesCount})
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default RepliesList;