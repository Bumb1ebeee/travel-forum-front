'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import SidebarLayout from '@/layouts/sidebar.layout';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import ReportsContent from '@/components/reports/ReportsContent';

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
    <SidebarLayout>
      <div className="mt-2 p-3">
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
      </div>

      <div className="mt-3 sm:mt-6">
        <ReportsContent type={activeTab} user={user} />
        </div>
    </SidebarLayout>
  );
}
