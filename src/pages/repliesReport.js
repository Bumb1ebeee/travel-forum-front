'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/pages/api/config';
import { toast } from 'react-toastify';
import SidebarLayout from '@/layouts/sidebar.layout';

import Link from 'next/link'; // Импортируйте Link

export default function MyResponseReportsPage({ user }) {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');

  const fetchUserReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.apiUrl}/users/me/response-reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setReports(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка загрузки жалоб');
    }
  };

  useEffect(() => {
    fetchUserReports();
  }, []);

  const handleModerate = async (reportId, status) => {
    if (!window.confirm(`Вы уверены, что хотите ${status === 'approved' ? 'удалить ответ' : 'отклонить жалобу'}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${config.apiUrl}/reports/${reportId}/moderate`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchUserReports();
      toast.success(`Жалоба ${status === 'approved' ? 'удалена' : 'отклонена'}`);
    } catch (err) {
      console.error(err);
      alert('Ошибка модерации');
    }
  };

  return (
    <SidebarLayout>
      <div className="mt-6 m-3 sm:mt-0">
        <h2 className="text-xl sm:text-2xl mb-3 font-bold text-gray-900">Жалобы на мои ответы</h2>
        {error && (
          <p className="text-red-500 text-center mb-6 bg-red-100 p-3 rounded-lg">{error}</p>
        )}
        {reports.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-md text-center text-gray-500">
            Нет жалоб на ваши ответы
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => {
              const isAuthor = report.reportable?.discussion?.user_id === user?.id;

              return (
                <Link
                  key={report.id}
                  href={`/discussions/${report.reportable.discussion_id}`} // Ссылка на обсуждение
                  passHref
                >
                  <div className="bg-white p-4 rounded shadow hover:shadow-md transition-shadow cursor-pointer">
                    <p><strong>Жалоба от:</strong> {report.reporter?.name || 'Неизвестный'}</p>
                    <p><strong>Причина:</strong> {report.reason}</p>
                    <p><strong>Статус:</strong> {report.status}</p>
                    <p><strong>Комментарий:</strong> {report.reportable.content || 'Нет комментария'}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>

                    {/* Кнопки модерации только для автора обсуждения */}
                    {isAuthor && (
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault(); // Предотвращаем переход по ссылке
                            handleModerate(report.id, 'rejected');
                          }}
                          className="flex-1 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                        >
                          Отклонить
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault(); // Предотвращаем переход по ссылке
                            handleModerate(report.id, 'approved');
                          }}
                          className="flex-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                        >
                          Удалить ответ
                        </button>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}