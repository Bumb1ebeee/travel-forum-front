import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faUsers, faComments, faHeart, faUserPlus, faUserFriends, faGavel, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import config from '@/pages/api/config';

// Регистрация компонентов Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AdminDashboard = ({ user }) => {
  const router = useRouter();
  const [stats, setStats] = useState({});
  const [likesChartData, setLikesChartData] = useState({ labels: [], datasets: [] });
  const [usersChartData, setUsersChartData] = useState({ labels: [], datasets: [] });
  const [repliesChartData, setRepliesChartData] = useState({ labels: [], datasets: [] });
  const [reportsChartData, setReportsChartData] = useState({ labels: [], datasets: [] });
  const [recentActions, setRecentActions] = useState({
    recentDiscussions: [],
    recentReplies: [],
    recentReports: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка статистики
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Запрос статистики
        const statsResponse = await axios.get(`${config.apiUrl}/statistics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(statsResponse.data);

        // Запрос данных для графика лайков (только для admin и user)
        if (user.role === 'admin' || user.role === 'user') {
          const likesResponse = await axios.get(`${config.apiUrl}/statistics/likes`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setLikesChartData({
            labels: likesResponse.data.labels || [],
            datasets: [
              {
                label: user.role === 'user' ? 'Лайки на ваш контент' : 'Общие лайки',
                data: likesResponse.data.values || [],
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
              },
            ],
          });
        }

        // Запрос данных для графиков (admin)
        if (user.role === 'admin') {
          const usersResponse = await axios.get(`${config.apiUrl}/statistics/users`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUsersChartData({
            labels: usersResponse.data.labels || [],
            datasets: [
              {
                label: 'Новые пользователи',
                data: usersResponse.data.values || [],
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true,
              },
            ],
          });

          const repliesResponse = await axios.get(`${config.apiUrl}/statistics/replies`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setRepliesChartData({
            labels: repliesResponse.data.labels || [],
            datasets: [
              {
                label: 'Новые комментарии',
                data: repliesResponse.data.values || [],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
              },
            ],
          });
        }

        // Запрос данных для графика жалоб и последних действий (moderator)
        if (user.role === 'moderator') {
          const reportsResponse = await axios.get(`${config.apiUrl}/statistics/reports`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setReportsChartData({
            labels: reportsResponse.data.labels || [],
            datasets: [
              {
                label: 'Обработанные жалобы',
                data: reportsResponse.data.values || [],
                borderColor: 'rgba(255, 206, 86, 1)',
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                fill: true,
              },
            ],
          });

          const actionsResponse = await axios.get(`${config.apiUrl}/statistics/recent-actions`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setRecentActions(actionsResponse.data);
        }

        setLoading(false);
      } catch (err) {
        console.error('Ошибка загрузки статистики:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Не удалось загрузить статистику');
        setLoading(false);
      }
    };

    fetchStats();
  }, [router, user]);

  // Опции для графиков
  const chartOptions = (title) => ({
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: title },
    },
  });

  // Проверка, есть ли данные для "Последних действий"
  const hasRecentActions =
    user.role === 'moderator' &&
    (recentActions.recentDiscussions.length > 0 ||
      recentActions.recentReplies.length > 0 ||
      recentActions.recentReports.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Статистика</h1>
      </div>

      {/* Состояние загрузки или ошибка */}
      {loading && <div className="text-center py-4">Загрузка...</div>}
      {error && <div className="text-red-500 py-4">{error}</div>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.role === 'user' && (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <FontAwesomeIcon icon={faComments} className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ваши обсуждения</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.totalDiscussions || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <FontAwesomeIcon icon={faComments} className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ваши комментарии</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.totalReplies || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-red-100 text-red-600">
                      <FontAwesomeIcon icon={faHeart} className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Лайки на ваш контент</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.totalLikes || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                      <FontAwesomeIcon icon={faUserPlus} className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ваши подписки</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.subscriptionsMade || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-teal-100 text-teal-600">
                      <FontAwesomeIcon icon={faUserFriends} className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ваши подписчики</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.subscribers || 0}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {user.role === 'moderator' && (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-red-100 text-red-600">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ожидающие жалобы</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.pendingReports || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <FontAwesomeIcon icon={faComments} className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ожидающие обсуждения</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.pendingDiscussions || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <FontAwesomeIcon icon={faGavel} className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Проверенные обсуждения</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.reviewedDiscussions || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                      <FontAwesomeIcon icon={faComments} className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Проверенные комментарии</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.reviewedReplies || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Обработанные жалобы</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.processedReports || 0}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {user.role === 'admin' && (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <FontAwesomeIcon icon={faUsers} className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Пользователи</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <FontAwesomeIcon icon={faComments} className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Обсуждения</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.publishedDiscussions || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                      <FontAwesomeIcon icon={faComments} className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Комментарии</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.totalReplies || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-red-100 text-red-600">
                      <FontAwesomeIcon icon={faHeart} className="w-6 h-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Лайки</p>
                      <p className="text-2xl font-semibold text-gray-900">{stats.totalLikes || 0}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {(user.role === 'admin' || user.role === 'user') && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Статистика активности</h2>
              <div className="h-80">
                <Line
                  data={likesChartData}
                  options={chartOptions(
                    user.role === 'user'
                      ? 'Лайки на ваши обсуждения и комментарии за 30 дней'
                      : 'Активность лайков за последние 30 дней'
                  )}
                />
              </div>
            </div>
          )}

          {user.role === 'admin' && (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Рост пользователей</h2>
                <div className="h-80">
                  <Line data={usersChartData} options={chartOptions('Новые пользователи за последние 30 дней')} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Активность комментариев</h2>
                <div className="h-80">
                  <Line data={repliesChartData} options={chartOptions('Новые комментарии за последние 30 дней')} />
                </div>
              </div>
            </>
          )}

          {user.role === 'moderator' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Активность жалоб</h2>
              <div className="h-80">
                <Line data={reportsChartData} options={chartOptions('Обработанные жалобы за последние 30 дней')} />
              </div>
            </div>
          )}

          {hasRecentActions && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Последние действия</h2>
              <div className="space-y-4">
                {recentActions.recentDiscussions.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-gray-700">Обсуждения</h3>
                    <ul className="mt-2 space-y-2">
                      {recentActions.recentDiscussions.map((discussion) => (
                        <li key={discussion.id} className="text-sm text-gray-600">
                          {discussion.title} ({discussion.status}) - {new Date(discussion.updated_at).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {recentActions.recentReplies.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-gray-700">Комментарии</h3>
                    <ul className="mt-2 space-y-2">
                      {recentActions.recentReplies.map((reply) => (
                        <li key={reply.id} className="text-sm text-gray-600">
                          {reply.content.substring(0, 50)}... - {new Date(reply.updated_at).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {recentActions.recentReports.length > 0 && (
                  <div>
                    <h3 className="text-md font-medium text-gray-700">Жалобы</h3>
                    <ul className="mt-2 space-y-2">
                      {recentActions.recentReports.map((report) => (
                        <li key={report.id} className="text-sm text-gray-600">
                          Жалоба #{report.id} ({report.status}) - {new Date(report.updated_at).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;