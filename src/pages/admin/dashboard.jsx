import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import SidebarLayout from '@/layouts/sidebar.layout';

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
    <SidebarLayout>
        <AdminDashboard user={user} />
    </SidebarLayout>
  );
}