'use client';
import React, { useState, useEffect } from 'react';

const UserAvatar = ({ user, size = 'medium' }) => {
  const username = user?.username || 'User';
  const initials = username.charAt(0).toUpperCase();

  // Получаем URL аватара из props или localStorage
  const [avatarUrl, setAvatarUrl] = useState(() => {
    if (!user) return null;

    const cachedAvatar = localStorage.getItem(`avatar_${user.id}`);
    return cachedAvatar || user.avatar;
  });

  // Сохраняем в localStorage при изменении
  useEffect(() => {
    if (user?.id && user?.avatar) {
      localStorage.setItem(`avatar_${user.id}`, user.avatar);
      setAvatarUrl(user.avatar);
    }
  }, [user?.id, user?.avatar]);

  // Цвет фона по первой букве
  const getInitialsColor = (char) => {
    const colors = [
      'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
      'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-gray-500'
    ];
    const index = char.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const colorClass = getInitialsColor(initials);

  // Обработка ошибки загрузки изображения
  const handleImageError = () => {
    console.error('Ошибка загрузки аватара:', avatarUrl);
    setAvatarUrl(null); // Сбрасываем аватар → покажется первая буква
  };

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white font-semibold ${
        size === 'small' ? 'w-8 h-8 text-sm' : 'w-10 h-10 sm:w-20 sm:h-20 sm:text-base'
      } ${colorClass} shadow-md select-none`}
    >
      {avatarUrl ? (
        <img
          src={`${avatarUrl}&disposition=inline`}
          alt={username}
          className="w-full h-full rounded-full object-cover"
          onError={handleImageError} // ← При ошибке загрузки: показываем первую букву
        />
      ) : (
        <span className="text-white font-medium">{initials}</span>
      )}
    </div>
  );
};

export default UserAvatar;