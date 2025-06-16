import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import config from '@/pages/api/config';
import OptionsMenu from '@/components/common/OptionsMenu';
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/solid';

const DiscussionHeader = ({ discussion, isJoined, handleJoin }) => {
  const router = useRouter();
  const [likes, setLikes] = useState(discussion.likes || 0);
  const [userReaction, setUserReaction] = useState(null);
  const [isArchived, setIsArchived] = useState(false);
  const [isJoinedState, setIsJoinedState] = useState(isJoined);
  const [isAuthor, setIsAuthor] = useState(false);
  const [error, setError] = useState(null);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsJoinedState(isJoined || false);
        setIsArchived(false);
        setUserReaction(null);
        setLikes(discussion.likes || 0);
        setIsAuthor(false);
        return;
      }

      try {
        // Fetch current user ID from API if not in localStorage
        let userId = localStorage.getItem('user_id');
        if (!userId) {
          const userResponse = await axios.get(`${config.apiUrl}/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          userId = userResponse.data.id;
          localStorage.setItem('user_id', userId);
        }

        // Set isAuthor by comparing userId with discussion.user.id
        setIsAuthor(userId && discussion.user?.id && parseInt(userId) === discussion.user.id);

        const headers = { Authorization: `Bearer ${token}` };

        // Check subscription status
        const subscriptionResponse = await axios.get(
          `${config.apiUrl}/discussions/${discussion.id}/subscription`,
          { headers }
        );
        const subscriptionData = subscriptionResponse.data;
        setIsArchived(subscriptionData.is_archived || false);
        setIsJoinedState(subscriptionData.subscribed || false);

        // Check user reaction
        const reactionResponse = await axios.get(
          `${config.apiUrl}/reactions?reactable_id=${discussion.id}&reactable_type=App\\Models\\Discussion`,
          { headers }
        );
        setUserReaction(reactionResponse.data.reaction || null);

        // Fetch likes count
        const likesResponse = await axios.get(
          `${config.apiUrl}/discussions/${discussion.id}/likes`,
          { headers }
        );
        setLikes(likesResponse.data.likes || 0);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error.response?.data || error.message);
        setError('Не удалось загрузить данные обсуждения');
      }
    };

    fetchData();
  }, [discussion.id, discussion.user?.id, isJoined]);

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
          reportable_id: discussion.id,
          reportable_type: 'App\\Models\\Discussion',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message || 'Отчет успешно отправлен');
    } catch (error) {
      console.error('Ошибка при отправке отчета:', error.response?.data || error.message);
      alert('Не удалось отправить отчет: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUnsubscribe = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Пожалуйста, войдите в систему, чтобы отписаться');
        return;
      }

      const endpoint = isArchived
        ? `${config.apiUrl}/discussions/${discussion.id}/unsubscribe/archived`
        : `${config.apiUrl}/discussions/${discussion.id}/unsubscribe`;

      const response = await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert(response.data.message);
      setIsJoinedState(false);
      setIsArchived(false);
      router.reload();
    } catch (error) {
      console.error('Ошибка при отписке:', error.response?.data || error.message);
      alert('Ошибка: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleArchive = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Пожалуйста, войдите в систему, чтобы архивировать');
        return;
      }

      const response = await axios.post(
        `${config.apiUrl}/discussions/${discussion.id}/archive`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(response.data.message);
      setIsArchived(true);
      setIsJoinedState(false);
      router.reload();
    } catch (error) {
      console.error('Ошибка при архивировании:', error.response?.data || error.message);
      alert('Ошибка: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUnarchive = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Пожалуйста, войдите в систему, чтобы разархивировать');
        return;
      }

      const response = await axios.post(
        `${config.apiUrl}/discussions/${discussion.id}/unarchive`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(response.data.message);
      setIsArchived(false);
      setIsJoinedState(true);
      router.reload();
    } catch (error) {
      console.error('Ошибка при разархивировании:', error.response?.data || error.message);
      alert('Ошибка: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Пожалуйста, войдите в систему, чтобы поставить лайк');
        return;
      }

      if (userReaction === 'like') {
        const response = await axios.delete(
          `${config.apiUrl}/reactions`,
          {
            headers: { Authorization: `Bearer ${token}` },
            data: {
              reactable_id: discussion.id,
              reactable_type: 'App\\Models\\Discussion',
            },
          }
        );
        setLikes(response.data.likes || likes - 1);
        setUserReaction(null);
      } else {
        const response = await axios.post(
          `${config.apiUrl}/reactions`,
          {
            reactable_id: discussion.id,
            reactable_type: 'App\\Models\\Discussion',
            reaction: 'like',
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLikes(response.data.likes || likes + 1);
        setUserReaction('like');
      }
    } catch (error) {
      console.error('Ошибка при лайке:', error.response?.data || error.message);
      alert('Ошибка: ' + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${config.apiUrl}/discussions/${discussion.id}/subscribers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubscribersCount(response.data.count || 0);
      } catch (err) {
        console.error('Ошибка загрузки подписчиков:', err.message);
        setError('Не удалось загрузить количество подписчиков');
      } finally {
        setLoading(false);
      }
    };

    if (discussion.id) {
      fetchSubscribers();
    }
  }, [discussion.id]);

  const handleDislike = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Пожалуйста, войдите в систему, чтобы поставить дизлайк');
        return;
      }

      if (userReaction === 'dislike') {
        const response = await axios.delete(
          `${config.apiUrl}/reactions`,
          {
            headers: { Authorization: `Bearer ${token}` },
            data: {
              reactable_id: discussion.id,
              reactable_type: 'App\\Models\\Discussion',
            },
          }
        );
        setLikes(response.data.likes || likes);
        setUserReaction(null);
      } else {
        const response = await axios.post(
          `${config.apiUrl}/reactions`,
          {
            reactable_id: discussion.id,
            reactable_type: 'App\\Models\\Discussion',
            reaction: 'dislike',
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLikes(response.data.likes || likes - (userReaction === 'like' ? 1 : 0));
        setUserReaction('dislike');
      }
    } catch (error) {
      console.error('Ошибка при дизлайке:', error.response?.data || error.message);
      alert('Ошибка: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-3 sm:p-6 transition-all hover:shadow-lg relative">
      {error && <p className="text-red-600 mb-4">{error}</p>}
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
      <div className="absolute top-1 right-1 sm:top-4 sm:right-4">
        <OptionsMenu
          onReport={handleReport}
          onUnsubscribe={handleUnsubscribe}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
          isJoined={isJoinedState}
          isArchived={isArchived}
          isAuthor={isAuthor}
        />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 sm:mb-4">{discussion.title}</h1>
      {discussion.category && (
        <span className="inline-block bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
          {discussion.category.name}
        </span>
      )}
      <div className="space-y-4 mb-6">
        {discussion.media?.length > 0 &&
          discussion.media.map((media) => (
            <div key={media.id}>
              {media.type === 'text' && media.content?.text_content && (
                <p className="media-text">{media.content.text_content}</p>
              )}
              {media.type === 'image' && media.content?.image_url && (
                <img
                  src={media.content.image_url}
                  alt="Медиа"
                  className="object-cover rounded-lg"
                  onError={(e) => {
                    console.error(`Ошибка загрузки изображения: ${media.content.image_url}`);
                    e.target.src = 'https://placehold.co/600x400';
                  }}
                />
              )}
              {media.type === 'video' && media.content?.video_url && (
                <video src={media.content.video_url} controls className="object-cover rounded-lg" />
              )}
              {media.type === 'audio' && media.content?.music_url && (
                <audio src={media.content.music_url} controls className="w-full" />
              )}
            </div>
          ))}
      </div>
      <p className="text-sm text-gray-500">
        Автор:{' '}
        <span
          onClick={() => router.push(`/users/${discussion.user?.id}`)}
          className="text-indigo-600 hover:underline cursor-pointer"
        >
          {discussion.user?.username || 'Неизвестный'}
        </span>{' '}
        | Создано: {new Date(discussion.created_at).toLocaleDateString()} | Просмотров: {discussion.views || 0}|
        <div className="mt-3 flex items-center text-sm text-gray-500">
          <span>Подписчики: {subscribersCount}</span>
        </div>
      </p>
      <div className="flex items-center mt-4 space-x-4">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
            userReaction === 'like'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-green-500 hover:text-white'
          }`}
        >
          <HandThumbUpIcon className="h-5 w-5" />
          <span>({likes})</span>
        </button>
        <button
          onClick={handleDislike}
          className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
            userReaction === 'dislike'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-red-500 hover:text-white'
          }`}
        >
          <HandThumbDownIcon className="h-5 w-5" />
        </button>
      </div>
      {!isAuthor && !isJoinedState && !isArchived && (
        <button
          onClick={handleJoin}
          className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
        >
          Присоединиться
        </button>
      )}
      {isArchived && (
        <button
          onClick={handleUnarchive}
          className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-md"
        >
          Разархивировать
        </button>
      )}
    </div>
  );
};

export default DiscussionHeader;