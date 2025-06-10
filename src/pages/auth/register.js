'use client';

import { useRouter } from 'next/navigation';
import RegisterForm from '@/components/auth/RegisterForm';
import MainLayout from "@/layouts/main.layout";

export default function RegisterPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/');
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center">
        <RegisterForm onSuccess={handleSuccess}/>
      </div>
    </MainLayout>
  );
}