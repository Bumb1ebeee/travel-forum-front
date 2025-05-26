import React from 'react';

const NotificationsForm = ({ notifications, handleNotificationChange, handleNotificationsSubmit, submitting, success }) => (
  <div>
    <h3 className="text-xl font-semibold text-gray-700 mb-4">Уведомления</h3>
    {success && <p className="text-green-500 mb-4">{success}</p>}
    <form onSubmit={handleNotificationsSubmit} className="space-y-6">
      <div className="flex items-center">
        <input
          type="checkbox"
          name="email_notifications"
          checked={notifications.email_notifications}
          onChange={handleNotificationChange}
          className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label className="ml-3 text-gray-700 font-medium">
          Получать уведомления на email
        </label>
      </div>
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-all disabled:bg-indigo-400 shadow-md"
        disabled={submitting}
      >
        {submitting ? 'Сохранение...' : 'Сохранить настройки'}
      </button>
    </form>
  </div>
);

export default NotificationsForm;