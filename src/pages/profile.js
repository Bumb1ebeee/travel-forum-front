'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import UserProfile from '@/components/profile/profile/Profile';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import SidebarLayout from '@/layouts/sidebar.layout';
import Head from 'next/head';

export default function Profile() {
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

  const pageUrl = 'http://45.153.191.235/profile';

  return (
    <>
      <Head>
        <title>Мой профиль | Форум путешествий по России</title>
        <meta name="description" content="Просмотр и редактирование вашего профиля на форуме путешествий по России." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Мой профиль | Форум путешествий по России" />
        <meta property="og:description" content="Просмотр и редактирование вашего профиля на форуме путешествий по России." />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:site_name" content="Форум путешествий по России" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={pageUrl} />

        {/* Structured Data / Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": user?.name || "Пользователь",
            "url": pageUrl,
            "description": "Профиль пользователя на форуме путешествий по России.",
            "image": user?.avatar || "/logo.png"
          })
        }} />
      </Head>

      <SidebarLayout>
        <main className="mt-6 m-3 sm:mt-0">
          <UserProfile user={user} setUser={setUser} />
        </main>
      </SidebarLayout>
    </>
  );
}