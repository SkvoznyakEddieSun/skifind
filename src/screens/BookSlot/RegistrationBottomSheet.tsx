import { useState } from 'react';
import styles from './RegistrationBottomSheet.module.css';
import { applyPhoneMask } from '@/utils/phoneMask';

interface RegistrationBottomSheetProps {
  /** Закрыть BottomSheet без сохранения */
  onDismiss: () => void;
  /** Данные сохранены в localStorage — продолжить запись */
  onSaved:   () => void;
}

/**
 * BottomSheet первичной регистрации гостя.
 * Показывается перед первой отправкой заявки.
 * После ввода данных сохраняет guestName + guestPhone в localStorage.
 */
export function RegistrationBottomSheet({ onDismiss, onSaved }: RegistrationBottomSheetProps) {
  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');

  const phoneValid = phone.length >= 18; // "+7 (XXX) XXX-XX-XX"
  const canSubmit  = name.trim().length >= 2 && phoneValid;

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(applyPhoneMask(e.target.value));
  }

  function handlePhoneFocus(e: React.FocusEvent<HTMLInputElement>) {
    if (!e.target.value) setPhone('+7');
  }

  function handleSave() {
    if (!canSubmit) return;
    localStorage.setItem('guestName',  name.trim());
    localStorage.setItem('guestPhone', phone);
    onSaved();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
  }

  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
        <div className={styles.handle} />

        <h2 className={styles.title}>Как вас зовут?</h2>
        <p className={styles.sub}>Нужно инструктору для подтверждения записи</p>

        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="reg-name">Имя и фамилия</label>
            <input
              id="reg-name"
              type="text"
              className={styles.input}
              placeholder="Иван Петров"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="reg-phone">Номер телефона</label>
            <input
              id="reg-phone"
              type="tel"
              className={styles.input}
              placeholder="+7 (000) 000-00-00"
              value={phone}
              onChange={handlePhoneChange}
              onFocus={handlePhoneFocus}
              onKeyDown={handleKeyDown}
              maxLength={18}
              autoComplete="tel"
            />
          </div>
        </div>

        <button
          type="button"
          className={styles.continueBtn}
          onClick={handleSave}
          disabled={!canSubmit}
        >
          Продолжить
        </button>
      </div>
    </div>
  );
}
