'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import DiscussionsPage from '@/components/profile/discussions/Discussions';
import SidebarLayout from '@/layouts/sidebar.layout';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import Head from 'next/head';

export default function Discussions() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const pageUrl = 'http://45.153.191.235/profile/discussions';

  return (
    <>
      <Head>
        <title>Мои обсуждения | Форум путешествий по России</title>
        <meta name="description" content="Просмотр и управление своими обсуждениями на форуме путешествий по России." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Мои обсуждения | Форум путешествий по России" />
        <meta property="og:description" content="Просмотр и управление своими обсуждениями на форуме путешествий по России." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={pageUrl} />

        {/* Structured Data / Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Мои обсуждения",
            "description": "Просмотр и управление своими обсуждениями на форуме путешествий по России.",
            "url": pageUrl
          })
        }} />
      </Head>

      <SidebarLayout>
        <main className="mt-6 m-3 sm:mt-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Мои обсуждения</h1>
          <DiscussionsPage user={user} />
        </main>
      </SidebarLayout>
    </>
  );
}