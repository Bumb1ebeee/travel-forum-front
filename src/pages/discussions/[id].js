'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import config from '@/pages/api/config';
import DiscussionHeader from '@/components/discussion_page/DiscussionHeader';
import RepliesList from '@/components/discussion_page/RepliesList';
import ReplyForm from '@/components/discussion_page/ReplyForm';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import ErrorMessage from '@/components/error/ErrorMessage';
import MainLayout from '@/layouts/main.layout';
import Head from 'next/head';

export default function DiscussionPage() {
  const router = useRouter();
  const { id } = router.query;
  const [discussion, setDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [error, setError] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);

  const fetchDiscussion = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${config.apiUrl}/discussions/${id}`, { headers });

      setDiscussion(response.data.discussion || null);
      setReplies(response.data.replies || []);
      setIsJoined(response.data.isJoined || false);

      let userId = localStorage.getItem('user_id');
      if (token && !userId) {
        const userResponse = await axios.get(`${config.apiUrl}/user`, { headers });
        userId = userResponse.data.id;
        localStorage.setItem('user_id', userId);
      }

      const isAuthorValue = userId && response.data.discussion?.user?.id && parseInt(userId) === response.data.discussion.user.id;
      setIsAuthor(isAuthorValue);
    } catch (err) {
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

  const discussionUrl = `http://45.153.191.235/discussions/${discussion.id}`;
  const discussionTitle = `${discussion.title} — Форум Путешествия по России`;
  const discussionDescription = discussion?.content
    ? discussion.content.replace(/<[^>]+>/g, '').substring(0, 160).trim()
    : 'Обсуждение на форуме путешествий по России';

  return (
    <>
      <Head>
        <title>{discussionTitle}</title>
        <meta name="description" content={discussionDescription} />
        <meta property="og:title" content={discussionTitle} />
        <meta property="og:description" content={discussionDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={discussionUrl} />
        <meta property="og:image" content="/logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={discussionUrl} />

        {/* Structured Data / Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": discussion.title,
            "description": discussionDescription,
            "url": discussionUrl,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": discussionUrl
            },
            "author": {
              "@type": "Person",
              "name": discussion.user?.username || "Пользователь"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Форум Путешествия по России",
              "logo": {
                "@type": "ImageObject",
                "url": "/logo.png"
              }
            },
            "datePublished": discussion.created_at,
            "dateModified": discussion.updated_at
          })
        }} />
      </Head>

      <MainLayout>
        <main className="min-h-screen relative py-12 px-4 sm:px-6 lg:px-8">
          <div
            className="absolute inset-0 bg-[url('/image/background.png')] bg-repeat bg-[length:200px_200px] opacity-10 -z-10"></div>
          <div className="mx-auto relative max-w-6xl">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
              <div className="flex-1 space-y-8">
                <DiscussionHeader discussion={discussion} isJoined={isJoined} handleJoin={handleJoin} />

                {error && <ErrorMessage message={error} />}

                <div className="bg-white rounded-xl shadow-sm p-3 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 sm:mb-6">Ответы</h2>
                  <RepliesList replies={replies} isJoined={isJoined || isAuthor} setReplyTo={setReplyTo} />
                </div>
              </div>

              {(isJoined || isAuthor) && (
                <div
                  className="fixed bottom-2 right-4 lg:sticky lg:top-8 lg:right-auto lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:mr-4 z-20"
                >
                  <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-md">
                    <ReplyForm
                      discussionId={discussion.id}
                      replyTo={replyTo}
                      setReplies={setReplies}
                      onNewReply={() => setReplyTo(null)}
                      onCancel={() => setReplyTo(null)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </MainLayout>
    </>
  );
}