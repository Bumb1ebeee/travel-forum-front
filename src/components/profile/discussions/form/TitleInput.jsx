import React from 'react';

const TitleInput = ({ value, onChange, error, submitting }) => {
  return (
    <div>
      <label className="block text-gray-700 font-semibold mb-2">Название</label>
      <input
        type="text"
        name="title"
        value={value || ''}
        onChange={onChange}
        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed ${
          error && !value ? 'border-red-500' : 'border-gray-300'
        }`}
        placeholder="Введите название обсуждения"
        required
        disabled={submitting}
      />
    </div>
  );
};

export default TitleInput; 