// components/Sidebar.js
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/pages/api/config';

export default function Sidebar({ onCategorySelect, selectedCategory }) {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/categories`);
        setCategories(response.data.categories);
      } catch (err) {
        setError(err.response?.data?.message || 'Ошибка загрузки категорий');
      }
    };
    fetchCategories();
  }, []);

  console.log('Selected Category:', selectedCategory, typeof selectedCategory);
  console.log('Categories:', categories);

  return (
    <div className="w-64 bg-form-bg p-4 rounded-2xl h-fit">
      <h2 className="text-xl font-bold text-text-primary mb-4">Категории</h2>
      {error && <p className="text-error-text mb-4">{error}</p>}
      <ul className="space-y-2">
        <li
          className={`p-2 rounded cursor-pointer text-text-primary hover:bg-gray-200 ${
            selectedCategory === null ? 'bg-indigo-600 text-white hover:bg-indigo-600' : ''
          }`}
          onClick={() => onCategorySelect(null)}
        >
          Все категории
        </li>
        {categories.map((category) => (
          <li
            key={category.id}
            className={`p-2 rounded cursor-pointer text-text-primary hover:bg-gray-200 ${
              String(selectedCategory) === String(category.id)
                ? 'bg-indigo-600 text-white hover:bg-indigo-600'
                : ''
            }`}
            onClick={() => onCategorySelect(category.id)}
          >
            {category.name}
          </li>
        ))}
      </ul>
    </div>
  );
}