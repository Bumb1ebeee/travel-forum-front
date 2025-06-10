// pages/popular.js
'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import PopularContent from './PopularContent';

export default function PopularPage({ user }) {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategorySelect = (categoryId) => {
    console.log('Category selected:', categoryId);
    setSelectedCategory(categoryId);
  };

  return (
    <div className="flex flex-col md:flex-row p-1 gap-2 mx-auto max-w-7xl">
      <div className="md:w-64">
        <Sidebar
          onCategorySelect={handleCategorySelect}
          selectedCategory={selectedCategory}
        />
      </div>
      <PopularContent user={user} selectedCategory={selectedCategory} />
    </div>
  );
}