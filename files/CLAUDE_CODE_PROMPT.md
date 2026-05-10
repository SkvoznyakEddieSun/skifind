# Промт для Claude Code

Скопируй это в Claude Code как первое сообщение, прикрепив ВСЕ файлы из папки `skifind-react-starter/` и файл `index.html` (прототип).

---

## ВАЖНО — прочти полностью перед началом работы

У меня есть **готовый PWA-прототип** SkiFind в файле `index.html` (5896 строк, 16 экранов, дизайн-система с тёмной/светлой темой). Это **точное ТЗ дизайна**, не вдохновение. Каждая деталь продумана и протестирована на реальных iOS-устройствах.

**Твоя задача:** создать React-приложение, перенеся все 16 экранов из прототипа **1-в-1**.

## Правила работы

1. **Прототип — первоисточник.** Открой `index.html` в браузере. Все вопросы «как должно выглядеть» решаются открытием прототипа и копированием.

2. **Дизайн-система готова.** В стартере есть `src/styles/tokens.css` со всеми CSS-переменными. Используй ТОЛЬКО их. Никаких хардкод-цветов вроде `#1a73e8` или `bg-blue-500`.

3. **Никаких UI-библиотек.** Не используй Material UI, shadcn, Tailwind, Chakra, Bootstrap. Только React + CSS Modules + готовый `tokens.css`.

4. **Тексты — в i18n.** Все строки UI в `src/i18n/ru.json`, доступ через `useTranslation()`. Никаких хардкод-строк в JSX.

5. **Тёмная тема по умолчанию.** Светлая включается через переключатель в Профиле.

## Что в стартовом пакете

```
skifind-react-starter/
├── README.md                          ← подробная инструкция
├── src/
│   ├── styles/tokens.css              ← дизайн-система, НЕ МЕНЯТЬ
│   ├── hooks/useTheme.ts              ← переключение темы
│   ├── i18n/
│   │   ├── ru.json                    ← все тексты UI
│   │   └── useTranslation.ts          ← хук перевода
│   └── screens/
│       ├── AuthScreen.tsx             ← готовый стартовый экран
│       └── AuthScreen.module.css      ← стили стартового экрана
```

`AuthScreen.tsx` сделан 1-в-1 как в прототипе. **Используй его как образец** для остальных 15 экранов.

## Алгоритм работы

### Шаг 1 — настрой проект

```bash
npm create vite@latest skifind -- --template react-ts
cd skifind
npm install react-router-dom zustand @tanstack/react-query axios \
            react-hook-form zod @hookform/resolvers socket.io-client
npm install -D vite-plugin-pwa
```

Скопируй файлы из стартера в соответствующие папки.

### Шаг 2 — обнови `index.html` Vite-проекта

```html
<!DOCTYPE html>
<html lang="ru" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
  <meta name="theme-color" content="#0E0E10" />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

  <title>SkiFind</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

### Шаг 3 — main.tsx подключает токены первой строкой

```tsx
import './styles/tokens.css';   // ← ОБЯЗАТЕЛЬНО первой строкой
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Шаг 4 — App.tsx с роутингом

Создай минимальный App.tsx с роутингом который пока показывает только AuthScreen. Покажи мне скриншот.

**ОСТАНОВИСЬ ПОСЛЕ ЭТОГО ШАГА.** Дождись моей проверки и одобрения.

### Шаг 5 — после моего одобрения

Перейдём к следующему экрану. По одному за раз. С проверкой скриншотом.

## Категорически нельзя

- ❌ Менять цвета из `tokens.css`
- ❌ Использовать UI-библиотеки (Material UI, shadcn, Tailwind и т.п.)
- ❌ Делать «свой» вариант стартового экрана с большим логотипом SKIFIND
- ❌ Использовать gradient-фоны если их нет в прототипе
- ❌ Менять структуру `AuthScreen.tsx` — он уже идеален
- ❌ Идти вперёд по экранам без моего одобрения
- ❌ Хардкодить цвета или строки

## Если есть вопросы

- Открой прототип `index.html` и посмотри
- Inspect нужный элемент в DevTools
- Скопируй стили один-в-один

Не додумывай ничего.

---

**Подтверди что прочитал инструкцию и понял правила. Перечисли:**
1. Что является первоисточником дизайна
2. Какие UI-библиотеки можно использовать
3. Какая тема по умолчанию
4. Что нужно сделать в Шаге 4 и когда останавливаться

Только после твоего ответа я разрешаю создавать проект.
