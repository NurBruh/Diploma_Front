import axios from 'axios';
import { API_BASE_URL } from '../services';

// API endpoint авторизации
const AUTH_URL = `${API_BASE_URL}/Auth`;

const AuthService = {
  // Авторизация через SSO (userId = password для теста)
  login: async (userId, password) => {
    try {
      const response = await axios.post(`${AUTH_URL}/login`, {
        userId,
        password
      });

      const data = response.data;

      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId.toString());
      localStorage.setItem('fullName', data.fullName);
      localStorage.setItem('role', data.role);
      localStorage.setItem('roleDisplayName', data.roleDisplayName);
      if (data.scopeId) localStorage.setItem('scopeId', data.scopeId.toString());
      if (data.scopeName) localStorage.setItem('scopeName', data.scopeName);

      return { success: true, data };
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        return { success: false, error: error.response.data.message || 'Ошибка авторизации' };
      }
      return { success: false, error: 'Ошибка подключения к серверу' };
    }
  },

  // Выход из системы
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('fullName');
    localStorage.removeItem('role');
    localStorage.removeItem('roleDisplayName');
    localStorage.removeItem('scopeId');
    localStorage.removeItem('scopeName');
  },

  // Получение текущего пользователя
  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const fullName = localStorage.getItem('fullName');
    const role = localStorage.getItem('role');
    const roleDisplayName = localStorage.getItem('roleDisplayName');
    const scopeId = localStorage.getItem('scopeId');
    const scopeName = localStorage.getItem('scopeName');

    if (token && userId) {
      return { token, userId: parseInt(userId), fullName, role, roleDisplayName, scopeId: scopeId ? parseInt(scopeId) : null, scopeName };
    }

    return null;
  },

  // Проверка, авторизован ли пользователь
  isAuthenticated: () => {
    return localStorage.getItem('token') !== null;
  },

  // Получение токена
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Запрос к защищенному endpoint
  fetchProtectedData: async (endpoint) => {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Protected data fetch error:', error);
      throw error;
    }
  }
};

export default AuthService;
