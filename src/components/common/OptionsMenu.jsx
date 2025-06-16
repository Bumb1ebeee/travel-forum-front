import React from 'react';

const OptionsMenu = ({ onReport, onUnsubscribe, onArchive, onUnarchive, isJoined, isArchived, isAuthor }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [reportReason, setReportReason] = React.useState('');

  const handleReportSubmit = () => {
    if (reportReason) {
      onReport(reportReason);
      setIsOpen(false);
      setReportReason('');
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
                  setReportReason(prompt('Введите причину жалобы:'));
                  if (reportReason) handleReportSubmit();
                }}
                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Пожаловаться
              </button>
            </li>
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
            {!isAuthor && isJoined && !isArchived && (
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
          </ul>
        </div>
      )}
    </div>
  );
};

export default OptionsMenu;