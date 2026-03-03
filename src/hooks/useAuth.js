import { useState, useEffect } from 'react'
import AuthService from '../services/AuthService'

export const useAuth = ({ showNotification, onFetchData, onClearData }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [showRegister, setShowRegister] = useState(false)

  // Проверка авторизации при монтировании
  useEffect(() => {
    const authenticated = AuthService.isAuthenticated()
    setIsAuthenticated(authenticated)
    if (authenticated) {
      const user = AuthService.getCurrentUser()
      setCurrentUser(user)
      onFetchData?.()
    }
  }, [])

  const handleLogin = (userData) => {
    setIsAuthenticated(true)
    setCurrentUser({
      ...userData,
      scopeType: userData.scopeType || null,
      scopeId: userData.scopeId || null,
      scopeName: userData.scopeName || null
    })
    setShowRegister(false)
    showNotification(`Добро пожаловать, ${userData.username}!`, 'success')
    onFetchData?.()
  }

  const handleRegister = (userData) => {
    setIsAuthenticated(true)
    setCurrentUser({
      ...userData,
      scopeType: userData.scopeType || null,
      scopeId: userData.scopeId || null,
      scopeName: userData.scopeName || null
    })
    setShowRegister(false)
    showNotification(`Регистрация успешна! Добро пожаловать, ${userData.username}!`, 'success')
    onFetchData?.()
  }

  const handleLogout = () => {
    AuthService.logout()
    setIsAuthenticated(false)
    setCurrentUser(null)
    onClearData?.()
    showNotification('Вы вышли из системы', 'info')
  }

  // Вызывается из хуков при получении 401
  const handleUnauthorized = () => {
    AuthService.logout()
    setIsAuthenticated(false)
    setCurrentUser(null)
    showNotification('Сессия истекла, войдите заново', 'error')
  }

  return {
    isAuthenticated,
    currentUser,
    showRegister,
    setShowRegister,
    handleLogin,
    handleRegister,
    handleLogout,
    handleUnauthorized
  }
}
