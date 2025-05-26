import React from 'react';

const SidebarButton = ({ isActive, onClick, icon: Icon, children, badge, ariaLabel }) => (
  <button
    className={`p-2 w-full text-left rounded-lg mb-2 transition-colors flex items-center relative ${
      isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 bg-white hover:bg-indigo-50'
    }`}
    onClick={onClick}
    aria-label={ariaLabel}
  >
    <Icon className="mr-2 h-5 w-5" />
    <span>{children}</span>
    {badge && (
      <span className="absolute right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
);

export default SidebarButton;