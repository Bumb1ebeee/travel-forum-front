'use client';

import { useState, useEffect, useRef } from 'react';

const OptionsMenu = ({ onReport, onUnsubscribe, onArchive, isJoined, isArchived }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const menuRef = useRef(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleReportClick = () => {
    setIsModalOpen(true);
    setIsOpen(false);
  };

  const handleArchiveClick = () => {
    if (onArchive) {
      onArchive();
    }
    setIsOpen(false);
  };

  const handleUnsubscribeClick = () => {
    onUnsubscribe();
    setIsOpen(false);
  };

  const handleSubmitReport = () => {
    if (reportReason.trim()) {
      onReport(reportReason);
      setIsModalOpen(false);
      setReportReason('');
    } else {
      alert('Пожалуйста, укажите причину жалобы.');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="text-gray-500 hover:text-gray-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zm0 5.25a.75.75 0 110-1.5.75.75 0 010 1.5zm0 5.25a.75.75 0 110-1.5.75.75 0 010 1.5z"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          {isJoined && !isArchived && (
            <button
              onClick={handleArchiveClick}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Архивировать
            </button>
          )}
          {isJoined && (
            <button
              onClick={handleUnsubscribeClick}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Отписаться
            </button>
          )}
          <button
            onClick={handleReportClick}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Пожаловаться
          </button>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Поясните причину жалобы</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
              rows="4"
              placeholder="Опишите причину жалобы..."
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
              >
                Отмена
              </button>
              <button
                onClick={handleSubmitReport}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
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