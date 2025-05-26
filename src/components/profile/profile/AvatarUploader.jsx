import React from 'react';

const AvatarUploader = ({ user, avatar, handleAvatarChange, handleAvatarUpload, submitting }) => (
  <div className="flex flex-col items-center">
    <img
      src={user?.avatar || '/default-avatar.png'}
      alt="Avatar"
      className="w-24 sm:w-32 h-24 sm:h-32 rounded-full mb-4 sm:mb-6 object-cover aspect-square shadow-lg"
    />
    <form onSubmit={handleAvatarUpload} className="flex flex-col items-center space-y-4">
      <label className="flex items-center justify-center w-36 sm:w-40 h-10 sm:h-12 bg-indigo-100 text-indigo-700 rounded-lg cursor-pointer hover:bg-indigo-200 transition-all shadow-md">
        <span className="mr-2 text-sm sm:text-base">Выбрать аватар</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
          disabled={submitting}
        />
      </label>
      <button
        type="submit"
        className="w-36 sm:w-40 h-10 sm:h-12 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:bg-indigo-400 shadow-md text-sm sm:text-base"
        disabled={submitting}
      >
        {submitting ? 'Загрузка...' : 'Обновить'}
      </button>
    </form>
  </div>
);

export default AvatarUploader;