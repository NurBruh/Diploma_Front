import AuthService from '../services/AuthService';

/**
 * Обёртка над fetch, которая автоматически добавляет:
 * - Content-Type: application/json
 * - Authorization: Bearer <token> (если токен есть в localStorage)
 *
 * Использование:
 *   const data = await authFetch('/Epvo/students');
 *   const data = await authFetch('/Epvo/sync-batch', { method: 'POST', body: JSON.stringify({...}) });
 *
 * @param {string} path — путь после API_BASE_URL, например '/Epvo/students'
 * @param {RequestInit} options — стандартные fetch-опции (method, body, etc.)
 * @returns {Promise<Response>}
 */
import { API_BASE_URL } from '../services';

export const authFetch = (path, options = {}) => {
  const token = AuthService.getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
};
