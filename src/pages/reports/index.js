'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import SidebarLayout from '@/layouts/sidebar.layout';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import ReportsContent from '@/components/reports/ReportsContent';
import Head from 'next/head';

export default function ReportsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discussions');
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

  const tabs = [
    { id: 'discussions', label: 'Обсуждения' },
    { id: 'users', label: 'Пользователи' }
  ];

  return (
    <>
      <Head>
        <title>Жалобы — Панель модератора | Форум путешествий по России</title>
        <meta name="description" content="Страница просмотра жалоб на обсуждения и пользователей. Только для модераторов." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Жалобы — Панель модератора" />
        <meta property="og:description" content="Страница просмотра жалоб на обсуждения и пользователей. Только для модераторов." />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="http://45.153.191.235/moderator/reports" />

        {/* Structured Data / Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Жалобы",
            "description": "Страница просмотра жалоб на обсуждения и пользователей. Только для модераторов.",
            "url": "http://45.153.191.235/moderator/reports"
          })
        }} />
      </Head>

      <SidebarLayout>
        <main className="mt-2 p-3">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Жалобы</h1>
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="mt-3 sm:mt-6">
            <ReportsContent type={activeTab} user={user} />
          </div>
        </main>
      </SidebarLayout>
    </>
  );
}