import React from 'react';

const PasswordChangeForm = ({ passwordData, handlePasswordChange, handlePasswordSubmit, submitting, error, success }) => (
  <div>
    <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4">Изменить пароль</h3>
    {error && <p className="text-red-500 mb-4">{error}</p>}
    {success && <p className="text-green-500 mb-4">{success}</p>}
    <form onSubmit={handlePasswordSubmit} className="space-y-6">
      <div>
        <label className="block text-gray-700 font-medium mb-2">Текущий пароль</label>
        <input
          type="password"
          name="current_password"
          value={passwordData.current_password}
          onChange={handlePasswordChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          placeholder="Введите текущий пароль"
          required
        />
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-2">Новый пароль</label>
        <input
          type="password"
          name="new_password"
          value={passwordData.new_password}
          onChange={handlePasswordChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          placeholder="Введите новый пароль"
          required
        />
      </div>
      <div>
        <label className="block text-gray-700 font-medium mb-2">Подтверждение пароля</label>
        <input
          type="password"
          name="new_password_confirmation"
          value={passwordData.new_password_confirmation}
          onChange={handlePasswordChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          placeholder="Подтвердите новый пароль"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-all disabled:bg-indigo-400 shadow-md"
        disabled={submitting}
      >
        {submitting ? 'Сохранение...' : 'Изменить пароль'}
      </button>
    </form>
  </div>
);

export default PasswordChangeForm;