import ru from './ru.json';

type TranslationKey = string;
type TranslationParams = Record<string, string | number>;

/**
 * Простой хук для переводов. Поддерживает плейсхолдеры вида {name}.
 *
 * Пример:
 *   const { t } = useTranslation();
 *   t('auth.greeting');                                  // "Здравствуйте"
 *   t('catalog.stats', { count: 248, resorts: 4 });      // "248 инструкторов · 4 курорта"
 *
 * В будущем сюда добавим переключение языков.
 * Пока всё хардкодом на русский.
 */
export function useTranslation() {
  const t = (key: TranslationKey, params?: TranslationParams): string => {
    // Идём по вложенному JSON: 'auth.greeting' → ru.auth.greeting
    const value = key.split('.').reduce<unknown>((obj, k) => {
      if (obj && typeof obj === 'object' && k in obj) {
        return (obj as Record<string, unknown>)[k];
      }
      return undefined;
    }, ru);

    if (typeof value !== 'string') {
      console.warn(`[i18n] Missing key: ${key}`);
      return key;
    }

    if (!params) return value;

    // Подставляем плейсхолдеры {name}
    return value.replace(/\{(\w+)\}/g, (_match, name) => {
      return name in params ? String(params[name]) : `{${name}}`;
    });
  };

  return { t };
}
