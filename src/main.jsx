import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Accessibility } from 'accessibility'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Инициализация виджета доступности (скрываем стандартную иконку — управляем через Header)
window.addEventListener('load', () => {
  new Accessibility({
    icon: {
      position: {
        bottom: { size: 20, units: 'px' },
        left: { size: 20, units: 'px' },
      },
      circular: true,
      img: 'accessible',
      useEmojis: false,
    },
    labels: {
      menuTitle: 'Доступность',
      increaseText: 'Увеличить текст',
      decreaseText: 'Уменьшить текст',
      increaseTextSpacing: 'Увеличить интервал',
      decreaseTextSpacing: 'Уменьшить интервал',
      increaseLineHeight: 'Увеличить высоту строки',
      decreaseLineHeight: 'Уменьшить высоту строки',
      invertColors: 'Инвертировать цвета',
      grayHues: 'Оттенки серого',
      underlineLinks: 'Подчеркнуть ссылки',
      bigCursor: 'Большой курсор',
      readingGuide: 'Линейка чтения',
      textToSpeech: 'Озвучивание текста',
      speechToText: 'Голосовой ввод',
      disableAnimations: 'Отключить анимации',
      screenReader: 'Экранная читалка',
      resetTitle: 'Сбросить настройки',
    },
    textToSpeechLang: 'ru-RU',
    speechToTextLang: 'ru-RU',
    modules: {
      increaseText: true,
      decreaseText: true,
      increaseTextSpacing: true,
      decreaseTextSpacing: true,
      increaseLineHeight: true,
      decreaseLineHeight: true,
      invertColors: true,
      grayHues: true,
      underlineLinks: true,
      bigCursor: true,
      readingGuide: true,
      textToSpeech: true,
      speechToText: true,
      disableAnimations: true,
    },
  })

  // Скрываем стандартную иконку виджета — управление через кнопку в Header
  const style = document.createElement('style')
  style.textContent = `
    ._access-icon { display: none !important; }
  `
  document.head.appendChild(style)
})
