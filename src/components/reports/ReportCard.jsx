'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportCard({ report, onModerate, type }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const router = useRouter();

  const getReportableTitle = () => {
    switch (type) {
      case 'discussions':
        return report.reportable?.title || 'Обсуждение удалено';
      case 'users':
        return report.reportable?.username || 'Пользователь удалён';
      case 'replies':
        return report.reportable?.content?.substring(0, 100) || 'Ответ удалён';
      default:
        return 'Неизвестный объект';
    }
  };

  const getReportableLink = () => {
    switch (type) {
      case 'discussions':
        return report.reportable ? `/discussions/${report.reportable_id}` : '#';
      case 'users':
        return report.reportable ? `/users/${report.reportable_id}` : '#';
      case 'replies':
        return report.reportable
          ? `/discussions/${report.reportable?.discussion_id}#reply-${report.reportable_id}`
          : '#';
      default:
        return '#';
    }
  };

  return (
    <>
      <div
        className="mx-2 bg-white p-3 sm:p-6 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Жалоба на {type === 'discussions' ? 'обсуждение' : type === 'users' ? 'пользователя' : 'ответ'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              От: {report.reporter?.username || 'Неизвестный пользователь'}
            </p>
          </div>
          <span className="text-sm text-gray-500">
            {new Date(report.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 font-medium mb-2">Причина жалобы:</p>
          <p className="text-gray-700">{report.reason}</p>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 font-medium mb-2">Объект жалобы:</p>
          <p className="text-gray-700">{getReportableTitle()}</p>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Рассмотрение жалобы
            </h2>

            <div className="mb-6">
              <p className="text-gray-600 font-medium mb-2">Причина жалобы:</p>
              <p className="text-gray-700">{report.reason}</p>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 font-medium mb-2">Объект жалобы:</p>
              <p className="text-gray-700">{getReportableTitle()}</p>
              {getReportableLink() !== '#' && (
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    router.push(getReportableLink());
                  }}
                  className="text-indigo-600 hover:text-indigo-800 mt-2"
                >
                  Перейти к объекту жалобы
                </button>
              )}
            </div>

            <div className="mb-6">
              <p className="text-gray-600 font-medium mb-2">Комментарий модератора:</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Введите комментарий для автора жалобы..."
                rows="3"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  onModerate(report.id, 'approved', comment);
                  setIsModalOpen(false);
                }}
                className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-all"
              >
                Одобрить жалобу
              </button>
              <button
                onClick={() => {
                  onModerate(report.id, 'rejected', comment);
                  setIsModalOpen(false);
                }}
                className="flex-1 bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition-all"
              >
                Отклонить жалобу
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 bg-gray-200 text-gray-700 p-3 rounded-lg hover:bg-gray-300 transition-all"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}