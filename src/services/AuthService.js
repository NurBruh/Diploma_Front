// API endpoint - укажите ваш URL и порт backend
const API_URL = 'http://localhost:5170/api/Auth';

const AuthService = {
  // Регистрация нового пользователя
  register: async (username, email, password) => {
    try {
      const response = await fetch(`${API_URL}/register`, {
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
        localStorage.setItem('email', data.email);
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
      const response = await fetch(`${API_URL}/login`, {
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
        localStorage.setItem('email', data.email);
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
    localStorage.removeItem('email');
    console.log('Logout successful');
  },

  // Получение текущего пользователя
  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email');

    if (token && username) {
      return { token, username, email };
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
      const response = await fetch(`http://localhost:5170${endpoint}`, {
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
