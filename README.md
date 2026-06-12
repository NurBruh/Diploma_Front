# AccountingScholarships Frontend

![React](https://img.shields.io/badge/React-19-61DAFB)
![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF)
![Axios](https://img.shields.io/badge/API-Axios-5A29E4)
![Roles](https://img.shields.io/badge/Roles-Registrar%20%7C%20Advisor%20%7C%20Director-2E7D32)

Frontend-интерфейс для системы просмотра, сравнения и синхронизации стипендиальных данных студентов между SSO/KAZNITU_export и EPVO.

Приложение используется офисом регистратора, эдвайзерами, директорами институтов и заведующими кафедрами. Интерфейс построен на React + Vite и работает с backend API `AccountingScholarships`.

## Содержание

- [Что есть в интерфейсе](#что-есть-в-интерфейсе)
- [Технологии](#технологии)
- [Структура](#структура)
- [Роли в интерфейсе](#роли-в-интерфейсе)
- [Запуск](#запуск)
- [Настройка адреса backend](#настройка-адреса-backend)
- [Основные страницы](#основные-страницы)
- [Авторизация](#авторизация)
- [Скрипты](#скрипты)
- [Проверка перед показом](#проверка-перед-показом)
- [Частые проблемы](#частые-проблемы)

## Что есть в интерфейсе

- Авторизация через backend JWT.
- Автоматическая попытка входа через portal-cookie Satbayev.
- Главная таблица студентов для офиса регистратора.
- Серверная пагинация и фильтры.
- Сравнение данных SSO и EPVO/DUMP.
- Предпросмотр синхронизации.
- Сохранение выбранных студентов в `STUDENT_TEMP`.
- Финальная синхронизация через backend.
- История синхронизации.
- История изменений полей.
- Ролевые страницы эдвайзера, директора института и заведующего кафедрой.
- Dashboard с процентами грантников/платников и раскрытием студентов внутри специальностей.
- Версия для слабовидящих.

## Технологии

- React 19
- Vite
- React Router
- Axios
- React Icons
- ESLint

## Структура

```text
Diploma_Front/
├── public/
├── src/
│   ├── components/          # таблицы, фильтры, предпросмотр, история
│   ├── css/                 # стили страниц и компонентов
│   ├── hooks/               # useAuth, useStudents, useNotification
│   ├── pages/roles/         # страницы ролей
│   ├── services/            # AuthService
│   ├── utils/               # authFetch и API helpers
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js
```

## Роли в интерфейсе

| Роль | Интерфейс |
| --- | --- |
| Офис регистратора | Главная таблица грантников, сравнение, предпросмотр, история sync |
| Эдвайзер | Список своих обучающихся студентов |
| Директор института | Студенты института и dashboard по кафедрам/специальностям |
| Заведующий кафедрой | Студенты кафедры и dashboard по специальностям |

Для офиса регистратора показываются только обучающиеся грантники с валидным ИИН. Для остальных ролей показываются обучающиеся студенты в пределах их области доступа, независимо от грант/платное.

## Запуск

```powershell
cd C:\Users\NurBruh\Diploma\Diploma_Front
npm install
npm run dev
```

По умолчанию Vite запускается на:

```text
http://localhost:5173
```

## Настройка адреса backend

Frontend использует `VITE_API_URL`, если он задан. Если переменная не задана,
используется API на том же домене:

```text
https://project.satbayev.university -> https://project.satbayev.university/api
```

Для production это основной вариант: frontend публикуется на домене
`*.satbayev.university`, а backend прокидывается через reverse proxy на `/api`.

Для локальной разработки адрес backend задается в `.env.development`:

```text
VITE_API_URL=http://localhost:5150/api
VITE_MANUAL_LOGIN_ENABLED=true
```

Если backend опубликован на отдельном публичном домене, можно задать
`VITE_API_URL` перед сборкой.

Пример для PowerShell:

```powershell
$env:VITE_API_URL="http://localhost:5150/api"
npm run dev
```

Пример `.env`:

```text
# production default uses same-origin /api
```

## Ручной вход

На production ручной вход по ID/паролю скрыт. Пользователь должен входить через портал
Satbayev: frontend автоматически вызывает `/api/Auth/portal-login`, если JWT еще нет.

Форма ID/пароль показывается только если включена переменная:

```text
VITE_MANUAL_LOGIN_ENABLED=true
```

Для production оставлять:

```text
VITE_MANUAL_LOGIN_ENABLED=false
```

Чтобы временно вернуть форму на стенде, включить `VITE_MANUAL_LOGIN_ENABLED=true` и
пересобрать frontend. Backend при этом тоже должен разрешать ручной вход через
`Auth:ManualLoginEnabled=true`, иначе `/api/Auth/login` вернет `403 Forbidden`.

## Основные страницы

### Главная страница офиса регистратора

Показывает студентов, которые:

- сейчас учатся;
- находятся на гранте;
- имеют корректный ИИН из 12 цифр.

Данные приходят из:

```http
GET /api/Epvo/students
GET /api/Epvo/students/filters
```

### Сравнение данных

Показывает расхождения между SSO и EPVO/DUMP.

```http
GET /api/comparison/students
```

Фильтры сравнения:

- все;
- только различия;
- только в SSO;
- только в EPVO;
- совпадающие.

### Предпросмотр синхронизации

Показывает, какие данные будут сохранены в `STUDENT_TEMP` перед финальной отправкой.

```http
GET  /api/epvo-sso/sync-preview-comparison
POST /api/epvo-sso/sync-preview-comparison/save-temp
POST /api/epvo-sso/sync-preview-comparison/save-temp-batch
POST /api/epvo-sso/sync-temp-to-epvo
```

### Dashboard директора института

Показывает:

- всего студентов;
- грантников;
- платников;
- кафедры;
- специальности внутри кафедр;
- студентов внутри каждой специальности.

```http
GET /api/Auth/director/{userId}/dashboard
```

### Dashboard заведующего кафедрой

Показывает:

- всего студентов кафедры;
- грантников;
- платников;
- специальности;
- студентов внутри каждой специальности.

```http
GET /api/Auth/department-head/{userId}/dashboard
```

## Авторизация

При открытии приложения frontend проверяет:

1. Есть ли сохраненный JWT в `localStorage`.
2. Если JWT нет, пробует выполнить portal-login:

```http
GET /api/Auth/portal-login
```

Если пользователь пришел из портала Satbayev на домене `*.satbayev.university`, backend увидит portal-cookie и вернет JWT приложения. Через `localhost`, IP или Tailscale cookie портала обычно не передается.

Для автоматического входа frontend должен открываться через домен из зоны
`*.satbayev.university`. Backend `/api/Auth/portal-login` также должен быть доступен
через этот домен или через reverse proxy под ним, потому что portal-cookie имеет
домен `.satbayev.university` и не отправляется на `localhost`, IP или другой домен.

Ручной вход для локальной разработки использует:

```http
POST /api/Auth/login
```

В production форма скрыта через `VITE_MANUAL_LOGIN_ENABLED=false`, а backend должен
держать `Auth:ManualLoginEnabled=false`.

Все рабочие запросы после входа отправляются через `authFetch`, который добавляет:

```http
Authorization: Bearer <token>
```

Если токена нет, backend вернет `401 Unauthorized`. Если роль пользователя не подходит
для endpoint, backend вернет `403 Forbidden`.

## Скрипты

```powershell
npm run dev
```

Запуск dev-сервера.

```powershell
npm run build
```

Production-сборка в папку `dist`.

```powershell
npm run preview
```

Локальный preview production-сборки.

```powershell
npm run lint
```

Проверка ESLint.

## Проверка перед показом

1. Backend запущен.
2. Frontend видит backend API.
3. Login проходит.
4. Главная таблица открывается.
5. Фильтры загружаются из backend.
6. Сравнение данных открывается.
7. Предпросмотр синхронизации открывается.
8. Dashboard директора/зав кафедры раскрывает специальности и студентов.
9. История синхронизации открывается.
10. В консоли браузера нет CORS/Network Error.

## Частые проблемы

### Network Error или CORS

Проверить:

- backend запущен;
- frontend указывает на правильный backend: локально через `VITE_API_URL`, на сервере через `/api` reverse proxy;
- backend CORS разрешает текущий origin;
- в production запрос идет на `https://project.satbayev.university/api`, а не на `localhost` или IP.

### Portal-login не сработал

Проверить:

- проект открыт на домене `*.satbayev.university`;
- backend `/api/Auth/portal-login` доступен через домен `*.satbayev.university` или proxy под этим доменом;
- пользователь до этого вошел в портал;
- backend endpoint `/api/Auth/debug-portal-auth` показывает `hasPortalCookie: true`;
- portal roles сопоставлены в backend `PortalRoleMapping`;
- в SSO подтверждается связка role + должность + подразделение пользователя.

### Dashboard пустой

Проверить:

- у пользователя есть корректная роль;
- в SSO есть активная должность и область доступа;
- студенты имеют `StatusID = 1`;
- backend endpoint dashboard возвращает данные.

## Production build

```powershell
npm run build
```

Готовые файлы появляются в:

```text
dist/
```

Эту папку можно публиковать на web-сервере. Для portal-cookie сценария домен должен быть из зоны `*.satbayev.university`.

## Безопасность

Не добавлять в frontend README, issue и скриншоты:

- JWT;
- portal-cookie;
- персональные данные студентов;
- реальные production URL с секретными query-параметрами.
