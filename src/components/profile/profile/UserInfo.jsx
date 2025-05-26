import React from 'react';

const UserInfo = ({ user, editMode, formData, handleChange, setEditMode, handleSubmit, submitting }) => (
  <div className="space-y-6">
    {editMode ? (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Имя</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            placeholder="Введите имя"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Имя пользователя</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            placeholder="Введите имя пользователя"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            placeholder="Введите email"
            required
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 min-w-[100px] bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-all disabled:bg-indigo-400 shadow-md"
            disabled={submitting}
          >
            {submitting ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button
            type="button"
            onClick={() => setEditMode(false)}
            className="flex-1 min-w-[100px] bg-gray-200 text-gray-700 p-3 rounded-lg hover:bg-gray-300 transition-all shadow-md"
            disabled={submitting}
          >
            Отмена
          </button>
        </div>
      </form>
    ) : (
      <div className="space-y-6">
        <div>
          <p className="text-gray-700 text-base sm:text-lg">
            <strong className="font-medium">Имя:</strong> {user.name}
          </p>
        </div>
        <div>
          <p className="text-gray-700 text-base sm:text-lg">
            <strong className="font-medium">Имя пользователя:</strong> {user.username}
          </p>
        </div>
        <div>
          <p className="text-gray-700 text-base sm:text-lg">
            <strong className="font-medium">Email:</strong> {user.email}
          </p>
        </div>
        <button
          onClick={() => setEditMode(true)}
          className="w-full min-w-[120px] bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-all shadow-md"
        >
          Редактировать
        </button>
      </div>
    )}
  </div>
);

export default UserInfo;