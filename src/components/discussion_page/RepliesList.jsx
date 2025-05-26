import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { HeartIcon, ArrowRightIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import parse from 'html-react-parser';
import axios from 'axios';
import OptionsMenu from '@/components/common/OptionsMenu';
import config from '@/pages/api/config';

const ReplyItem = ({ reply, level = 0, isJoined, setReplyTo }) => {
  const router = useRouter();
  const [likes, setLikes] = useState(reply.likes || 0);
  const [userReaction, setUserReaction] = useState(reply.userReaction || null);
  const [visibleChildrenCount, setVisibleChildrenCount] = useState(2);
  const [showChildren, setShowChildren] = useState(false);

  const visualLevel = Math.min(level, 5);
  const indent = visualLevel * 20;

  console.log(`Reply (level=${level}, visualLevel=${visualLevel}, indent=${indent}):`, {
    id: reply.id,
    parent_id: reply.parent_id,
    userReaction: reply.userReaction,
    children: reply.children?.length || 0,
    content: reply.content,
    media: reply.media,
  });

  useEffect(() => {
    const fetchReaction = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('Токен отсутствует, пропускаем загрузку реакции');
          return;
        }

        const reactionResponse = await axios.get(
          `${config.apiUrl}/reactions?reactable_id=${reply.id}&reactable_type=App\\Models\\Reply`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserReaction(reactionResponse.data.reaction || null);
        console.log('Reaction response:', reactionResponse.data);
      } catch (error) {
        console.error('Ошибка при загрузке реакции:', error.response?.data || error.message);
      }
    };

    fetchReaction();
  }, [reply.id]);

  const countAllChildren = (reply) => {
    if (!reply.children || reply.children.length === 0) return 0;
    let total = reply.children.length;
    reply.children.forEach((child) => {
      total += countAllChildren(child);
    });
    return total;
  };

  const flattenChildren = (reply) => {
    if (!reply.children || reply.children.length === 0) return [];
    let children = [];
    reply.children.forEach((child) => {
      children.push(child);
      children = children.concat(flattenChildren(child));
    });
    return children;
  };

  const totalChildren = countAllChildren(reply);
  const allChildren = flattenChildren(reply);
  const visibleChildren = allChildren.slice(0, visibleChildrenCount);
  const hasMoreChildren = allChildren.length > visibleChildrenCount;

  const loadMoreChildren = () => {
    setVisibleChildrenCount((prev) => prev + 2);
  };

  const toggleChildren = () => {
    setShowChildren((prev) => !prev);
  };

  const handleReport = async (reason) => {
    try {
      const response = await axios.post(
        `${config.apiUrl}/reports`,
        {
          reason,
          reportable_id: reply.id,
          reportable_type: 'App\\Models\\Reply',
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      alert(response.data.message);
    } catch (error) {
      console.error('Ошибка при отправке отчета:', error.response?.data || error.message);
      alert('Не удалось отправить жалобу: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLike = async () => {
    try {
      console.log('Sending like request for reply:', reply.id);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Пожалуйста, войдите в систему для добавления лайка');
        return;
      }
      let response;
      if (userReaction === 'like') {
        response = await axios.delete(
          `${config.apiUrl}/reactions`,
          {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            data: {
              reactable_id: reply.id,
              reactable_type: 'App\\Models\\Reply',
            },
          }
        );
        setLikes(response.data.likes || likes - 1);
        setUserReaction(null);
      } else {
        response = await axios.post(
          `${config.apiUrl}/reactions`,
          {
            reactable_id: reply.id,
            reactable_type: 'App\\Models\\Reply',
            reaction: 'like',
          },
          {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          }
        );
        setLikes(response.data.likes || likes + 1);
        setUserReaction('like');
      }
      console.log('Like response:', response.data);
    } catch (error) {
      console.error('Like error:', error.response?.data || error.message);
      alert('Ошибка: ' + (error.response?.data?.message || error.message));
    }
  };

  const userInitial = reply.user?.username ? reply.user.username.charAt(0).toUpperCase() : 'Н';
  const avatarColor = level % 2 === 0 ? 'bg-purple-600' : 'bg-blue-600';

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Время неизвестно';
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
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${hours}:${minutes}, ${day} ${month} ${year}`;
  };

  return (
    <li className="py-2" style={{ marginLeft: `${indent}px` }}>
      <div className="flex items-start space-x-2">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold`}>
          {userInitial}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-1">
            <span className="font-bold text-black">
              {reply.user?.username || 'Неизвестный'}
            </span>
            {level >= 1 && reply.parent?.user && (
              <div className="flex items-center text-gray-500 text-sm">
                <ArrowRightIcon className="h-3 w-3 mx-1" />
                <span className="text-gray-500">{reply.parent.user.username}</span>
              </div>
            )}
            <div className="ml-auto">
              <OptionsMenu onReport={handleReport} />
            </div>
          </div>
          <p className="text-black mt-1 prose max-w-none">{parse(reply.content || 'Без текста')}</p>
          {reply.media?.length > 0 && (
            <div className="mt-2 space-y-2">
              {reply.media.map((media) => (
                <div key={media.id}>
                  {media.type === 'image' && media.content?.image_url && (
                    <img
                      src={media.content.image_url}
                      alt="Media"
                      className="max-w-full max-h-48 object-contain rounded-lg bg-gray-100"
                      onError={(e) => {
                        console.error(`Failed to load image: ${media.content.image_url}`);
                        e.target.src = 'https://placehold.co/600x400';
                      }}
                    />
                  )}
                  {media.type === 'video' && media.content?.video_url && (
                    <video
                      src={media.content.video_url}
                      className="max-w-full max-h-48 object-contain rounded-lg"
                      controls
                    />
                  )}
                  {media.type === 'audio' && media.content?.music_url && (
                    <audio
                      src={media.content.music_url}
                      className="w-full"
                      controls
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="text-gray-500 text-sm mt-1">
            {formatRelativeTime(reply.created_at)}
          </div>
          <div className="flex items-center mt-1 space-x-2">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 text-sm transition-colors ${
                userReaction === 'like' ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
              disabled={!isJoined}
            >
              <HeartIcon className="h-4 w-4" />
              <span>{likes}</span>
            </button>
            {isJoined && (
              <button
                onClick={() => setReplyTo(reply.id)}
                className="text-gray-500 text-sm"
              >
                Ответить
              </button>
            )}
            {totalChildren > 0 && (
              <button
                onClick={toggleChildren}
                className="text-gray-500 text-sm flex items-center space-x-1"
              >
                {showChildren ? (
                  <>
                    <ChevronUpIcon className="h-4 w-4" />
                    <span>Скрыть ответы ({totalChildren})</span>
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="h-4 w-4" />
                    <span>Показать ответы ({totalChildren})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      {showChildren && visibleChildren.length > 0 && (
        <ul className="mt-2 space-y-2">
          {visibleChildren.map((child) => (
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
          className="mt-2 text-gray-500 text-sm"
        >
          Показать ещё ({allChildren.length - visibleChildrenCount})
        </button>
      )}
    </li>
  );
};

const RepliesList = ({ replies, isJoined, setReplyTo }) => {
  return (
    <div className="bg-white p-4">
      <h2 className="text-xl font-bold text-black mb-4">Комментарии</h2>
      {replies.length === 0 ? (
        <p className="text-gray-600">Комментариев пока нет. Будьте первым!</p>
      ) : (
        <ul className="space-y-2">
          {replies.map((reply) => (
            <ReplyItem
              key={reply.id}
              reply={reply}
              isJoined={isJoined}
              setReplyTo={setReplyTo}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default RepliesList;
