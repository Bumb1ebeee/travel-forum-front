'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import config from '@/pages/api/config';
import { isAuthenticated } from '@/utils/auth';
import MainLayout from "@/layouts/main.layout";

export default function TwoFactorLogin() {
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { authenticated } = await isAuthenticated();
      if (authenticated) {
        router.push('/');
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const sessionId = localStorage.getItem('2fa_session_id');
      if (!sessionId) {
        setError('Ошибка: сессия недействительна');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${config.apiUrl}/2fa/verify`,
        { two_factor_code: twoFactorCode, session_id: sessionId },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      localStorage.setItem('token', response.data.token);
      localStorage.removeItem('2fa_session_id');
      localStorage.removeItem('login');
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Неверный код 2FA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center">
        <form onSubmit={handleSubmit} className="p-8 bg-white rounded-2xl shadow-lg w-full max-w-sm">
          <h2 className="text-2xl font-bold text-center mb-6">Двухфакторная аутентификация</h2>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <p className="text-gray-600 mb-4">
            Введите код из приложения-аутентификатора (например, Google Authenticator).
          </p>
          <input
            type="text"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            placeholder="Код 2FA..."
            className="mb-6 p-3 w-full border border-gray-300 rounded-lg text-gray-500 placeholder-gray-500 focus:outline-none focus:ring-2"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 text-white rounded-lg transition-colors main_button disabled:opacity-50"
          >
            Подтвердить
          </button>
        </form>
      </div>
    </MainLayout>
  );
}