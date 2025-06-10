import React, { useState } from 'react';
import { MdChat, MdAdd } from 'react-icons/md';
import DiscussionForm from '../discussions/DiscussionForm';

const DiscussionsMenu = ({ isActive, drafts, published, pending, rejected, router }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateDiscussion = () => {
    router.push('/discussions/new');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          className={`p-2 flex-1 text-left rounded-lg transition-colors flex items-center ${
            isOpen || isActive ? 'bg-indigo-100 text-indigo-600' : 'text-gray-700 bg-white hover:bg-indigo-50'
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <MdChat className="mr-2" /> Обсуждения
          <span className="ml-auto">{isOpen ? '▲' : '▼'}</span>
        </button>
        <button
          onClick={handleCreateDiscussion}
          className="p-2 ml-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          title="Создать новое обсуждение"
        >
          <MdAdd className="w-5 h-5" />
        </button>
      </div>
      {isOpen && (
        <ul className="ml-4 space-y-2">
          <li>
            <button
              className="w-full text-left text-gray-700 hover:text-indigo-600 transition-colors"
              onClick={() => router.push('/discussions/list/drafts')}
            >
              Черновики ({drafts.length})
            </button>
          </li>
          <li>
            <button
              className="w-full text-left text-gray-700 hover:text-indigo-600 transition-colors"
              onClick={() => router.push('/discussions/list/published')}
            >
              Опубликованные ({published.length})
            </button>
          </li>
          <li>
            <button
              className="w-full text-left text-gray-700 hover:text-indigo-600 transition-colors"
              onClick={() => router.push('/discussions/list/pending')}
            >
              В ожидании ({pending.length})
            </button>
          </li>
          <li>
            <button
              className="w-full text-left text-gray-700 hover:text-indigo-600 transition-colors"
              onClick={() => router.push('/discussions/list/rejected')}
            >
              Отклоненные ({rejected.length})
            </button>
          </li>
        </ul>
      )}

      {isCreateModalOpen && (
        <DiscussionForm
          isEdit={false}
          categories={[]}
          handleChange={(e) => {}}
          setIsModalOpen={setIsCreateModalOpen}
          submitting={false}
          error=""
        />
      )}
    </div>
  );
};

export default DiscussionsMenu; 