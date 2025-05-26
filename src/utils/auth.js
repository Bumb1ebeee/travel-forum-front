import axios from 'axios';
import config from "@/pages/api/config";

export const isAuthenticated = async () => {
  const token = localStorage.getItem('token');
  console.log('Token:', token); // Отладка
  if (!token) return { authenticated: false, user: null };

  try {
    const response = await axios.get(`${config.apiUrl}/check-token`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Check-token response:', response.data); // Отладка
    if (response.data.authenticated) {
      const userResponse = await axios.get(`${config.apiUrl}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return { authenticated: true, user: userResponse.data };
    }
    return { authenticated: false, user: null };
  } catch (err) {
    console.error('Check-token error:', err.response); // Отладка
    return { authenticated: false, user: null };
  }
};
