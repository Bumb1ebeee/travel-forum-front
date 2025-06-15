// файл: components/Sidebar/SubscriptionsMenu.jsx или аналогичный путь

import React, { useState } from 'react';
import { MdSubscriptions } from 'react-icons/md';

const SubscriptionsMenu = ({
                             isActive,
                             userSubscriptions = [],
                             discussionSubscriptions = [],
                             archiveSubscriptions = [],
                             router,
                             toggleSidebar,
                             loadingSubscriptions = false,
                           }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Форматирование числа (например, 1500 → "1.5K+")
  const formatCount = (count) => {
    if (count > 999) return `${(count / 1000).toFixed(1)}K+`;
    return count;
  };

  return (
    <div>
      {/* Кнопка основного меню */}
      <button
        className={`p-2 w-full text-left rounded-lg mb-2 transition-colors flex items-center justify-between ${
          isOpen || isActive
            ? 'bg-indigo-100 text-indigo-600'
            : 'text-gray-700 bg-white hover:bg-indigo-50'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <MdSubscriptions className="mr-2" /> Подписки
        </div>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Раскрывающееся подменю */}
      {isOpen && (
        <ul className="ml-4 space-y-2 mt-2">
          {/* Подписки на пользователей */}
          <li>
            <button
              className="w-full text-left text-gray-700 hover:text-indigo-600 transition-colors"
              onClick={() => {
                router.push('/subscriptions/users');
                toggleSidebar?.();
              }}
            >
              Пользователи ({loadingSubscriptions ? '...' : formatCount(userSubscriptions.length)})
            </button>
          </li>

          {/* Подписки на обсуждения */}
          <li>
            <button
              className="w-full text-left text-gray-700 hover:text-indigo-600 transition-colors"
              onClick={() => {
                router.push('/subscriptions/discussions');
                toggleSidebar?.();
              }}
            >
              Обсуждения ({loadingSubscriptions ? '...' : formatCount(discussionSubscriptions.length)})
            </button>
          </li>

          {/* Архивные подписки */}
          <li>
            <button
              className="w-full text-left text-gray-700 hover:text-indigo-600 transition-colors"
              onClick={() => {
                router.push('/subscriptions/archive');
                toggleSidebar?.();
              }}
            >
              Архив ({loadingSubscriptions ? '...' : formatCount(archiveSubscriptions.length)})
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};

export default SubscriptionsMenu;