// pages/popular.js
'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import PopularContent from './PopularContent';

export default function PopularPage({ user }) {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategorySelect = (categoryId) => {
    console.log('Category selected:', categoryId); // Отладка
    setSelectedCategory(categoryId);
  };

  return (
    <div className="flex p-8 gap-6 mx-auto">
      <Sidebar
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
      />
      <PopularContent
        user={user}
        selectedCategory={selectedCategory}
      />
    </div>
  );
}