const API_BASE_URL = 'http://localhost:5150/api';

// API endpoint авторизации
const AUTH_URL = `${API_BASE_URL}/Auth`;

const AuthService = {
  // Авторизация через SSO (userId = password для теста)
  login: async (userId, password) => {
    try {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId.toString());
        localStorage.setItem('fullName', data.fullName);
        localStorage.setItem('role', data.role);
        localStorage.setItem('roleDisplayName', data.roleDisplayName);
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
    localStorage.removeItem('userId');
    localStorage.removeItem('fullName');
    localStorage.removeItem('role');
    localStorage.removeItem('roleDisplayName');
    localStorage.removeItem('scopeId');
    localStorage.removeItem('scopeName');
    console.log('Logout successful');
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
