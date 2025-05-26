'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import config from '@/pages/api/config';
import { isAuthenticated } from '@/utils/auth';
import SidebarLayout from '@/layouts/sidebar.layout';

export default function Test() {
  const router = useRouter();
  const params = useParams();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuthAndFetchTest = async () => {
      console.log('Starting checkAuthAndFetchTest...', { params });

      // Check authentication
      try {
        console.log('Checking authentication...');
        const { authenticated, user } = await isAuthenticated();
        if (!authenticated) {
          console.log('User not authenticated, redirecting to login');
          router.push('/auth/login');
          setLoading(false);
          return;
        }
        console.log('User authenticated:', user);
      } catch (err) {
        console.error('Authentication error:', err.message);
        setError('Ошибка аутентификации');
        setLoading(false);
        return;
      }

      // Get test ID from params
      const id = params?.id;
      if (!id) {
        console.log('Test ID not provided');
        setError('Идентификатор теста не указан');
        setLoading(false);
        return;
      }
      console.log('Test ID:', id);

      // Fetch test
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('Token not found in localStorage');
          setError('Токен аутентификации отсутствует');
          setLoading(false);
          return;
        }
        console.log('Token found:', token);

        console.log('Fetching test from:', `${config.apiUrl}/tests/${id}`);
        const response = await axios.get(`${config.apiUrl}/tests/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        console.log('Test fetched successfully:', response.data);
        setTest(response.data);
        setLoading(false);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Ошибка при загрузке теста';
        console.error('Error fetching test:', {
          message: errorMessage,
          status: err.response?.status,
          data: err.response?.data,
          code: err.code,
        });
        setError(errorMessage);
        setLoading(false);
      }
    };

    checkAuthAndFetchTest();
  }, [router, params]);

  const handleAnswerChange = (questionId, answerId) => {
    setAnswers({ ...answers, [questionId]: answerId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = params?.id;
    if (!id) {
      setError('Идентификатор теста не указан');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Токен аутентификации отсутствует');
        return;
      }
      const response = await axios.post(`${config.apiUrl}/tests/${id}/submit`, {
        answers: Object.entries(answers).map(([questionId, answerId]) => ({
          question_id: questionId,
          answer_id: answerId,
        })),
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      alert(`Вы ответили правильно на ${response.data.correct_answers} из ${response.data.total_questions} вопросов!${
        response.data.achievement_earned ? ` Получено звание: ${response.data.achievement_earned}` : ''
      }`);
      router.push('/tests');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Ошибка при отправке теста';
      console.error('Error submitting test:', errorMessage);
      setError(errorMessage);
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-8">Загрузка...</div>;
  if (error) return <div className="container mx-auto px-4 py-8 text-red-600">{error}</div>;
  if (!test) return <div className="container mx-auto px-4 py-8">Тест не найден</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{test.title}</h1>
      <p className="text-gray-600 mb-4">{test.description || 'Без описания'}</p>
      <p className="text-gray-600 mb-4">
        <strong>Звание за прохождение:</strong> {test.achievement_name || 'Не указано'}
      </p>
      <form onSubmit={handleSubmit}>
        {test.questions.map((question) => (
          <div key={question.id} className="mb-4">
            <h2 className="text-xl">{question.text}</h2>
            {question.answers.map((answer) => (
              <div key={answer.id}>
                <label className="block">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={answer.id}
                    onChange={() => handleAnswerChange(question.id, answer.id)}
                    className="mr-2"
                  />
                  {answer.text}
                </label>
              </div>
            ))}
          </div>
        ))}
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Отправить тест
        </button>
      </form>
    </div>
  );
}

Test.getLayout = function getLayout(page) {
  return <SidebarLayout>{page}</SidebarLayout>;
};