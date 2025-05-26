'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import config from '@/pages/api/config';
import { isAuthenticated } from '@/utils/auth';
import SidebarLayout from '@/layouts/sidebar.layout';

export default function TestList() {
  const router = useRouter();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { authenticated, user } = await isAuthenticated();
      if (!authenticated || user.role !== 'admin') {
        router.push('/auth/login');
      } else {
        fetchTests();
      }
    };

    const fetchTests = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${config.apiUrl}/tests`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTests(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Ошибка при загрузке тестов');
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleCreateTest = () => {
    router.push('/admin/create-test');
  };

  if (loading) return <div className="container mx-auto px-4 py-8">Загрузка...</div>;
  if (error) return <div className="container mx-auto px-4 py-8 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Список тестов</h1>
        <button
          onClick={handleCreateTest}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Создать новый тест
        </button>
      </div>

      {tests.length === 0 ? (
        <p>Тесты отсутствуют</p>
      ) : (
        <div className="grid gap-4">
          {tests.map((test) => (
            <div
              key={test.id}
              className="border border-gray-200 p-4 rounded-md hover:shadow-md"
            >
              <h2 className="text-lg font-medium">{test.title}</h2>
              <p className="text-gray-600">{test.description || 'Без описания'}</p>
              <p className="text-gray-600">
                <strong>Звание за прохождение:</strong> {test.achievement_name || 'Не указано'}
              </p>
              <button
                onClick={() => router.push(`/tests/${test.id}`)}
                className="mt-2 text-blue-600 hover:underline"
              >
                Просмотреть тест
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

TestList.getLayout = function getLayout(page) {
  return <SidebarLayout>{page}</SidebarLayout>;
};