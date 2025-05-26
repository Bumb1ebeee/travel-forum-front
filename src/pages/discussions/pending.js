'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import DiscussionsPage from '@/components/profile/discussions/Discussions';
import SidebarLayout from '@/layouts/sidebar.layout';
import LoadingIndicator from '@/components/loader/LoadingIndicator';

export default function PendingPage() {
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
    <SidebarLayout>
      <div className="p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Обсуждения в ожидании</h2>
        <DiscussionsPage user={user} type="pending" />
      </div>
    </SidebarLayout>
  );
} 