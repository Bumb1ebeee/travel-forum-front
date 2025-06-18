'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import config from '@/pages/api/config';
import MainLayout from '@/layouts/main.layout';
import DiscussionCard from '@/components/DiscussionCard';
import Head from 'next/head';

function DiscussionsByTag() {
  const router = useRouter();
  const { tag } = router.query;
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const pageTitle = `Обсуждения с тегом "${tag}" | Форум путешествий по России`;
  const pageDescription = `Просмотр обсуждений с тегом "${tag}" на форуме путешествий по России. Присоединяйтесь к разговору!`;
  const pageUrl = `http://45.153.191.235/discussions/tag/${tag}`;

  useEffect(() => {
    if (!tag) return;

    const fetchDiscussionsByTag = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${config.apiUrl}/discussions-by-tag/${tag}`);
        setDiscussions(response.data.discussions || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Ошибка загрузки обсуждений');
      } finally {
        setLoading(false);
      }
    };

    fetchDiscussionsByTag();
  }, [tag]);

  if (loading) {
    return <div className="text-center p-8">Загрузка...</div>;
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="/logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={pageUrl} />

        {/* Structured Data / Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": pageTitle,
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
                  "name": "Теги",
                  "item": "http://45.153.191.235/tags"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": tag,
                  "item": pageUrl
                }
              ]
            }
          })
        }} />
      </Head>

      <MainLayout>
        <main className="flex p-8 pt-12 gap-6 mx-auto max-w-7xl">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-text-primary mb-6">
              Обсуждения по тегу: {tag}
            </h1>
            {error && <p className="text-error-text mb-4">{error}</p>}
            {discussions.length === 0 ? (
              <p className="text-text-secondary text-center">Обсуждения отсутствуют.</p>
            ) : (
              <ul className="space-y-4">
                {discussions.map((discussion) => (
                  <DiscussionCard key={discussion.id} discussion={discussion} />
                ))}
              </ul>
            )}
          </div>
        </main>
      </MainLayout>
    </>
  );
}

export default DiscussionsByTag;