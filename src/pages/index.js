// pages/index.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated } from '@/utils/auth';
import PopularPage from '@/components/home_page/PopularPage';
import HeroSlider from '@/components/home_page/HeroSlider';

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
    return <div className="min-h-screen flex items-center justify-center bg-primary-bg">Загрузка...</div>;
  }

  return (
    <div className="flex min-h-screen bg-primary-bg">
      <main className="flex-1 p-8">
        <div className="mb-8">
          <HeroSlider />
        </div>
        <PopularPage user={user} />
      </main>
    </div>
  );
}