# Инструкция по добавлению авторизации

## Что было добавлено

### 1. Компоненты авторизации
- **Login.jsx** - форма авторизации
- **Register.jsx** - форма регистрации
- **Auth.css** - стили для форм (в стиле основного приложения)

### 2. AuthService
- **AuthService.js** - сервис для работы с API авторизации
  - `register()` - регистрация пользователя
  - `login()` - авторизация
  - `logout()` - выход из системы
  - `getCurrentUser()` - получение текущего пользователя
  - `isAuthenticated()` - проверка авторизации
  - `getToken()` - получение токена
  - `fetchProtectedData()` - запрос к защищенным endpoint

### 3. Интеграция в App.jsx
- Проверка авторизации при загрузке
- Условный рендеринг (авторизация или основное приложение)
- Обработчики login, register, logout

### 4. Обновление Header
- Отображение имени пользователя
- Dropdown меню с информацией о пользователе
- Кнопка выхода

### 5. Конфигурация CORS
- Добавлен прокси в `vite.config.js` для работы с API без CORS проблем

## API Endpoints

Приложение работает с API:
- `POST /api/Auth/register` - регистрация
- `POST /api/Auth/login` - авторизация

**Формат ответа:**
```json
{
  "token": "string",
  "username": "string",
  "email": "string"
}
```

## Конфигурация Vite

В `vite.config.js` настроен прокси для API:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5170',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

Это перенаправляет все запросы к `/api/*` на `http://localhost:5170/api/*`, решая проблемы с CORS.

## Использование

### 1. Запуск приложения

```bash
npm run dev
```

Приложение запустится на `http://localhost:5173` (или другом порту)

### 2. Первый запуск

При первом запуске пользователь увидит форму авторизации. Нужно:
1. Нажать "Зарегистрироваться"
2. Заполнить форму регистрации (username, email, password)
3. После успешной регистрации происходит автоматический вход

### 3. Повторный вход

При повторном посещении:
1. Если токен сохранен - автоматический вход
2. Если нет - форма авторизации

### 4. Выход

Для выхода:
1. Навести курсор на иконку профиля в шапке
2. В выпадающем меню нажать "Выйти"

## Хранение данных

Приложение сохраняет в localStorage:
- `token` - JWT токен
- `username` - имя пользователя
- `email` - email пользователя

## Защита маршрутов

Основное приложение (список студентов) отображается только для авторизованных пользователей.

## Стилизация

Все компоненты выполнены в едином стиле с основным приложением:
- Цветовая схема
- Типография
- Кнопки и формы
- Анимации и переходы

## Требования к Backend

Backend должен поддерживать:

1. **CORS** для домена фронтенда
2. **Endpoints:**
   - POST `/api/Auth/register`
   - POST `/api/Auth/login`
3. **JWT токены** для аутентификации
4. **Формат ответа** с полями: `token`, `username`, `email`

## Пример использования AuthService

```javascript
import AuthService from './services/AuthService';

// Регистрация
const result = await AuthService.register('username', 'email@example.com', 'password');

// Авторизация
const result = await AuthService.login('username', 'password');

// Проверка авторизации
const isAuth = AuthService.isAuthenticated();

// Получение текущего пользователя
const user = AuthService.getCurrentUser();

// Выход
AuthService.logout();

// Запрос к защищенному API
const data = await AuthService.fetchProtectedData('/api/students');
```

## Настройка API URL

Если API находится на другом порту или домене, измените конфигурацию в `vite.config.js`:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://your-api-url:port',
      changeOrigin: true,
      secure: false,
    }
  }
}
```
