import { useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'skifind-theme';

/**
 * Хук для управления темой (dark/light).
 * Сохраняет выбор в localStorage.
 * По умолчанию — dark.
 *
 * Использование:
 *   const { theme, toggleTheme } = useTheme();
 *   <button onClick={toggleTheme}>{theme === 'dark' ? '☾' : '☀'}</button>
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme, setTheme };
}
