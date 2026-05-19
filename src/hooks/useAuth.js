import { useState, useEffect } from 'react';
import AuthService from '../services/AuthService';

export const useAuth = (showNotification, onLoginSuccess) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const saved = AuthService.getCurrentUser();
    if (saved) {
      setIsAuthenticated(true);
      setCurrentUser(saved);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }
  }, []);

  const handleLogin = (userData) => {
    const user = {
      userId: userData.userId,
      fullName: userData.fullName,
      role: userData.role,
      roleDisplayName: userData.roleDisplayName,
      scopeId: userData.scopeId || null,
      scopeName: userData.scopeName || null,
      token: userData.token,
    };
    setIsAuthenticated(true);
    setCurrentUser(user);
    if (showNotification) {
      showNotification(`Добро пожаловать, ${userData.fullName}!`, 'success');
    }
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    if (showNotification) {
      showNotification('Вы вышли из системы', 'info');
    }
  };

  return {
    isAuthenticated,
    currentUser,
    handleLogin,
    handleLogout
  };
};
