'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/pages/api/config';
import UserInfo from './UserInfo';
import AvatarUploader from './AvatarUploader';
import { resetAuthCache } from '@/utils/auth';
import { useRouter } from 'next/navigation';

export default function UserProfile({ user, setUser }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
  });
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      username: user?.username || '',
      email: user?.email || '',
    });
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatar(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${config.apiUrl}/user-update`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setUser(response.data.user);
      setEditMode(false);
      setError('');
    } catch (err) {
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(', ');
        setError(errorMessages);
      } else {
        setError(err.response?.data?.message || 'Ошибка обновления данных');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    e.preventDefault();
    if (!avatar) return setError('Выберите файл');

    const formData = new FormData();
    formData.append('avatar', avatar);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${config.apiUrl}/update-avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setUser({ ...user, avatar: response.data.avatar });
      setError('');
      setAvatar(null);
    } catch (err) {
      console.error('Ошибка загрузки аватара:', err.message);
      setError(err.response?.data?.message || 'Не удалось загрузить аватар');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    resetAuthCache();
    router.push('/auth/login');
  };

  return (
    <div className="p-3 sm:p-6 min-h-screen m-2 sm:m-4">
      <div className="w-full max-w-3xl mx-auto my-auto bg-white rounded-2xl shadow-md p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Профиль</h2>
        </div>
        {error && (
          <p className="text-red-500 text-center mb-6 bg-red-100 p-3 rounded-lg">{error}</p>
        )}

        <div className="flex flex-wrap gap-4 sm:gap-6 justify-center">
          <div className="flex-1 min-w-[200px] max-w-[400px]">
            <UserInfo
              user={user}
              editMode={editMode}
              formData={formData}
              handleChange={handleChange}
              setEditMode={setEditMode}
              handleSubmit={handleSubmit}
              submitting={submitting}
            />
          </div>
          <div className="flex-none min-w-[120px] max-w-[180px]">
            <AvatarUploader
              user={user}
              avatar={avatar}
              handleAvatarChange={handleAvatarChange}
              handleAvatarUpload={handleAvatarUpload}
              submitting={submitting}
            />
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors w-full min-w-[120px] sm:w-auto"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}