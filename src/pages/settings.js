'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import SettingsContent from '@/components/profile/settings/Settings';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import SidebarLayout from '@/layouts/sidebar.layout';
import Head from 'next/head';

export default function Settings() {
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

  const pageUrl = 'http://45.153.191.235/profile/settings';

  return (
    <>
      <Head>
        <title>Настройки профиля | Форум путешествий по России</title>
        <meta name="description" content="Изменение данных профиля, пароля и уведомлений на форуме путешествий по России." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Настройки профиля | Форум путешествий по России" />
        <meta property="og:description" content="Изменение данных профиля, пароля и уведомлений на форуме путешествий по России." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:site_name" content="Форум путешествий по России" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={pageUrl} />

        {/* Structured Data / Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Настройки профиля",
            "description": "Изменение данных профиля, пароля и уведомлений на форуме путешествий по России.",
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
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Настройки профиля</h1>
          <SettingsContent user={user} setUser={setUser} />
        </main>
      </SidebarLayout>
    </>
  );
}