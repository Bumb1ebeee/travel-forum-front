'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/pages/api/config';
import ReportCardGroup from './ReportCardGroup';


export default function ReportsContent({ type, user }) {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${config.apiUrl}/reports?type=${type}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReports(response.data.groups || []);      } catch (err) {
        setError(err.response?.data?.message || 'Ошибка загрузки жалоб');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [type]);

  const handleModerate = async (reportId, status, comment) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${config.apiUrl}/reports/${reportId}/moderate`,
        { status, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Обновляем список жалоб после модерации
      setReports(reports.filter(report => report.id !== reportId));
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при модерации жалобы');
    }
  };

  const handleGroupModerate = async (reportableId, status, comment) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${config.apiUrl}/reports/group`,
        {
          reportable_id: reportableId,
          status,
          comment
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setReports(reports.filter(g => g.reportable_id !== reportableId));
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при групповой модерации');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center text-gray-600 p-4">
        <p>Жалоб не найдено</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-6">
      {reports.map((group) => (
        <ReportCardGroup
          key={`${group.reportable_type}-${group.reportable_id}`}
          group={group}
          onGroupModerate={handleGroupModerate}
        />
      ))}
    </div>
  );
}
