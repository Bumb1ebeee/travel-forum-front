'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import config from '@/pages/api/config';
import DiscussionItem from './DiscussionItem';
import DiscussionForm from './DiscussionForm';
import LoadingIndicator from '@/components/loader/LoadingIndicator';

const DiscussionsPage = ({ user, type = 'all' }) => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterCategory, setFilterCategory] = useState('');

  const fetchDiscussions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Требуется авторизация');
        return;
      }

      let endpoint = `${config.apiUrl}/discussions`;
      if (type === 'drafts') {
        endpoint = `${config.apiUrl}/discussions/drafts`;
      } else if (type === 'published') {
        endpoint = `${config.apiUrl}/discussions/published`;
      } else if (type === 'pending') {
        endpoint = `${config.apiUrl}/discussions/pending`;
      } else if (type === 'rejected') {
        endpoint = `${config.apiUrl}/discussions/rejected`;
      }

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const discussionsData = response.data?.discussions || response.data || [];
      const uniqueDiscussions = discussionsData.map((discussion) => ({
        ...discussion,
        media_content: Array.from(
          new Map(
            (discussion.media_content || []).map((item) => [item.id || item.media_id, item])
          ).values()
        ),
      }));
      setDiscussions(uniqueDiscussions);
    } catch (err) {
      console.error('Ошибка загрузки обсуждений:', err);
      setError(err.response?.data?.message || 'Ошибка загрузки обсуждений');
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Требуется авторизация');
        return;
      }
      const response = await axios.get(`${config.apiUrl}/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data.categories || []);
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err);
      setError(err.response?.data?.message || 'Ошибка загрузки категорий');
    }
  };

  useEffect(() => {
    fetchDiscussions();
    fetchCategories();
  }, [type]);

  // Фильтрация и сортировка
  const filteredDiscussions = discussions.filter(discussion => {
    const matchesSearch = discussion.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || discussion.category_id == filterCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedDiscussions = [...filteredDiscussions].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at) - new Date(b.created_at);
    } else if (sortBy === 'az') {
      return a.title.localeCompare(b.title);
    } else if (sortBy === 'za') {
      return b.title.localeCompare(a.title);
    }
    return 0;
  });

  const handleUpdate = (updatedDiscussion) => {
    setDiscussions((prev) =>
      prev.map((item) => (item.id === updatedDiscussion.id ? updatedDiscussion : item))
    );
    toast.success('Публикация обновлена');
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Требуется авторизация');

      await axios.delete(`${config.apiUrl}/discussions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDiscussions((prev) => prev.filter((item) => item.id !== id));
      toast.success('Публикация удалена');
    } catch (err) {
      console.error('Ошибка удаления:', err);
      toast.error(err.response?.data?.message || 'Ошибка удаления');
    }
  };

  const handleEditModal = (discussion) => {
    setSelectedDiscussion({
      ...discussion,
      media_content: Array.from(
        new Map(
          (discussion.media_content || []).map((item) => [item.id || item.media_id, item])
        ).values()
      ),
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedDiscussion(null);
    fetchDiscussions();
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    fetchDiscussions();
  };

  if (loading) return <LoadingIndicator />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="bg-primary-bg m-3 p-2 sm:p-8">
      <div className="mx-auto">
        {/* Поиск и фильтры */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="category-filter" className="text-sm text-gray-600 whitespace-nowrap">
              Категория:
            </label>
            <select
              id="category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Все</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-gray-600 whitespace-nowrap">
              Сортировать:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="newest">Новые</option>
              <option value="oldest">Старые</option>
              <option value="az">А–Я</option>
              <option value="za">Я–А</option>
            </select>
          </div>
        </div>

        {/* Кнопка создания */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 text-white p-2 rounded-lg mb-4"
        >
          Создать публикацию
        </button>

        {/* Список обсуждений */}
        {sortedDiscussions.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-md text-center text-gray-500">
            {searchTerm || filterCategory
              ? 'Обсуждений не найдено'
              : 'У вас пока нет публикаций.'}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDiscussions.map((discussion) => (
              <DiscussionItem
                key={discussion.id}
                discussion={discussion}
                user={user}
                type={type}
                openEditModal={handleEditModal}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Модалки */}
      {isEditModalOpen && selectedDiscussion && (
        <DiscussionForm
          isEdit={true}
          editDiscussion={selectedDiscussion}
          categories={categories}
          setIsModalOpen={handleCloseEditModal}
          submitting={false}
          error={error}
          onUpdate={handleUpdate}
        />
      )}

      {isCreateModalOpen && (
        <DiscussionForm
          isEdit={false}
          categories={categories}
          setIsModalOpen={handleCloseCreateModal}
          submitting={false}
          error={error}
          onUpdate={(newDiscussion) => {
            setDiscussions((prev) => [newDiscussion, ...prev]);
            toast.success('Публикация создана');
          }}
        />
      )}
    </div>
  );
};

export default DiscussionsPage;