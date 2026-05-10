# SkiFind — инструкция для Claude Code

## ⚠️ ВАЖНО: ЭТО НЕ СВОБОДНАЯ РАЗРАБОТКА

Прототип `index.html` (5896 строк) — это **точное ТЗ дизайна**, не вдохновение.
Каждый экран, каждая кнопка, каждый цвет уже продуманы и протестированы.

**Твоя задача:** перенести 16 экранов прототипа в React 1-в-1.

**НЕ нужно:**
- Придумывать свой дизайн
- Менять цвета, размеры, отступы
- Добавлять «модные» элементы которых нет в прототипе
- Использовать Material UI, shadcn, Bootstrap и любые UI-библиотеки

**Нужно:**
- Открывать прототип в браузере
- Находить нужный экран в DOM
- Переносить структуру и стили в React-компонент
- Использовать ТОЛЬКО CSS-переменные из `tokens.css`

---

## Стек

```
React 18 + TypeScript + Vite
React Router v6
Zustand (state)
TanStack Query (запросы к API)
React Hook Form + Zod (формы)
CSS Modules (стили — НЕ Tailwind, НЕ styled-components)
socket.io-client (real-time чат)
vite-plugin-pwa (PWA)
```

## Запуск проекта с нуля

```bash
# 1. Создаём Vite-проект
npm create vite@latest skifind -- --template react-ts
cd skifind

# 2. Устанавливаем зависимости
npm install react-router-dom zustand @tanstack/react-query axios \
            react-hook-form zod @hookform/resolvers \
            socket.io-client

npm install -D vite-plugin-pwa

# 3. Копируем стартовые файлы из этого пакета:
#    - src/styles/tokens.css       → src/styles/tokens.css
#    - src/hooks/useTheme.ts       → src/hooks/useTheme.ts
#    - src/i18n/                   → src/i18n/
#    - src/screens/AuthScreen.*    → src/screens/AuthScreen.*

# 4. Подключаем стили в src/main.tsx ПЕРВОЙ строкой импорта:
#    import './styles/tokens.css'

# 5. В index.html добавляем шрифт Inter:
#    <link rel="preconnect" href="https://fonts.googleapis.com"/>
#    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
#    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
#
#    И в meta:
#    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"/>
```

## Алгоритм работы по каждому экрану

### Шаг 1: Открой прототип
```bash
open index.html  # macOS
# или просто перетащи в браузер
```

Дождись пока загрузится Inter (1-2 секунды). Должна появиться тёмная тема с заголовком «Здравствуйте» и двумя карточками выбора роли.

### Шаг 2: Найди нужный экран в DOM
В DevTools → Elements найди соответствующий блок:
- `#scr-auth` — стартовый
- `#scr-catalog` — каталог
- `#scr-profile` — профиль инструктора (как видит гость)
- `#scr-bookings` — мои занятия
- `#scr-chat-list` — список чатов
- `#scr-chat` — конкретный чат
- `#scr-guest-profile` — профиль гостя
- `#scr-dashboard` — главная инструктора
- `#scr-requests` — заявки инструктора
- `#scr-calendar` — календарь
- `#scr-instr-profile` — настройки инструктора
- `#scr-balance` — баланс
- `#scr-community` — сообщество
- `#scr-notifications` — уведомления
- `#scr-reviews` — все отзывы
- `#scr-register` — регистрация инструктора

### Шаг 3: Скопируй разметку и стили
Структуру HTML → перенеси в JSX (имена классов через CSS-modules).
Inline-стили → перенеси в `.module.css` файл.
Все цвета → ЗАМЕНИ на `var(--token)` из tokens.css.

### Шаг 4: Тексты — в `src/i18n/ru.json`
Никаких хардкод-строк в JSX. Используй `useTranslation()`.

### Шаг 5: Сравни визуально
Открой готовый React-экран и прототип в двух окнах рядом.
**Должны быть идентичны.** Если отличается — переделай.

