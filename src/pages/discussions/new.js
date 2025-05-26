'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import DiscussionForm from '@/components/profile/discussions/DiscussionForm';
import SidebarLayout from '@/layouts/sidebar.layout';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import axios from 'axios';
import config from '@/pages/api/config';

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
    <SidebarLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Создание нового обсуждения</h1>
        <DiscussionForm
          isEdit={false}
          categories={categories}
          setIsModalOpen={() => router.push('/discussions/drafts')}
          submitting={false}
          error=""
        />
      </div>
    </SidebarLayout>
  );
}