import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import config from '@/pages/api/config';
import DiscussionHeader from '@/components/discussion_page/DiscussionHeader';
import RepliesList from '@/components/discussion_page/RepliesList';
import ReplyForm from '@/components/discussion_page/ReplyForm';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import ErrorMessage from '@/components/error/ErrorMessage';
import MainLayout from "@/layouts/main.layout";

export default function DiscussionPage() {
  const router = useRouter();
  const { id } = router.query;
  const [discussion, setDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [error, setError] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);

  const fetchDiscussion = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${config.apiUrl}/discussions/${id}`, { headers });
      console.log('Discussion response:', response.data);
      console.log('Replies with children:', response.data.replies.map(r => ({
        id: r.id,
        content: r.content,
        children: r.children
      })));
      setDiscussion(response.data.discussion || null);
      setReplies(response.data.replies || []);
      setIsJoined(response.data.isJoined || false);
    } catch (err) {
      console.error('Fetch discussion error:', err.response || err);
      setError(err.response?.data?.message || 'Ошибка загрузки обсуждения');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchDiscussion();
  }, [id]);

  const handleJoin = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${config.apiUrl}/discussions/${id}/join`, {}, { headers });
      setIsJoined(true);
      await fetchDiscussion();
    } catch (err) {
      if (err.response?.status === 401) {
        router.push('/auth/login');
      } else {
        setError(err.response?.data?.message || 'Ошибка при присоединении');
      }
    }
  };

  const handleReply = async (e, parentId = null, formData) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Требуется авторизация');

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      };

      await axios.post(
        `${config.apiUrl}/discussions/${id}/replies`,
        formData,
        { headers }
      );
      setNewReply('');
      setReplyTo(null);
      await fetchDiscussion();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при отправке ответа');
    }
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  if (!discussion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600 text-xl">Обсуждение не найдено</div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen relative py-12 px-4 sm:px-6 lg:px-8">
        <div
          className="absolute inset-0 bg-[url('/image/background.png')] bg-repeat bg-[length:200px_200px] opacity-10 -z-10"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
            {/* Основной контент */}
            <div className="flex-1 space-y-8">
              <DiscussionHeader discussion={discussion} isJoined={isJoined} handleJoin={handleJoin}/>

              {error && <ErrorMessage message={error}/>}

              <div className="bg-white rounded-xl shadow-sm p-3 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 sm:mb-6">Ответы</h2>
                <RepliesList replies={replies} isJoined={isJoined} setReplyTo={setReplyTo}/>
              </div>
            </div>

            {/* Форма ответов */}
            {isJoined && (
              <div
                className="lg:w-96 fixed bottom-2 right-4 custom:sticky custom:top-8 custom:right-auto custom:self-start custom:max-h-[calc(100vh-4rem)] custom:overflow-y-auto z-20">
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md">
                  <ReplyForm
                    newReply={newReply}
                    setNewReply={setNewReply}
                    handleReply={handleReply}
                    replyTo={replyTo}
                    setReplyTo={setReplyTo}
                    replies={replies}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>

  );
}