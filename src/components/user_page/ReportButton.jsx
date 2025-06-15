// ReportButton.jsx
import React from 'react';
import axios from 'axios';
import config from '@/pages/api/config';

export default function ReportButton({ userId, currentUserId, onReport, isDropdownItem = false }) {
  const [loading, setLoading] = React.useState(false);
  const [reported, setReported] = React.useState(false);

  const handleReport = async () => {
    if (!userId || !currentUserId || userId === currentUserId) return;

    const reason = prompt('Введите причину жалобы:');
    if (!reason || reason.trim().length < 10) {
      alert('Причина должна быть не менее 10 символов');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${config.apiUrl}/reports`,
        {
          reason,
          reportable_id: userId,
          reportable_type: 'App\\Models\\User',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReported(true);
      if (onReport) onReport();
      alert('Жалоба успешно отправлена');
    } catch (error) {
      console.error('Ошибка отправки жалобы:', error);
      alert('Не удалось отправить жалобу. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  if (userId === currentUserId) return null;

  const buttonStyle = isDropdownItem
    ? "block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
    : "mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition";

  if (reported) {
    return (
      <span className="block px-4 py-2 text-sm text-yellow-600 cursor-not-allowed">
        Жалоба отправлена
      </span>
    );
  }

  return (
    <button
      onClick={handleReport}
      disabled={loading}
      className={buttonStyle}
    >
      {loading ? 'Отправка...' : 'Пожаловаться'}
    </button>
  );
}