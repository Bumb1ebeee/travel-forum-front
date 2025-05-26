import React from 'react';

const CategorySelect = ({ categories, value, onChange, error, submitting }) => {
  return (
    <div>
      <label className="block text-gray-700 font-semibold mb-2">Категория</label>
      <select
        name="category_id"
        value={value || ''}
        onChange={onChange}
        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed ${
          error && !value ? 'border-red-500' : 'border-gray-300'
        }`}
        required
        disabled={submitting}
      >
        <option value="">Выберите категорию</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CategorySelect; 