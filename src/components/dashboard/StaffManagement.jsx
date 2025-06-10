'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faUserMinus } from '@fortawesome/free-solid-svg-icons';
import config from '@/pages/api/config';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    role: 'moderator',
  });
  const [usernameError, setUsernameError] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.apiUrl}/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaff(response.data.staff || []);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки сотрудников:', err);
      setError(err.response?.data?.message || 'Не удалось загрузить список сотрудников');
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setUsernameError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${config.apiUrl}/staff`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      setFormData({ username: '', role: 'moderator' });
      fetchStaff();
    } catch (err) {
      const message = err.response?.data?.message || 'Не удалось добавить сотрудника';
      if (err.response?.status === 404) {
        setUsernameError(message);
      } else {
        setError(message);
      }
    }
  };

  const handleRemoveStaff = async (userId) => {
    if (!window.confirm('Вы уверены, что хотите уволить этого сотрудника?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${config.apiUrl}/staff/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось уволить сотрудника');
    }
  };

  const handleUsernameChange = (e) => {
    setFormData({ ...formData, username: e.target.value });
    setUsernameError(null); // Очистка ошибки при изменении
  };

  if (loading)
    return <div className="text-center py-4">Загрузка...</div>;
  if (error)
    return <div className="text-red-500 py-4 text-center">{error}</div>;

  return (
    <div className="space-y-6 m-4 sm:m-6">
      {/* Заголовок и кнопка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Сотрудники</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faUserPlus}/>
          <span>Нанять</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Таблица — отображается только на десктопе */}
        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Email
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Роль
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">Модератор</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleRemoveStaff(user.id)}
                      className="text-red-600 hover:text-red-900"
                      aria-label="Удалить"
                    >
                      <FontAwesomeIcon icon={faUserMinus}/>
                    </button>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Карточки — отображаются только на мобильных устройствах */}
        <div className="sm:hidden">
          {staff.length === 0 ? (
            <p className="text-center py-4 text-gray-500">Сотрудников нет</p>
          ) : (
            staff.map((user) => (
              <div key={user.id} className="border-b border-gray-200 p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{user.username}</h3>
                    <p className="text-sm text-gray-600">Email: {user.email}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveStaff(user.id)}
                    className="text-red-600 hover:text-red-900"
                    aria-label="Удалить"
                  >
                    <FontAwesomeIcon icon={faUserMinus}/>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Модальное окно */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 animate-fadeIn">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Нанять сотрудника</h3>
            <p className="text-sm text-gray-600 mb-4">
              Введите имя пользователя, чтобы назначить его модератором. Поле обязательно.
            </p>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Имя пользователя</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={handleUsernameChange}
                  className={`w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    usernameError ? 'border-red-500' : ''
                  }`}
                  required
                />
                {usernameError && <p className="text-red-500 text-xs mt-1">{usernameError}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setUsernameError(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Нанять
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;