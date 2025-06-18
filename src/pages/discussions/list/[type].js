'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import DiscussionsPage from '@/components/profile/discussions/Discussions';
import SidebarLayout from '@/layouts/sidebar.layout';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import Head from 'next/head';

const typeTitles = {
  drafts: 'Черновики обсуждений - Форум Путешествия по России',
  pending: 'Обсуждения в ожидании - Форум Путешествия по России',
  published: 'Опубликованные обсуждения - Форум Путешествия по России',
  rejected: 'Отклоненные обсуждения - Форум Путешествия по России'
};

const typeDescriptions = {
  drafts: 'Просмотр ваших черновиков обсуждений на форуме путешествий по России.',
  pending: 'Обсуждения, ожидающие модерации на форуме путешествий по России.',
  published: 'Опубликованные обсуждения, доступные всем участникам форума.',
  rejected: 'Отклоненные обсуждения — просмотрите комментарии модераторов.'
};

export default function DiscussionsTypePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const type = params?.type || 'drafts';

  useEffect(() => {
    const checkAuth = async () => {
      const { authenticated, user } = await isAuthenticated();
      if (!authenticated) {
        router.push('/auth/login');
      } else {
        setUser(user);
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return <LoadingIndicator />;
  }

  const fullUrl = `http://45.153.191.235/profile/discussions/${type}`;

  return (
    <>
      <Head>
        <title>{typeTitles[type]}</title>
        <meta name="description" content={typeDescriptions[type]} />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content={typeTitles[type]} />
        <meta property="og:description" content={typeDescriptions[type]} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={fullUrl} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={fullUrl} />

        {/* Structured Data / Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": typeTitles[type],
            "description": typeDescriptions[type],
            "url": fullUrl
          })
        }} />
      </Head>

      <SidebarLayout>
        <main className="mt-6 m-3 sm:mt-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{typeTitles[type].replace(' - Форум Путешествия по России', '')}</h2>
          <DiscussionsPage user={user} type={type} />
        </main>
      </SidebarLayout>
    </>
  );
}