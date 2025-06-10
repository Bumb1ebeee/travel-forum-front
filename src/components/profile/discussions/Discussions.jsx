'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
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

  useEffect(() => {
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
        setDiscussions(Array.isArray(uniqueDiscussions) ? uniqueDiscussions : []);
      } catch (err) {
        console.error('Ошибка загрузки обсуждений:', err);
        setError(err.response?.data?.message || 'Ошибка загрузки обсуждений');
        setDiscussions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussions();
  }, [type]);

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

  if (loading) return <LoadingIndicator />;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-primary-bg m-3 p-2 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {discussions.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-md text-center text-gray-500">
            У вас пока нет обсуждений.
          </div>
        ) : (
          <div className="space-y-4">
            {discussions.map((discussion) => (
              <DiscussionItem
                key={discussion.id}
                discussion={discussion}
                user={user}
                openEditModal={handleEditModal}
              />
            ))}
          </div>
        )}
      </div>

      {isEditModalOpen && selectedDiscussion && (
        <DiscussionForm
          isEdit={true}
          editDiscussion={selectedDiscussion}
          categories={[]}
          setIsModalOpen={setIsEditModalOpen}
          submitting={false}
          error={error}
        />
      )}

      {isCreateModalOpen && (
        <DiscussionForm
          isEdit={false}
          categories={[]}
          setIsModalOpen={setIsCreateModalOpen}
          submitting={false}
          error={error}
        />
      )}
    </div>
  );
};

export default DiscussionsPage;