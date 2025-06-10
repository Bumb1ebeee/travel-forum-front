import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faUsers,
  faComments,
  faHeart,
  faUserPlus,
  faUserFriends,
  faGavel,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import config from '@/pages/api/config';

// Регистрация компонентов Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = ({ user }) => {
  const router = useRouter();
  const [stats, setStats] = useState({});
  const [likesChartData, setLikesChartData] = useState({ labels: [], datasets: [] });
  const [usersChartData, setUsersChartData] = useState({ labels: [], datasets: [] });
  const [repliesChartData, setRepliesChartData] = useState({ labels: [], datasets: [] });
  const [reportsChartData, setReportsChartData] = useState({ labels: [], datasets: [] });
  const [moderatorsChartData, setModeratorsChartData] = useState({ labels: [], datasets: [] });
  const [recentActions, setRecentActions] = useState({
    recentDiscussions: [],
    recentReplies: [],
    recentReports: [],
  });
  const [moderatorsStats, setModeratorsStats] = useState([]);
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

        const statsResponse = await axios.get(`${config.apiUrl}/statistics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(statsResponse.data);

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

          const moderatorsResponse = await axios.get(`${config.apiUrl}/statistics/moderators`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const modData = moderatorsResponse.data || [];

          const labels = modData.map(mod => mod.username);
          const reportsProcessed = modData.map(mod => mod.processed_reports);
          const discussionsReviewed = modData.map(mod => mod.reviewed_discussions);
          const repliesReviewed = modData.map(mod => mod.reviewed_replies);

          setModeratorsChartData({
            labels: labels,
            datasets: [
              {
                label: 'Обработанные жалобы',
                data: reportsProcessed,
                backgroundColor: 'rgba(255, 206, 86, 0.5)',
              },
              {
                label: 'Проверенные обсуждения',
                data: discussionsReviewed,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
              },
              {
                label: 'Проверенные комментарии',
                data: repliesReviewed,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
              },
            ],
          });

          setModeratorsStats(modData);
        }

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

  // Проверка наличия действий у модератора
  const hasRecentActions =
    user.role === 'moderator' &&
    (recentActions.recentDiscussions.length > 0 ||
      recentActions.recentReplies.length > 0 ||
      recentActions.recentReports.length > 0);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Заголовок */}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Статистика</h1>

      {/* Состояние загрузки или ошибка */}
      {loading && <div className="text-center py-4">Загрузка...</div>}
      {error && <div className="text-red-500 py-4">{error}</div>}

      {!loading && !error && (
        <>
          {/* Статистика в виде плиток */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.role === 'user' && (
              <>
                <StatCard icon={faComments} title="Ваши обсуждения" value={stats.totalDiscussions || 0} bgColor="bg-blue-100" textColor="text-blue-600" />
                <StatCard icon={faComments} title="Ваши комментарии" value={stats.totalReplies || 0} bgColor="bg-green-100" textColor="text-green-600" />
                <StatCard icon={faHeart} title="Лайки на ваш контент" value={stats.totalLikes || 0} bgColor="bg-red-100" textColor="text-red-600" />
                <StatCard icon={faUserPlus} title="Ваши подписки" value={stats.subscriptionsMade || 0} bgColor="bg-purple-100" textColor="text-purple-600" />
                <StatCard icon={faUserFriends} title="Ваши подписчики" value={stats.subscribers || 0} bgColor="bg-teal-100" textColor="text-teal-600" />
              </>
            )}

            {user.role === 'moderator' && (
              <>
                <StatCard icon={faExclamationTriangle} title="Ожидающие жалобы" value={stats.pendingReports || 0} bgColor="bg-red-100" textColor="text-red-600" />
                <StatCard icon={faComments} title="Ожидающие обсуждения" value={stats.pendingDiscussions || 0} bgColor="bg-blue-100" textColor="text-blue-600" />
                <StatCard icon={faGavel} title="Проверенные обсуждения" value={stats.reviewedDiscussions || 0} bgColor="bg-green-100" textColor="text-green-600" />
                <StatCard icon={faComments} title="Проверенные комментарии" value={stats.reviewedReplies || 0} bgColor="bg-purple-100" textColor="text-purple-600" />
                <StatCard icon={faExclamationTriangle} title="Обработанные жалобы" value={stats.processedReports || 0} bgColor="bg-yellow-100" textColor="text-yellow-600" />
              </>
            )}

            {user.role === 'admin' && (
              <>
                <StatCard icon={faUsers} title="Пользователи" value={stats.totalUsers || 0} bgColor="bg-blue-100" textColor="text-blue-600" />
                <StatCard icon={faComments} title="Обсуждения" value={stats.publishedDiscussions || 0} bgColor="bg-green-100" textColor="text-green-600" />
                <StatCard icon={faComments} title="Комментарии" value={stats.totalReplies || 0} bgColor="bg-purple-100" textColor="text-purple-600" />
                <StatCard icon={faHeart} title="Лайки" value={stats.totalLikes || 0} bgColor="bg-red-100" textColor="text-red-600" />
              </>
            )}
          </div>

          {/* График лайков */}
          {(user.role === 'admin' || user.role === 'user') && (
            <GraphCard title="Активность лайков" height="h-64 sm:h-80">
              <Line data={likesChartData} options={chartOptions('Лайки за последние 30 дней')} />
            </GraphCard>
          )}

          {/* Графики только для администратора */}
          {user.role === 'admin' && (
            <>
              <GraphCard title="Рост пользователей" height="h-64 sm:h-80">
                <Line data={usersChartData} options={chartOptions('Новые пользователи за 30 дней')} />
              </GraphCard>

              <GraphCard title="Комментарии" height="h-64 sm:h-80">
                <Line data={repliesChartData} options={chartOptions('Комментарии за 30 дней')} />
              </GraphCard>

              <GraphCard title="Статистика модераторов" height="h-64 sm:h-80">
                <Bar data={moderatorsChartData} options={chartOptions('Модераторы: Жалобы / Обсуждения')} />
              </GraphCard>

              {/* Таблица статистики модераторов */}
              {moderatorsStats.length > 0 && (
                <div className="bg-white rounded-lg shadow p-4 sm:p-6 overflow-x-auto">
                  <h2 className="text-md sm:text-lg font-semibold text-gray-900 mb-4">Статистика модераторов</h2>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Жалобы</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Обсуждения</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Комментарии</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {moderatorsStats.map((mod, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap">{mod.username}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{mod.processed_reports}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{mod.reviewed_discussions}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{mod.reviewed_replies}</td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Последние действия */}
              {hasRecentActions && (
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h2 className="text-md sm:text-lg font-semibold text-gray-900 mb-4">Последние действия</h2>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto">
                    {recentActions.recentDiscussions.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        <li className="font-medium text-sm">Обсуждения</li>
                        {recentActions.recentDiscussions.map(disc => (
                          <li key={disc.id} className="text-xs sm:text-sm text-gray-600 truncate">
                            {disc.title} ({disc.status}) - {new Date(disc.updated_at).toLocaleDateString()}
                          </li>
                        ))}
                      </ul>
                    )}

                    {recentActions.recentReplies.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        <li className="font-medium text-sm">Комментарии</li>
                        {recentActions.recentReplies.map(reply => (
                          <li key={reply.id} className="text-xs sm:text-sm text-gray-600 truncate">
                            {reply.content.substring(0, 50)}... - {new Date(reply.updated_at).toLocaleDateString()}
                          </li>
                        ))}
                      </ul>
                    )}

                    {recentActions.recentReports.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        <li className="font-medium text-sm">Жалобы</li>
                        {recentActions.recentReports.map(report => (
                          <li key={report.id} className="text-xs sm:text-sm text-gray-600 truncate">
                            Жалоба #{report.id} ({report.status}) - {new Date(report.updated_at).toLocaleDateString()}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

// Компонент для отображения статистики
const StatCard = ({ icon, title, value, bgColor, textColor }) => (
  <div className="bg-white rounded-lg shadow p-4 flex items-center">
    <div className={`p-3 rounded-full ${bgColor} ${textColor}`}>
      <FontAwesomeIcon icon={icon} className="w-6 h-6" />
    </div>
    <div className="ml-4">
      <p className="text-xs font-medium text-gray-600">{title}</p>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

// Карточка с графиком
const GraphCard = ({ title, children, height = 'h-80' }) => (
  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
    <h2 className="text-md sm:text-lg font-semibold text-gray-900 mb-4">{title}</h2>
    <div className={`${height} w-full`}>{children}</div>
  </div>
);

export default AdminDashboard;