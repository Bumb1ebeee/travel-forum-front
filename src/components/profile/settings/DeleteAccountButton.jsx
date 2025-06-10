import React from 'react';

const DeleteAccountButton = ({ handleDeleteAccount, submitting }) => (
  <div>
    <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4">Удалить аккаунт</h3>
    <p className="text-gray-600 mb-4">
      Удаление аккаунта приведет к полной очистке ваших данных. Это действие нельзя отменить.
    </p>
    <button
      onClick={handleDeleteAccount}
      className="w-full bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition-all disabled:bg-red-400 shadow-md"
      disabled={submitting}
    >
      {submitting ? 'Удаление...' : 'Удалить аккаунт'}
    </button>
  </div>
);

export default DeleteAccountButton;