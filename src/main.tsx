import './styles/tokens.css';   // ПЕРВОЙ строкой — обязательно
import './styles/inputs.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
// Применяем сохранённую тему один раз на буте — чтобы после перезагрузки
// выбор не сбрасывался до монтирования экрана с useTheme. Ключ общий со хуком.
const savedTheme = localStorage.getItem('skifind-theme');
document.documentElement.setAttribute('data-theme', savedTheme === 'light' ? 'light' : 'dark');

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
