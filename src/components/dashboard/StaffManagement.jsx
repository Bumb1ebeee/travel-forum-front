'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserPlus,
  faUserMinus,
  faBan,
  faUserCheck,
  faSearch,
  faUserShield,
  faLock,
  faUnlockAlt
} from '@fortawesome/free-solid-svg-icons';
import config from '@/pages/api/config';

const StaffManagement = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    role: 'moderator',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [usernameError, setUsernameError] = useState(null);
  const [staff, setStaff] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

// Фильтруем только пользователей с ролью "user"
  const filteredSuggestions = allUsers.filter(user =>
    user.role === 'user' &&
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.apiUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllUsers(response.data.users || []);
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
      setError(err.response?.data?.message || 'Не удалось загрузить список пользователей');
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Токен отсутствует');

      const response = await axios.get(`${config.apiUrl}/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStaff(response.data.staff || []);
    } catch (err) {
      setError(err.message || 'Не удалось загрузить список модераторов');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setUsernameError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${config.apiUrl}/staff`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Обновляем список пользователей, чтобы сразу отобразилась новая роль
      fetchAllUsers();

      setShowModal(false);
      setFormData({ username: '', role: 'moderator' });
    } catch (err) {
      const message = err.response?.data?.message || 'Не удалось добавить модератора';
      if (err.response?.status === 404) {
        setUsernameError(message);
      } else {
        setError(message);
      }
    }
  };

  const handleRemoveStaff = async (userId) => {
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${config.apiUrl}/staff/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Обновляем оба списка
      fetchStaff();        // Получаем актуальный список модераторов
      fetchAllUsers();     // Обновляем роли всех пользователей
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Не удалось уволить модератора';
      setError(errorMessage);
      alert('Ошибка: ' + errorMessage);
    }
  };


  const handleBlockUser = async (userId, isBlocked) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = isBlocked ? `${config.apiUrl}/users/${userId}/unblock` : `${config.apiUrl}/users/${userId}/block`;
      await axios.post(endpoint, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAllUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось изменить статус блокировки');
    }
  };

  const handleAssignModerator = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${config.apiUrl}/staff/assign`,
        { user_id: userId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchAllUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось назначить модератором');
    }
  };

  const handleUsernameChange = (e) => {
    setFormData({ ...formData, username: e.target.value });
    setUsernameError(null);
  };

  // Фильтрация и поиск
  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading)
    return <div className="text-center py-4">Загрузка...</div>;
  if (error)
    return <div className="text-red-500 py-4 text-center">{error}</div>;

  return (
    <div className="space-y-6 m-4 sm:m-6">
      {/* Заголовок и кнопка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Управление персоналом</h2>
          <p className="text-sm text-gray-600 mt-1">Управление пользователями и их ролями</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          <FontAwesomeIcon icon={faUserPlus} />
          <span>Нанять модератора</span>
        </button>
      </div>

      {/* Поиск и фильтры */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Поиск по имени или email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
          />
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
        </div>
        <div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="p-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
          >
            <option value="all">Все роли</option>
            <option value="user">Пользователь</option>
            <option value="moderator">Модератор</option>
            <option value="admin">Администратор</option>
          </select>
        </div>
      </div>

      {/* Таблица всех пользователей */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Роль
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
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
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'moderator' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'admin' ? 'Администратор' :
                           user.role === 'moderator' ? 'Модератор' :
                           'Пользователь'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          {
                            user.role === 'admin' ? (
                              <div className="text-gray-500 text-sm">Администратор</div>
                            ) : user.role === 'moderator' ? (
                              <button
                                onClick={() => {
                                  if (window.confirm('Вы уверены, что хотите снять полномочия модератора с этого пользователя?')) {
                                    handleRemoveStaff(user.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-all duration-200"
                                title="Снять полномочия модератора"
                              >
                                <FontAwesomeIcon icon={faUserMinus} />
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Вы уверены, что хотите назначить этого пользователя модератором?')) {
                                      handleAssignModerator(user.id);
                                    }
                                  }}
                                  className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50 transition-all duration-200"
                                  title="Назначить модератором"
                                >
                                  <FontAwesomeIcon icon={faUserShield} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Вы уверены, что хотите ${user.blocked ? 'разблокировать' : 'заблокировать'} этого пользователя?`)) {
                                      handleBlockUser(user.id, user.blocked);
                                    }
                                  }}
                                  className={`${
                                    user.blocked ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-900'
                                  } p-2 rounded-full hover:bg-gray-50 transition-all duration-200`}
                                  title={user.blocked ? 'Разблокировать пользователя' : 'Заблокировать пользователя'}
                                >
                                  <FontAwesomeIcon icon={user.blocked ? faUnlockAlt : faLock} />
                                </button>
                              </>
                            )
                          }
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500">
                      Пользователи не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Мобильные карточки */}
        <div className="sm:hidden">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <div key={user.id} className="border-b border-gray-200 p-4 last:border-b-0">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                      <span className="text-indigo-600 font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{user.username}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {user.role === 'admin' ? (
                      <div className="text-gray-500 text-sm">Администратор</div>
                    ) : user.role === 'moderator' ? (
                      <button
                        onClick={() => {
                          if (window.confirm('Вы уверены, что хотите снять полномочия модератора с этого пользователя?')) {
                            handleRemoveStaff(user.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-all duration-200"
                        title="Снять полномочия модератора"
                      >
                        <FontAwesomeIcon icon={faUserMinus} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            if (window.confirm('Вы уверены, что хотите назначить этого пользователя модератором?')) {
                              handleAssignModerator(user.id);
                            }
                          }}
                          className="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50 transition-all duration-200"
                          title="Назначить модератором"
                        >
                          <FontAwesomeIcon icon={faUserShield} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Вы уверены, что хотите ${user.blocked ? 'разблокировать' : 'заблокировать'} этого пользователя?`)) {
                              handleBlockUser(user.id, user.blocked);
                            }
                          }}
                          className={`${
                            user.blocked ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-900'
                          } p-2 rounded-full hover:bg-gray-50 transition-all duration-200`}
                          title={user.blocked ? 'Разблокировать пользователя' : 'Заблокировать пользователя'}
                        >
                          <FontAwesomeIcon icon={user.blocked ? faUnlockAlt : faLock} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'moderator' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role === 'admin' ? 'Администратор' :
                     user.role === 'moderator' ? 'Модератор' :
                     'Пользователь'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              Пользователи не найдены
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно: Назначить модератором */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Назначить модератора</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setUsernameError(null);
                  setShowSuggestions(false);
                }}
                className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
              >
                <span className="sr-only">Закрыть</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Введите имя пользователя, чтобы назначить его модератором.
            </p>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя пользователя</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, username: val });
                    setSearchQuery(val);
                    setShowSuggestions(true);
                  }}
                  placeholder="Введите имя..."
                  className={`w-full p-3 rounded-lg border ${
                    usernameError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 
                    'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  } focus:outline-none focus:ring-2 transition-all duration-200`}
                  required
                />

                {/* Подсказки */}
                {showSuggestions && searchQuery && filteredSuggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto border border-gray-300 rounded-lg bg-white shadow-lg">
                    {filteredSuggestions.map((user) => (
                      <li
                        key={user.id}
                        className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-gray-800 transition-colors duration-200"
                        onClick={() => {
                          setFormData({ ...formData, username: user.username });
                          setShowSuggestions(false);
                        }}
                      >
                        {user.username}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {usernameError && (
                <p className="text-sm text-red-600 mt-1">{usernameError}</p>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setUsernameError(null);
                    setShowSuggestions(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all duration-200"
                >
                  Назначить
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