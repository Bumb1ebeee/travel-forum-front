'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import StaffManagement from '@/components/dashboard/StaffManagement';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import SidebarLayout from '@/layouts/sidebar.layout';
import Head from 'next/head';

export default function StaffPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { authenticated, user } = await isAuthenticated();
      if (!authenticated || user?.role !== 'admin') {
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

  return (
    <>
      <Head>
        <title>Управление персоналом | Админ-панель - Форум путешествий по России</title>
        <meta name="description" content="Страница управления персоналом сайта. Только для администраторов." />
        <meta name="keywords" content="управление персоналом, админ панель, сотрудники, персонал" />
        <meta property="og:title" content="Управление персоналом | Админ-панель - Форум путешествий по России" />
        <meta property="og:description" content="Страница управления персоналом сайта. Только для администраторов." />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="http://45.153.191.235/admin/staff" />

        {/* Structured Data / Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Управление персоналом",
            "description": "Страница управления персоналом сайта. Только для администраторов.",
            "url": "http://45.153.191.235/admin/staff"
          })
        }} />
      </Head>

      <SidebarLayout>
        <main className="p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Управление персоналом</h1>
          <StaffManagement />
        </main>
      </SidebarLayout>
    </>
  );
}