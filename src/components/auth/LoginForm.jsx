'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import config from '@/pages/api/config';
import { isAuthenticated } from '@/utils/auth';
import { useRouter } from 'next/navigation';
import styles from './AuthForms.module.css';

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
    return <div className={styles.authContainer}>Загрузка...</div>;
  }

  return (
    <div className={styles.authContainer}>
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <h2 className={styles.authTitle}>Вход</h2>
        {error && <p className={styles.authError}>{error}</p>}

        <input
          type="text"
          name="login"
          placeholder="Почта или имя пользователя..."
          value={formData.login}
          onChange={handleChange}
          className={styles.authInput}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Пароль..."
          value={formData.password}
          onChange={handleChange}
          className={`${styles.authInput} ${styles.authInputPassword}`}
          required
        />
        <button
          type="submit"
          className={`${styles.authButton} ${styles.mainButton}`}
        >
          Войти
        </button>
        <p className={styles.authLinkContainer}>
          Еще нет аккаунта?{' '}
          <Link href="/auth/register" className={styles.authLink}>
            Регистрация
          </Link>
        </p>
      </form>
    </div>
  );
}