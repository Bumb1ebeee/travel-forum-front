'use client';

import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import MainLayout from "@/layouts/main.layout";

export default function LoginPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/');
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center">
        <LoginForm onSuccess={handleSuccess}/>
      </div>
    </MainLayout>
  );
}