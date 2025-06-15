import React, { useState } from 'react';
import { PhotoIcon, XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const AvatarUploader = ({ user, avatar, handleAvatarChange, handleAvatarUpload, submitting }) => {
  const [preview, setPreview] = useState(null);

  const onAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      handleAvatarChange(e);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    // Reset the input to allow re-selecting the same file
    const input = document.querySelector('input[type="file"]');
    if (input) input.value = '';
    // Call handleAvatarChange with an empty event to clear the parent state
    handleAvatarChange({ target: { files: [] } });
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Display */}
      <div className="relative">
        <img
          src={preview || user?.avatar || '/default-image.png'}
          alt="Avatar"
          className="w-24 sm:w-32 h-24 sm:h-32 rounded-full object-cover aspect-square shadow-lg ring-2 ring-indigo-200"
        />
        {preview && (
          <button
            type="button"
            onClick={clearPreview}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-all"
            title="Удалить превью"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Form for File Selection and Upload */}
      <form onSubmit={(e) => { e.preventDefault(); handleAvatarUpload(e).then(clearPreview); }} className="flex flex-col items-center space-y-4">
        <label className="flex items-center justify-center w-36 sm:w-40 h-10 sm:h-12 bg-indigo-100 text-indigo-700 rounded-lg cursor-pointer hover:bg-indigo-200 transition-all shadow-md disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed">
          <PhotoIcon className="w-5 h-5 mr-2" />
          <span className="text-sm sm:text-base">Выбрать файл</span>
          <input
            type="file"
            accept="image/*"
            onChange={onAvatarChange}
            className="hidden"
            disabled={submitting}
          />
        </label>

        <button
          type="submit"
          className="w-36 sm:w-40 h-10 sm:h-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-all disabled:bg-indigo-400 disabled:cursor-not-allowed shadow-md text-sm sm:text-base"
          disabled={submitting || !avatar}
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
              </svg>
              Загрузка...
            </>
          ) : (
            <>
              <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
              Загрузить аватар
            </>
          )}
        </button>
      </form>

      {/* Optional File Name Display */}
      {preview && avatar && (
        <p className="text-xs text-gray-500 truncate w-36 sm:w-40 text-center" title={avatar.name}>
          Выбран: {avatar.name}
        </p>
      )}
    </div>
  );
};

export default AvatarUploader;