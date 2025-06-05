import axios from 'axios';
import config from "@/pages/api/config";

// Замыкание для кэширования результата
let authCache = null;
let cachedToken = null;

export const isAuthenticated = async () => {
  const token = localStorage.getItem('token');
  console.log('Token:', token); // Отладка

  // Если токен отсутствует или отличается от кэшированного, сбрасываем кэш
  if (!token || token !== cachedToken) {
    authCache = null;
    cachedToken = token;
  }

  // Если кэш существует, возвращаем его
  if (authCache) {
    console.log('Returning cached auth:', authCache); // Отладка
    return authCache;
  }

  // Если токена нет, возвращаем неаутентифицированный результат
  if (!token) {
    authCache = { authenticated: false, user: null };
    return authCache;
  }

  try {
    // Проверка токена
    const response = await axios.get(`${config.apiUrl}/check-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Check-token response:', response.data); // Отладка

    if (response.data.authenticated) {
      // Получение данных пользователя
      const userResponse = await axios.get(`${config.apiUrl}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      authCache = { authenticated: true, user: userResponse.data };
      return authCache;
    }

    authCache = { authenticated: false, user: null };
    return authCache;
  } catch (err) {
    console.error('Check-token error:', err.response?.data || err.message); // Отладка
    authCache = { authenticated: false, user: null };
    return authCache;
  }
};

// Функция для сброса кэша
export const resetAuthCache = () => {
  authCache = null;
  cachedToken = null;
};