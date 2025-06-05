// hooks/useSidebar.js
import { useState } from 'react';

export const useSidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Изменено на true

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return { isSidebarOpen, toggleSidebar };
};