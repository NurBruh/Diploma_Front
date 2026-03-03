import React, { useState } from 'react';
import { MdError } from 'react-icons/md';
import { API_BASE_URL } from '../services/api';
import './Auth.css';

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/Auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
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
        console.log('Logged in:', data);
        onLogin(data);
      }else {
        setError(data.message || 'Ошибка авторизации');
        console.error('Login error:', data.message);
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
      console.error('Network error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Вход в систему</h1>
          <p>Система управления стипендиями</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              <MdError size={20} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="auth-btn primary"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>

          {/* <div className="auth-divider">
            <span>или</span>
          </div> */}

          {/* <button
            type="button"
            className="auth-btn secondary"
            onClick={onSwitchToRegister}
            disabled={loading}
          >
            Зарегистрироваться
          </button> */}
        </form>
      </div>
    </div>
  );
};

export default Login;
