import React, { useState } from 'react';
import { MdSubscriptions } from 'react-icons/md';

const SubscriptionsMenu = ({ isActive, userSubscriptions, discussionSubscriptions, archiveSubscriptions, router }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        className={`p-2 w-full text-left rounded-lg mb-2 transition-colors flex items-center justify-between ${
          isOpen || isActive ? 'bg-indigo-100 text-indigo-600' : 'text-gray-700 bg-white hover:bg-indigo-50'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <MdSubscriptions className="mr-2" /> Подписки
        </div>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <ul className="ml-4 space-y-2">
          <li>
            <button
              className="w-full text-left text-gray-700 hover:text-indigo-600 transition-colors"
              onClick={() => router.push('/subscriptions/users')}
            >
              Пользователи ({userSubscriptions.length})
            </button>
          </li>
          <li>
            <button
              className="w-full text-left text-gray-700 hover:text-indigo-600 transition-colors"
              onClick={() => router.push('/subscriptions/discussions')}
            >
              Обсуждения ({discussionSubscriptions.length})
            </button>
          </li>
          <li>
            <button
              className="w-full text-left text-gray-700 hover:text-indigo-600 transition-colors"
              onClick={() => router.push('/subscriptions/archive')}
            >
              Архив ({archiveSubscriptions.length})
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};

export default SubscriptionsMenu;