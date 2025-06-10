'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import config from '@/pages/api/config';
import { isAuthenticated } from '@/utils/auth';
import { useRouter } from 'next/navigation';

export default function LoginForm({ onSuccess }) {
  const [formData, setFormData] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { authenticated } = await isAuthenticated();
      setAuthenticated(authenticated);
      setLoading(false);
      if (authenticated) {
        router.push('/');
      }
    };
    checkAuth();
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.login.trim()) {
      setError('Пожалуйста, введите почту или имя пользователя');
      return;
    }
    if (!formData.password.trim()) {
      setError('Пожалуйста, введите пароль');
      return;
    }

    console.log('FormData перед отправкой:', formData);

    try {
      const response = await axios.post(`${config.apiUrl}/login`, formData, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('Ответ от сервера:', response.data);

      if (response.data.two_factor_enabled) {
        localStorage.setItem('2fa_session_id', response.data.session_id);
        localStorage.setItem('login', formData.login);
        router.push('/auth/2fa');
      } else {
        localStorage.setItem('token', response.data.token);
        if (onSuccess) onSuccess();
        router.push('/');
      }
    } catch (err) {
      console.error('Ошибка запроса:', err.response?.data);
      setError(err.response?.data?.message || 'Ошибка авторизации');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }

  return (
    <div className="m-2 min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="p-3 sm:p-8 bg-white rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-2 sm:mb-6">Вход</h2>
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <input
          type="text"
          name="login"
          placeholder="Почта или имя пользователя..."
          value={formData.login}
          onChange={handleChange}
          className="mb-4 p-3 w-full border border-gray-300 rounded-lg text-gray-500 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Пароль..."
          value={formData.password}
          onChange={handleChange}
          className="mb-6 p-3 w-full border border-gray-300 rounded-lg text-gray-500 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          required
        />
        <button
          type="submit"
          className="w-full p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Войти
        </button>
        <p className="mt-4 text-center text-gray-500">
          Еще нет аккаунта?{' '}
          <Link href="/auth/register" className="text-gray-500 hover:underline">
            Регистрация
          </Link>
        </p>
      </form>
    </div>
  );
}