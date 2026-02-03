# Система управления стипендиями студентов

React приложение для управления студентами, обучающимися на гранте.

## 🚀 Функциональность

- ✅ Просмотр списка студентов на гранте
- ✅ Фильтрация по ФИО, ИИН, курсу, форме обучения, институту, кафедре и типу гранта
- ✅ Экспорт данных в различных форматах
- ✅ Импорт данных из Excel
- ✅ Адаптивный дизайн
- ✅ Современный пользовательский интерфейс

## 📦 Технологии

- **React 19** - библиотека для построения интерфейса
- **Vite** - сборщик и dev-сервер
- **Axios** - для работы с API
- **CSS** - стилизация компонентов

## 🛠 Установка и запуск

### Установка зависимостей

```bash
npm install
```

### Запуск dev-сервера

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

### Сборка для продакшена

```bash
npm run build
```

### Предпросмотр production сборки

```bash
npm run preview
```

## 📡 API

Приложение использует API от Mokky.dev:

**Endpoint**: `https://84ec8b151116fab6.mokky.dev/front`

### Структура данных студента

```json
{
  "id": 1,
  "first_name": "Иван",
  "last_name": "Иванов",
  "patronymic": "Иванович",
  "grant_type": "Полный",
  "has_scholarship": "Да",
  "institute": "Национальный университет информационных технологий",
  "study_form": "Очная",
  "scholarship_status": "Активна",
  "bank_account": "407028101234567890",
  "deprivation_reasons": "Нет",
  "status": "Учится",
  "category": "Студент",
  "academic_status": "Полный",
  "payment_form": "Грант",
  "course": 4,
  "curriculum_specialty": "6B06102 Computer Science 2022-23 Полная форма обучения"
}
```

## 📁 Структура проекта

```
scholarships_front/
├── public/              # Статические файлы
├── src/
│   ├── components/      # React компоненты
│   │   ├── Header.jsx
│   │   ├── SearchFilters.jsx
│   │   ├── ExportTools.jsx
│   │   └── StudentsTable.jsx
│   ├── App.jsx          # Главный компонент
│   ├── App.css          # Стили приложения
│   ├── index.css        # Глобальные стили
│   └── main.jsx         # Точка входа
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🎨 Компоненты

### Header
Навигационная панель с breadcrumbs, переключателем языка и профилем менеджера.

### SearchFilters
Панель фильтров для поиска студентов по различным критериям:
- ФИО студента
- ИИН студента
- Курс
- Форма обучения
- Институт
- Кафедра
- Тип гранта

### ExportTools
Панель инструментов для импорта и экспорта данных.

### StudentsTable
Таблица с данными студентов, включая:
- Номер по порядку
- ФИО
- ИИН
- Курс
- Форма обучения
- Институт
- Кафедра
- Тип гранта (с цветными бейджами)
- Статус стипендии
- Расчетный счёт
- Кнопка "Принять решение"

## 🔍 Использование фильтров

1. Заполните нужные поля фильтров
2. Нажмите кнопку "ОТОБРАЗИТЬ"
3. Результаты отобразятся в таблице ниже

Фильтры работают с логикой И (AND) - учитываются все заполненные поля.

## 👨‍💻 Разработка

Проект создан на основе Vite + React шаблона.

### Для работы с проектом:

1. Клонируйте репозиторий
2. Установите зависимости: `npm install`
3. Запустите dev-сервер: `npm run dev`
4. Откройте `http://localhost:5173` в браузере

## 📝 Лицензия

MIT

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
