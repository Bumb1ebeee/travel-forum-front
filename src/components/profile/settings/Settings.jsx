'use client';

import React, { useState } from 'react';
import axios from 'axios';
import config from '@/pages/api/config';
import PasswordChangeForm from './PasswordChangeForm';
import NotificationsForm from './NotificationsForm';
import DeleteAccountButton from './DeleteAccountButton';
import TwoFactorAuthForm from './TwoFactorAuthForm';

export default function SettingsContent({ user, setUser }) {
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [notifications, setNotifications] = useState({
    email_notifications: user?.email_notifications || false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleNotificationChange = (e) => {
    setNotifications({ ...notifications, [e.target.name]: e.target.checked });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${config.apiUrl}/change-password`,
        passwordData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setSuccess('Пароль успешно изменен');
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (err) {
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(', ');
        setError(errorMessages);
      } else {
        setError(err.response?.data?.message || 'Ошибка изменения пароля');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotificationsSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${config.apiUrl}/update-notifications`,
        notifications,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setUser({ ...user, email_notifications: notifications.email_notifications });
      setSuccess('Настройки уведомлений сохранены');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка сохранения настроек уведомлений');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.')) return;

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${config.apiUrl}/delete-account`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      localStorage.removeItem('token');
      window.location.href = '/'; // Перенаправление на главную после удаления
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка удаления аккаунта');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-8">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">Настройки</h2>
        {error && (
          <p className="text-red-500 text-center mb-6 bg-red-100 p-3 rounded-lg">{error}</p>
        )}
        {success && (
          <p className="text-green-500 text-center mb-6 bg-green-100 p-3 rounded-lg">{success}</p>
        )}

        <div className="space-y-12">
          <PasswordChangeForm
            passwordData={passwordData}
            handlePasswordChange={handlePasswordChange}
            handlePasswordSubmit={handlePasswordSubmit}
            submitting={submitting}
            error={error}
            success={success}
          />

          <NotificationsForm
            notifications={notifications}
            handleNotificationChange={handleNotificationChange}
            handleNotificationsSubmit={handleNotificationsSubmit}
            submitting={submitting}
            success={success}
          />

          <TwoFactorAuthForm
            user={user}
            submitting={submitting}
          />

          <DeleteAccountButton
            handleDeleteAccount={handleDeleteAccount}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  );
}