# AccountingScholarships Frontend

React/Vite frontend для работы со студентами-грантниками, предпросмотром сравнения SSO/EPVO и синхронизацией.

## Запуск

```powershell
npm install
npm run dev
```

По умолчанию frontend запускается на:

```text
http://localhost:5173
```

## API

Frontend сам строит адрес API по текущему хосту и порту backend `5150`.

Пример:

```text
http://100.76.159.73:5173 -> http://100.76.159.73:5150/api
```

Для ручного переопределения можно указать `VITE_API_URL`:

```powershell
$env:VITE_API_URL="http://localhost:5150/api"
npm run dev
```

## Сборка

```powershell
npm run build
```
