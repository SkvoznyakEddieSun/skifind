import { useState } from 'react';
import styles from './PhoneAuthScreen.module.css';
import { applyPhoneMask } from '@/utils/phoneMask';
import { requestCode } from '@/lib/api';

interface PhoneAuthScreenProps {
  onBack:     () => void;
  /** Code sent OK → go to SMS step. devCode is a temp dev hint (no real SMS yet). */
  onCodeSent: (phone: string, devCode: string) => void;
}

/**
 * Шаг 1 входа: ввод номера телефона.
 * Вход один для всех — роль приходит с сервера после verify (см. SmsCodeScreen).
 */
export function PhoneAuthScreen({ onBack, onCodeSent }: PhoneAuthScreenProps) {
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(applyPhoneMask(e.target.value));
    if (error) setError(null);
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    if (!e.target.value) setPhone('+7');
  }

  // +7 (XXX) XXX-XX-XX → 18 символов
  const canSubmit = phone.length >= 18 && !loading;

  async function handleSubmit() {
    if (phone.length < 18 || loading) return;
    setLoading(true);
    setError(null);
    const res = await requestCode(phone);
    setLoading(false);
    if (res.ok) {
      onCodeSent(phone, res.devCode);
    } else {
      // Понятный текст из ответа сервера (INVALID_PHONE, RATE_LIMITED, …)
      setError(res.error);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
  }

  return (
    <div className={styles.screen}>
      <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Назад">
        ‹
      </button>

      <h1 className={styles.title}>Вход по телефону</h1>
      <p className={styles.subtitle}>Введите номер телефона — отправим SMS с кодом подтверждения</p>

      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="phone-input">Номер телефона</label>
          <input
            id="phone-input"
            type="tel"
            className={styles.input}
            placeholder="+7 (000) 000-00-00"
            value={phone}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            maxLength={18}
            autoComplete="tel"
            autoFocus
          />
        </div>
        {error && <p className={styles.error} role="alert">{error}</p>}
      </div>

      <button
        type="button"
        className={styles.submitBtn}
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        {loading ? 'Отправка…' : 'Получить код'}
      </button>

      <p className={styles.legal}>
        Нажимая кнопку, вы соглашаетесь с условиями использования и политикой конфиденциальности
      </p>
    </div>
  );
}
