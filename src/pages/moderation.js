'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import ModerationContent from '@/components/moderation/ModerationContent';
import SidebarLayout from '@/layouts/sidebar.layout';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import Head from 'next/head';

export default function Moderation() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { authenticated, user } = await isAuthenticated();
      if (!authenticated) {
        router.push('/auth/login');
      } else if (user.role !== 'moderator') {
        router.push('/discussions');
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

  const pageUrl = 'http://45.153.191.235/moderator';

  return (
    <>
      <Head>
        <title>Модерация | Панель модератора — Форум путешествий по России</title>
        <meta name="description" content="Панель модератора. Проверяйте обсуждения, пользователей и жалобы на форуме путешествий по России." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Модерация | Панель модератора — Форум путешествий по России" />
        <meta property="og:description" content="Панель модератора. Проверяйте обсуждения, пользователей и жалобы на форуме путешествий по России." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:site_name" content="Форум путешествий по России" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={pageUrl} />

        {/* Structured Data / Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Панель модератора",
            "description": "Инструменты модерации контента на форуме путешествий по России.",
            "url": pageUrl,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": pageUrl
            },
            "publisher": {
              "@type": "Organization",
              "name": "Форум путешествий по России",
              "logo": {
                "@type": "ImageObject",
                "url": "/logo.png"
              }
            }
          })
        }} />
      </Head>

      <SidebarLayout>
        <main className="mt-6 m-3 sm:mt-0">
          <ModerationContent user={user} />
        </main>
      </SidebarLayout>
    </>
  );
}