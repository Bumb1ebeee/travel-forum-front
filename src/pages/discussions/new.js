'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import DiscussionForm from '@/components/profile/discussions/DiscussionForm';
import SidebarLayout from '@/layouts/sidebar.layout';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import axios from 'axios';
import config from '@/pages/api/config';
import Head from "next/head";

export default function NewDiscussionPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${config.apiUrl}/categories`, { headers });
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error('Ошибка загрузки категорий:', err);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <>
      <Head>
        <title>Создание нового обсуждения - Форум путешествия по России</title>
        <meta name="description" content="Создайте новое обсуждение на Форуме путешествия по России. Обсудите интересующие темы с сообществом." />
        <meta property="og:title" content="Создание нового обсуждения - Форум путешествия по России" />
        <meta property="og:description" content="Создайте новое обсуждение на Форуме путешествия по России. Обсудите интересующие темы с сообществом." />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="http://45.153.191.235/discussions/new"  />
        {/* Structured data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Создание нового обсуждения",
            "description": "Создайте новое обсуждение на платформе MySite.",
            "url": "http://45.153.191.235/discussions/new"
          })
        }} />
      </Head>

      <SidebarLayout>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Создание нового обсуждения</h1>
        <DiscussionForm
          isEdit={false}
          categories={categories}
          setIsModalOpen={() => router.push('/discussions/list/drafts')}
          submitting={false}
          error=""
        />
      </SidebarLayout>
    </>

  );
}