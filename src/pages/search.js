'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import config from '@/pages/api/config';
import MainLayout from '@/layouts/main.layout';
import DiscussionCard from '@/components/DiscussionCard';
import Head from 'next/head';

export default function Search() {
  const router = useRouter();
  const { query } = router.query;
  const [discussions, setDiscussions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pageUrl = `http://45.153.191.235/search?query=${encodeURIComponent(query || '')}`;

  useEffect(() => {
    if (!query) return;

    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${config.apiUrl}/search`, {
          params: { query },
        });
        setDiscussions(response.data.discussions || []);
        setError('');
      } catch (err) {
        console.error('Search error:', err.response?.data);
        setError(err.response?.data?.message || 'Ошибка поиска. Проверьте соединение с сервером.');
        setDiscussions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  const handleDiscussionClick = async (discussionId) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.get(`${config.apiUrl}/discussions/${discussionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      router.push(`/discussions/${discussionId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при открытии обсуждения');
    }
  };

  const pageTitle = query ? `Поиск: ${query} | Форум путешествий по России` : 'Поиск | Форум путешествий по России';
  const pageDescription = query
    ? `Результаты поиска "${query}" на форуме путешествий по России.`
    : 'Поиск по форуму путешествий по России. Найдите интересующие вас обсуждения.';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content={query ? "index, follow" : "noindex, nofollow"} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="search" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="/logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={pageUrl} />

        {/* Structured Data / Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SearchResultsPage",
            "name": "Поиск по форуму путешествий по России",
            "description": pageDescription,
            "url": pageUrl,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": pageUrl
            },
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Главная",
                  "item": "http://45.153.191.235"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Поиск",
                  "item": pageUrl
                }
              ]
            }
          })
        }} />
      </Head>

      <MainLayout>
        <main className="flex-1 p-3 mt-12 sm:p-8">
          <div className="bg-form-bg rounded-2xl p-2 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-2 sm:mb-4">
              Результаты поиска: "{query}"
            </h2>
            {loading && <p className="text-text-secondary text-center mb-4">Загрузка...</p>}
            {error && <p className="text-error-text text-center mb-4">{error}</p>}
            {!loading && discussions.length === 0 ? (
              <p className="text-text-secondary text-center">Ничего не найдено.</p>
            ) : (
              <ul className="space-y-4">
                {discussions.map((discussion) => (
                  <DiscussionCard
                    key={discussion.id}
                    discussion={discussion}
                    onClick={() => handleDiscussionClick(discussion.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </main>
      </MainLayout>
    </>
  );
}