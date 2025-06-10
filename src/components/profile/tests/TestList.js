'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function TestList({ user, isMobile }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch('/api/tests', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setTests(data);
        }
      } catch (error) {
        console.error('Ошибка при загрузке тестов:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  if (loading) {
    return <div>Загрузка тестов...</div>;
  }

  return (
    <div className="space-y-4">
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'justify-between'} items-center`}>
        <h3 className={`font-semibold ${isMobile ? 'text-lg' : 'text-xl'}`}>
          Список тестов
        </h3>
        <Link href="/tests/create" className={isMobile ? 'w-full' : ''}>
          <Button className={isMobile ? 'w-full' : ''}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Создать тест
          </Button>
        </Link>
      </div>

      <div className={`grid gap-4 ${
        isMobile 
          ? 'grid-cols-1' 
          : 'md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {tests.map((test) => (
          <Link href={`/tests/${test.id}`} key={test.id}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className={isMobile ? 'p-4' : ''}>
                <CardTitle className={isMobile ? 'text-lg' : ''}>
                  {test.title}
                </CardTitle>
              </CardHeader>
              <CardContent className={isMobile ? 'p-4 pt-0' : ''}>
                <p className={`text-gray-600 ${isMobile ? 'text-sm' : ''}`}>
                  {test.description}
                </p>
                <div className={`mt-4 flex justify-between items-center ${
                  isMobile ? 'text-xs' : 'text-sm'
                }`}>
                  <span className="text-gray-500">
                    Вопросов: {test.questionsCount}
                  </span>
                  <span className="text-gray-500">
                    {test.isPublished ? 'Опубликован' : 'Черновик'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {tests.length === 0 && (
        <div className="text-center py-8">
          <p className={`text-gray-500 ${isMobile ? 'text-sm' : ''}`}>
            У вас пока нет созданных тестов
          </p>
        </div>
      )}
    </div>
  );
} 