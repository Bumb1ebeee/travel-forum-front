import React, { useState } from 'react';

const OptionsMenu = ({ onReport, onUnsubscribe, onArchive, onUnarchive, isJoined, isArchived, isAuthor, isReply }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const handleReportSubmit = () => {
    if (reportReason.trim()) {
      onReport(reportReason.trim());
      setShowReportForm(false);
      setReportReason('');
      setIsOpen(false);
    } else {
      alert('Введите причину жалобы');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        ⋮
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10">
          <ul className="py-1">
            <li>
              <button
                onClick={() => {
                  setShowReportForm(true);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Пожаловаться
              </button>
            </li>
            {!isReply && (
              <>
                {!isAuthor && isJoined && !isArchived && (
                  <li>
                    <button
                      onClick={() => {
                        onUnsubscribe();
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Отписаться
                    </button>
                  </li>
                )}
                {!isAuthor && !isArchived && (
                  <li>
                    <button
                      onClick={() => {
                        onArchive();
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Добавить в Избранное
                    </button>
                  </li>
                )}
                {!isAuthor && isArchived && (
                  <li>
                    <button
                      onClick={() => {
                        onUnarchive();
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Удалить из Избранного
                    </button>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}
      {showReportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white p-4 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">Отправить жалобу</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Введите причину жалобы"
              className="w-full p-2 border rounded-lg mb-4"
              rows="4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowReportForm(false);
                  setReportReason('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={handleReportSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptionsMenu;