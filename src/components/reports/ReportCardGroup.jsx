'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportCardGroup({ group, onGroupModerate }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const router = useRouter();

  const getReportableTitle = () => {
    const type = group.reportable_type.split('\\').pop().toLowerCase();
    switch (type) {
      case 'discussion':
        return group.reportable?.title || 'Обсуждение удалено';
      case 'user':
        return group.reportable?.username || 'Пользователь удален';
      case 'reply':
        return group.reportable?.content?.substring(0, 100) || 'Ответ удален';
      default:
        return 'Неизвестный объект';
    }
  };

  const getReportableLink = () => {
    const type = group.reportable_type.split('\\').pop().toLowerCase();
    switch (type) {
      case 'discussion':
        return `/discussions/${group.reportable_id}`;
      case 'user':
        return `/users/${group.reportable_id}`;
      case 'reply':
        return `/discussions/${group.reportable?.discussion_id}#reply-${group.reportable_id}`;
      default:
        return '#';
    }
  };

  return (
    <>
      <div
        className="mx-2 bg-white p-6 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setIsModalOpen(true)}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Жалобы на {getReportableTitle()}
        </h3>
        <p className="text-sm text-gray-500">
          Количество жалоб: {group.total_reports}
        </p>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Группа жалоб на {getReportableTitle()}
            </h2>

            <div className="mb-6">
              <p className="text-gray-600 font-medium mb-2">Количество жалоб:</p>
              <p className="text-gray-700">{group.total_reports}</p>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 font-medium mb-2">Все причины:</p>
              <ul className="list-disc pl-5 space-y-1">
                {group.reasons.map((reason, i) => (
                  <li key={i} className="text-gray-700">{reason}</li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 font-medium mb-2">Авторы жалоб:</p>
              <ul className="list-disc pl-5 space-y-1">
                {group.reporters.map((reporter) => (
                  <li key={reporter.id} className="text-gray-700">
                    {reporter.username}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 font-medium mb-2">Ссылка на объект:</p>
              <button
                onClick={() => router.push(getReportableLink())}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Перейти к объекту
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-gray-600 font-medium mb-2">Комментарий модератора</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Введите комментарий для авторов жалоб..."
                rows="3"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  onGroupModerate(group.reportable_id, 'approved', comment);
                  setIsModalOpen(false);
                }}
                className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-all"
              >
                Одобрить
              </button>
              <button
                onClick={() => {
                  onGroupModerate(group.reportable_id, 'rejected', comment);
                  setIsModalOpen(false);
                }}
                className="flex-1 bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition-all"
              >
                Отклонить
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