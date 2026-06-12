import React, { useState } from 'react';
import { MdError } from 'react-icons/md';
import AuthService from '../services/AuthService';
import '../css/Auth.css';

const Login = ({ onLogin }) => {
  const manualLoginEnabled = import.meta.env.VITE_MANUAL_LOGIN_ENABLED === 'true';
  const [formData, setFormData] = useState({
    userId: '',
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

    const result = await AuthService.login(formData.userId, formData.password);

    if (result.success) {
      onLogin(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Вход в систему</h1>
          <p>Система управления стипендиями</p>
        </div>

        {!manualLoginEnabled && (
          <div className="auth-form">
            <div className="auth-error">
              <MdError size={20} />
              Вход выполняется через портал Satbayev. Откройте модуль из портала или обновите страницу после входа в портал.
            </div>
          </div>
        )}

        {manualLoginEnabled && (
        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              <MdError size={20} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="userId">ID пользователя</label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              placeholder="Введите ваш ID"
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
              placeholder="Введите пароль"
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
        </form>
        )}
      </div>
    </div>
  );
};

export default Login;
