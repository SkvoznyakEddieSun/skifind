import './styles/tokens.css';   // ПЕРВОЙ строкой — обязательно
import './styles/inputs.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';

// React Query — единый клиент для загрузки/кэша серверных данных.
// staleTime 30s, один retry (сеть могла моргнуть).
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
});
// Применяем сохранённую тему один раз на буте — чтобы после перезагрузки
// выбор не сбрасывался до монтирования экрана с useTheme. Ключ общий со хуком.
const savedTheme = localStorage.getItem('skifind-theme');
document.documentElement.setAttribute('data-theme', savedTheme === 'light' ? 'light' : 'dark');

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
