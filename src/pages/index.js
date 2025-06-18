'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated } from '@/utils/auth';
import PopularPage from '@/components/home_page/PopularPage';
import HeroSlider from '@/components/home_page/HeroSlider';
import MainLayout from '@/layouts/main.layout';
import Head from 'next/head';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { authenticated, user } = await isAuthenticated();
      if (authenticated) {
        setUser(user);
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-bg">
        Загрузка...
      </div>
    );
  }

  const pageUrl = 'http://45.153.191.235/';

  return (
    <>
      <Head>
        <title>Форум путешествий по России</title>
        <meta name="description" content="Обсуждайте путешествия по России, делитесь маршрутами, находите попутчиков и получайте советы от опытных путешественников." />
        <meta name="keywords" content="путешествия по России, форум путешествий, маршруты, достопримечательности, приключения, туризм" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:title" content="Форум путешествий по России" />
        <meta property="og:description" content="Обсуждайте путешествия по России, делитесь маршрутами, находите попутчиков и получайте советы от опытных путешественников." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:site_name" content="Форум путешествий по России" />

        {/* Structured Data / Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Форум путешествий по России",
            "url": pageUrl,
            "description": "Обсуждайте путешествия по России, делитесь маршрутами, находите попутчиков и получайте советы от опытных путешественников.",
            "publisher": {
              "@type": "Organization",
              "name": "Форум путешествий по России",
              "logo": {
                "@type": "ImageObject",
                "url": "/logo.png"
              }
            },
            "inLanguage": "ru-RU"
          })
        }} />
        <link rel="canonical" href={pageUrl} />
      </Head>

      <MainLayout>
        <main className="flex-1 p-3 sm:p-8">
          <div className="mb-8">
            <h1 className="sr-only">Форум путешествий по России</h1>
            <HeroSlider />
          </div>
          <PopularPage user={user} />
        </main>
      </MainLayout>
    </>
  );
}