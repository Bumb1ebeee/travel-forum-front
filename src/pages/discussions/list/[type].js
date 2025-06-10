'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import DiscussionsPage from '@/components/profile/discussions/Discussions';
import SidebarLayout from '@/layouts/sidebar.layout';
import LoadingIndicator from '@/components/loader/LoadingIndicator';

const typeTitles = {
  drafts: 'Черновики обсуждений',
  pending: 'Обсуждения в ожидании',
  published: 'Опубликованные обсуждения',
  rejected: 'Отклоненные обсуждения'
};

export default function DiscussionsTypePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const type = params?.type || 'drafts';

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
    <SidebarLayout>
      <div className="mt-6 m-3 sm:mt-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{typeTitles[type]}</h2>
        <DiscussionsPage user={user} type={type}/>
      </div>
    </SidebarLayout>
  );
} 