'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/pages/api/config';
import { toast } from 'react-toastify';
import SidebarLayout from '@/layouts/sidebar.layout';
import Link from 'next/link';
import Head from 'next/head';

export default function MyResponseReportsPage({ user }) {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState('all');

  const pageUrl = 'http://45.153.191.235/profile/reports/responses';

  const fetchUserReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Требуется авторизация');
      }
      const response = await axios.get(`${config.apiUrl}/users/me/response-reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(response.data.data || []);
      setError('');
    } catch (err) {
      console.error('Fetch error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Ошибка загрузки жалоб');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserReports();
  }, []);

  const handleModerate = async (reportId, status) => {
    if (!confirm(`Вы уверены, что хотите ${status === 'approved' ? 'удалить ответ' : 'отклонить жалобу'}?`)) {
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
      console.error('Moderation error:', err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || 'Ошибка модерации');
    }
  };

  const groupedReports = reports.reduce((acc, report) => {
    const discussionId = report.reportable?.discussion?.id || 'unknown';
    const discussionTitle = report.reportable?.discussion?.title || 'Без заголовка';
    if (!acc[discussionId]) {
      acc[discussionId] = { title: discussionTitle, reports: [] };
    }
    acc[discussionId].reports.push(report);
    return acc;
  }, {});

  const discussionOptions = Object.entries(groupedReports).map(([id, { title }]) => ({
    id,
    title,
  }));

  const filteredReports =
    selectedDiscussionId === 'all'
      ? reports
      : groupedReports[selectedDiscussionId]?.reports || [];

  if (loading) {
    return (
      <SidebarLayout>
        <div className="mt-6 m-800 sm:mt-0 text-center">Загрузка...</div>
      </SidebarLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Жалобы на мои ответы | Форум путешествий по России</title>
        <meta name="description" content="Просмотр и модерация жалоб на ваши ответы в обсуждениях." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Жалобы на мои ответы | Форум путешествий по России" />
        <meta property="og:description" content="Просмотр и модерация жалоб на ваши ответы в обсуждениях." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content="/logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={pageUrl} />

        {/* Structured Data / Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Жалобы на мои ответы",
            "description": "Просмотр и модерация жалоб на ваши ответы в обсуждениях.",
            "url": pageUrl,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": pageUrl
            },
            "publisher": {
              "@type": "Organization",
              "name": "Форум путешествий по России",
              "logo": {
                "@type": "ImageObject",
                "url": "/logo.png"
              }
            }
          })
        }} />
      </Head>

      <SidebarLayout>
        <main className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Жалобы на ответы в моих обсуждениях</h2>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          <div className="mb-8">
            <label htmlFor="discussionFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Фильтр по обсуждению
            </label>
            <select
              id="discussionFilter"
              value={selectedDiscussionId}
              onChange={(e) => setSelectedDiscussionId(e.target.value)}
              className="block w-full sm:w-64 p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Все обсуждения</option>
              {discussionOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </select>
          </div>
          {filteredReports.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
              <p className="text-gray-500 text-lg">Нет жалоб на ответы в ваших обсуждениях</p>
            </div>
          ) : (
            <>
              {selectedDiscussionId === 'all' ? (
                Object.entries(groupedReports).map(([discussionId, { title, reports }]) => (
                  <div key={discussionId} className="mb-10">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">
                      <Link href={`/discussions/${discussionId}`} className="text-indigo-600 hover:text-indigo-800 transition-colors">
                        {title}
                      </Link>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {reports.map((report) => (
                        <div
                          key={report.id}
                          className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <div className="space-y-3">
                            <p className="flex items-center text-gray-700">
                              <span className="font-medium mr-2">Жалоба от:</span>
                              <span>{report.reporter?.name || 'Неизвестный'}</span>
                            </p>
                            <p className="flex items-center text-gray-700">
                              <span className="font-medium mr-2">Причина:</span>
                              <span>{report.reason}</span>
                            </p>
                            <p className="flex items-center text-gray-700">
                              <span className="font-medium mr-2">Статус:</span>
                              <span className={`px-2 py-1 rounded-full text-sm ${
                                report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  report.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'
                              }`}>
                                {report.status}
                              </span>
                            </p>
                            <div className="border-t border-gray-100 my-3"></div>
                            <p className="text-gray-600 italic">
                              {report.reportable?.content || 'Нет комментария'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(report.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="mt-4 flex gap-3">
                            <button
                              onClick={() => handleModerate(report.id, 'rejected')}
                              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                            >
                              Отклонить
                            </button>
                            <button
                              onClick={() => handleModerate(report.id, 'approved')}
                              className="flex-1 bg-white border border-red-600 text-red-600 px-4 py-2 rounded-md hover:bg-red-50 transition-colors duration-200"
                            >
                              Удалить ответ
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="space-y-3">
                        <p className="flex items-center text-gray-700">
                          <span className="font-medium mr-2">Жалоба от:</span>
                          <span>{report.reporter?.name || 'Неизвестный'}</span>
                        </p>
                        <p className="flex items-center text-gray-700">
                          <span className="font-medium mr-2">Причина:</span>
                          <span>{report.reason}</span>
                        </p>
                        <p className="flex items-center text-gray-700">
                          <span className="font-medium mr-2">Статус:</span>
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              report.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                          }`}>
                            {report.status}
                          </span>
                        </p>
                        <div className="border-t border-gray-100 my-3"></div>
                        <p className="text-gray-600 italic">
                          {report.reportable?.content || 'Нет комментария'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => handleModerate(report.id, 'rejected')}
                          className="flex-1 bg-white border border-red-600 text-red-600 px-4 py-2 rounded-md hover:bg-red-50 transition-colors duration-200"
                        >
                          Отклонить
                        </button>
                        <button
                          onClick={() => handleModerate(report.id, 'approved')}
                          className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                        >
                          Удалить ответ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </SidebarLayout>
    </>
  );
}