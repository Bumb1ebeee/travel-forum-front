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
      await axios.post(
        `${config.apiUrl}/staff`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
    setUsernameError(null); // Очищаем ошибку при изменении ввода
  };

  if (loading) return <div className="text-center py-4">Загрузка...</div>;
  if (error) return <div className="text-red-500 py-4">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Управление сотрудниками</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faUserPlus} />
          Нанять сотрудника
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Пользователь
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Роль
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Действия
            </th>
          </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
          {staff.map((user) => (
            <tr key={user.id}>
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
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900">Модератор</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => handleRemoveStaff(user.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <FontAwesomeIcon icon={faUserMinus} />
                </button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Нанять сотрудника</h3>
              <p className="text-sm text-gray-600 mb-4">
                Введите имя пользователя, чтобы назначить его модератором. Поле обязательно для заполнения.
              </p>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Имя пользователя</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.username}
                      onChange={handleUsernameChange}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        usernameError ? 'border-red-500' : ''
                      }`}
                      required
                    />
                    {usernameError && (
                      <p className="absolute text-red-500 text-xs mt-1">{usernameError}</p>
                    )}
                  </div>
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
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                  >
                    Нанять
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;