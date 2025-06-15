// UserProfileActions.jsx
import React from 'react';
import ReportButton from './ReportButton';

export default function UserProfileActions({ userId, currentUserId, onReport }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="absolute right-6 top-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label="Действия"
      >
        ⋮
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
          <div className="py-1">
            <ReportButton
              userId={userId}
              currentUserId={currentUserId}
              onReport={onReport}
              isDropdownItem
            />
          </div>
        </div>
      )}
    </div>
  );
}