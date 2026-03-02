import { API_BASE_URL } from './api';

// API endpoint авторизации
const AUTH_URL = `${API_BASE_URL}/Auth`;

const AuthService = {
  // Регистрация нового пользователя
  register: async (username, email, password) => {
    try {
      const response = await fetch(`${AUTH_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);
        if (data.scopeType) localStorage.setItem('scopeType', data.scopeType);
        if (data.scopeId) localStorage.setItem('scopeId', data.scopeId.toString());
        if (data.scopeName) localStorage.setItem('scopeName', data.scopeName);
        console.log('Registration successful:', data);
      }

      return { success: response.ok, data };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Ошибка подключения к серверу' };
    }
  },

  // Авторизация пользователя
  login: async (username, password) => {
    try {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('role', data.role);
        if (data.scopeType) localStorage.setItem('scopeType', data.scopeType);
        if (data.scopeId) localStorage.setItem('scopeId', data.scopeId.toString());
        if (data.scopeName) localStorage.setItem('scopeName', data.scopeName);
        console.log('Login successful:', data);
      }

      return { success: response.ok, data };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Ошибка подключения к серверу' };
    }
  },

  // Выход из системы
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('scopeType');
    localStorage.removeItem('scopeId');
    localStorage.removeItem('scopeName');
    console.log('Logout successful');
  },

  // Получение текущего пользователя
  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const scopeType = localStorage.getItem('scopeType');
    const scopeId = localStorage.getItem('scopeId');
    const scopeName = localStorage.getItem('scopeName');

    if (token && username) {
      return { token, username, role, scopeType, scopeId: scopeId ? parseInt(scopeId) : null, scopeName };
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
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Protected data fetch error:', error);
      throw error;
    }
  }
};

export default AuthService;