---

## Готовые файлы в этом стартере

| Файл | Что делает |
|---|---|
| `src/styles/tokens.css` | Все CSS-переменные дизайн-системы. **НЕ ТРОГАТЬ.** |
| `src/hooks/useTheme.ts` | Хук переключения тёмной/светлой темы |
| `src/i18n/ru.json` | Все тексты UI на русском |
| `src/i18n/useTranslation.ts` | Хук `useTranslation()` для перевода |
| `src/screens/AuthScreen.tsx` | Стартовый экран — точная копия из прототипа |
| `src/screens/AuthScreen.module.css` | Стили стартового экрана |

## Стартовый экран — пример того как должно быть

`AuthScreen.tsx` уже соответствует прототипу 1-в-1:
- Тёмный фон (`var(--bg)`)
- Заголовок «Здравствуйте» 32px Bold
- Подзаголовок 14px серый
- Две карточки выбора роли с эмодзи 🏔️ / 🎿
- Тёмные карточки `var(--surface-1)` с border `var(--border)`
- Разделитель «или»
- Кнопка «Уже есть аккаунт? Войти по номеру»
- Юридический текст внизу

**Используй этот файл как ШАБЛОН** для остальных 15 экранов.

---

## Критичные UX-требования

### iOS-зум
ВСЕ `<input>`, `<select>`, `<textarea>` ОБЯЗАНЫ иметь `font-size: 16px`.
Это уже зашито в `tokens.css` через глобальный селектор. Не переопределяй.

### Safe-area
- Все topbar: `padding-top: calc(var(--safe-top) + 14px)`
- Низ экрана: `padding-bottom: calc(var(--safe-bot) + ...)`

### Floating bottom-nav
Появляется только на табовых экранах. **Скрывается** на:
- chat (свой ввод сообщений)
- register (свои кнопки Назад/Далее)
- notifications, reviews, balance, community

### Анимации
- Модалы выезжают снизу: `animation: slideUp .25s ease-out`
- Кнопки при нажатии: `transform: scale(.99)` или `.95`
- Переходы цвета: `transition: .15s ease`

### Тема
По умолчанию **DARK**. Переключение `data-theme="light"` через хук `useTheme`.
Хранится в localStorage.

### Тосты
4 типа: success / info / warn / error.
Каждое действие пользователя должно подтверждаться тостом.

---

## Чек-лист перед коммитом каждого экрана

- [ ] Открыт прототип, открыта реализация — выглядят идентично
- [ ] Все цвета из `var(--*)`, никаких хардкод #hex
- [ ] Все тексты в `ru.json`, никаких строк в JSX
- [ ] У всех инпутов работает фокус без iOS-зума
- [ ] Safe-area отступы на topbar и bottom
- [ ] Скриншот в обеих темах: dark и light
- [ ] Кнопка «Назад» если это subscreen
- [ ] Тосты на действия

---

## Что разработчик НЕ должен делать

❌ Использовать Tailwind / Material UI / shadcn / Chakra / любые UI-киты
❌ Менять цвета или размеры из прототипа
❌ Придумывать «улучшенные» формы / поля / кнопки
❌ Добавлять gradient-фоны если их нет в прототипе
❌ Использовать иконки из lucide-react / FontAwesome (только эмодзи и SVG из прототипа)
❌ Делать «свой» логотип SKIFIND большим текстом — у нас нет логотипа на стартовом экране
❌ Использовать `localStorage` для бизнес-данных (только для темы)

---

## Если что-то непонятно

1. Открой прототип
2. Найди нужный элемент через DevTools
3. Inspect его CSS
4. Скопируй один-в-один

Если в прототипе чего-то нет — **спроси заказчика**, не додумывай.

---

## После всех экранов

Когда все 16 экранов перенесены и визуально совпадают с прототипом —
переходим к **бэкенду** по файлу `PRODUCTION_PROMPT.md`.
