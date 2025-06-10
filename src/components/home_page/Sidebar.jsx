// components/Sidebar.js
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import config from '@/pages/api/config';

export default function Sidebar({ onCategorySelect, selectedCategory }) {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="w-64 bg-form-bg p-4 rounded-2xl h-fit sticky top-4 hidden md:block">
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

      {/* Mobile Menu */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full bg-indigo-600 text-white p-3 rounded-lg flex justify-between items-center"
        >
          <span>Категории</span>
          <svg
            className={`w-6 h-6 transform ${isMobileMenuOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isMobileMenuOpen && (
          <div className="bg-form-bg p-4 rounded-b-2xl mt-1">
            {error && <p className="text-error-text mb-4">{error}</p>}
            <ul className="space-y-2">
              <li
                className={`p-2 rounded cursor-pointer text-text-primary hover:bg-gray-200 ${
                  selectedCategory === null ? 'bg-indigo-600 text-white hover:bg-indigo-600' : ''
                }`}
                onClick={() => {
                  onCategorySelect(null);
                  setIsMobileMenuOpen(false);
                }}
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
                  onClick={() => {
                    onCategorySelect(category.id);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {category.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}