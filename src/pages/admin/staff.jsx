import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import StaffManagement from '@/components/dashboard/StaffManagement';
import LoadingIndicator from '@/components/loader/LoadingIndicator';
import SidebarLayout from '@/layouts/sidebar.layout';

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
    <SidebarLayout>
      <div className="p-8">
        <StaffManagement />
      </div>
    </SidebarLayout>
  );
} 