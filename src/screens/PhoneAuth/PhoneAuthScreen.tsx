import { useState } from 'react';
import styles from './PhoneAuthScreen.module.css';
import { useTranslation } from '@/i18n/useTranslation';

interface PhoneAuthScreenProps {
  onBack: () => void;
  onSubmit: (data: { firstName: string; lastName: string; phone: string }) => void;
}

function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  const d = digits.startsWith('7') ? digits.slice(1) : digits;
  let result = '+7';
  if (d.length > 0) result += ' (' + d.slice(0, 3);
  if (d.length >= 3) result += ') ' + d.slice(3, 6);
  if (d.length >= 6) result += '-' + d.slice(6, 8);
  if (d.length >= 8) result += '-' + d.slice(8, 10);
  return result;
}

/**
 * authStep2 — регистрация гостя: имя, фамилия, телефон.
 * 1-в-1 копия из прототипа PROTOTYPE.html, секция authStep2.
 * НИКАКИХ изменений дизайна без согласования.
 */
export function PhoneAuthScreen({ onBack, onSubmit }: PhoneAuthScreenProps) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(maskPhone(e.target.value));
  }

  function handlePhoneFocus(e: React.FocusEvent<HTMLInputElement>) {
    if (!e.target.value) setPhone('+7 ');
  }

  function handleSubmit() {
    if (!firstName.trim() || !lastName.trim() || phone.length < 18) return;
    onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), phone });
  }

  return (
    <div className={styles.screen}>
      <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Назад">
        ‹
      </button>

      <h1 className={styles.title}>{t('auth.step2Greeting')}</h1>
      <p className={styles.subtitle}>{t('auth.step2Sub')}</p>

      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>{t('auth.firstName')}</label>
          <input
            type="text"
            className={styles.input}
            placeholder={t('auth.firstNamePlaceholder')}
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            autoComplete="given-name"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('auth.lastName')}</label>
          <input
            type="text"
            className={styles.input}
            placeholder={t('auth.lastNamePlaceholder')}
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            autoComplete="family-name"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('auth.phoneLabel')}</label>
          <input
            type="tel"
            className={styles.input}
            placeholder={t('auth.phonePlaceholder')}
            value={phone}
            onChange={handlePhoneChange}
            onFocus={handlePhoneFocus}
            maxLength={18}
            autoComplete="tel"
          />
        </div>
      </div>

      <button
        type="button"
        className={styles.submitBtn}
        onClick={handleSubmit}
      >
        {t('auth.getSmsCode')}
      </button>

      <p className={styles.legal}>{t('auth.step2Legal')}</p>
    </div>
  );
}
