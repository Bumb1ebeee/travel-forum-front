'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import config from '@/pages/api/config';
import { isAuthenticated } from '@/utils/auth';
import { useRouter } from 'next/navigation';

export default function RegisterForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
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

    if (!formData.name.trim()) {
      setError('Пожалуйста, введите имя');
      return;
    }
    if (!formData.username.trim()) {
      setError('Пожалуйста, введите имя пользователя');
      return;
    }
    if (!formData.email.trim()) {
      setError('Пожалуйста, введите почту');
      return;
    }
    if (!formData.password.trim()) {
      setError('Пожалуйста, введите пароль');
      return;
    }
    if (formData.password !== formData.password_confirmation) {
      setError('Пароли не совпадают');
      return;
    }

    console.log('FormData перед отправкой:', formData);

    try {
      const response = await axios.post(`${config.apiUrl}/register`, formData, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('Ответ от сервера:', response.data);
      localStorage.setItem('token', response.data.token);
      if (onSuccess) onSuccess();
      router.push('/');
    } catch (err) {
      console.error('Ошибка запроса:', err.response?.data);
      setError(err.response?.data?.message || 'Ошибка регистрации');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Регистрация</h2>
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <input
          type="text"
          name="name"
          placeholder="Имя..."
          value={formData.name}
          onChange={handleChange}
          className="mb-4 p-3 w-full border border-gray-300 rounded-lg text-gray-500 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          required
        />
        <input
          type="text"
          name="username"
          placeholder="Имя пользователя..."
          value={formData.username}
          onChange={handleChange}
          className="mb-4 p-3 w-full border border-gray-300 rounded-lg text-gray-500 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Почта..."
          value={formData.email}
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
          className="mb-4 p-3 w-full border border-gray-300 rounded-lg text-gray-500 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          required
        />
        <input
          type="password"
          name="password_confirmation"
          placeholder="Подтвердите пароль..."
          value={formData.password_confirmation}
          onChange={handleChange}
          className="mb-6 p-3 w-full border border-gray-300 rounded-lg text-gray-500 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          required
        />
        <button
          type="submit"
          className="w-full p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Регистрация
        </button>
        <p className="mt-4 text-center text-gray-500">
          Уже есть аккаунт?{' '}
          <Link href="/auth/login" className="text-gray-500 hover:underline">
            Войти
          </Link>
        </p>
      </form>
    </div>
  );
}