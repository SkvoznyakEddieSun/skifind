import { useState } from 'react';
import styles from './PhoneAuthScreen.module.css';
import { applyPhoneMask } from '@/utils/phoneMask';

interface PhoneAuthScreenProps {
  onBack:   () => void;
  onSubmit: (phone: string) => void;
}

/**
 * Шаг 1 входа инструктора: ввод номера телефона.
 * Любой полный номер (+7 XXX XXX-XX-XX) принимается → переход к SMS-коду.
 */
export function PhoneAuthScreen({ onBack, onSubmit }: PhoneAuthScreenProps) {
  const [phone, setPhone] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(applyPhoneMask(e.target.value));
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    if (!e.target.value) setPhone('+7');
  }

  // +7 (XXX) XXX-XX-XX → 18 символов
  const canSubmit = phone.length >= 18;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(phone);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSubmit();
  }

  return (
    <div className={styles.screen}>
      <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Назад">
        ‹
      </button>

      <h1 className={styles.title}>Вход для инструкторов</h1>
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
      </div>

      <button
        type="button"
        className={styles.submitBtn}
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        Получить код
      </button>

      <p className={styles.legal}>
        Нажимая кнопку, вы соглашаетесь с условиями использования и политикой конфиденциальности
      </p>
    </div>
  );
}
