import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import SidebarLayout from '@/layouts/sidebar.layout';
import Head from "next/head";


export default function DashboardPage() {
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

  return (
    <>
      <Head>
        <title>Личный кабинет | Админ-панель - Форум путешествий по России</title>
        <meta name="description" content="Панель управления администратора. Просмотр данных, управление контентом." />
        <meta name="keywords" content="админ панель, управление сайтом, личный кабинет" />
        <meta property="og:title" content="Личный кабинет | Админ-панель - Форум путешествий по России" />
        <meta property="og:description" content="Панель управления администратора. Просмотр данных, управление контентом." />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="http://45.153.191.235/admin/dashboard" />

        {/* Structured Data / Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Личный кабинет | Админ-панель",
            "description": "Панель управления администратора. Просмотр данных, управление контентом.",
            "url": "http://45.153.191.235/admin/dashboard"
          })
        }} />
      </Head>

      <SidebarLayout>
        <AdminDashboard user={user} />
      </SidebarLayout>
    </>
  );
}