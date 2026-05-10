import { useEffect, useRef, useState } from 'react';
import styles from './SmsCodeScreen.module.css';
import { useTranslation } from '@/i18n/useTranslation';

interface SmsCodeScreenProps {
  phone: string;
  onBack: () => void;
  onVerified: (code: string) => void;
}

const CODE_LENGTH = 4;
const RESEND_SECONDS = 59;

/**
 * authStep3 — ввод 4-значного SMS-кода.
 * 1-в-1 копия из прототипа PROTOTYPE.html, секция authStep3.
 * НИКАКИХ изменений дизайна без согласования.
 */
export function SmsCodeScreen({ phone, onBack, onVerified }: SmsCodeScreenProps) {
  const { t } = useTranslation();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  function handleChange(idx: number, val: string) {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);

    if (char && idx < CODE_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }

    if (next.every(d => d) && next.join('').length === CODE_LENGTH) {
      onVerified(next.join(''));
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  }

  function handleResend() {
    setDigits(Array(CODE_LENGTH).fill(''));
    setSeconds(RESEND_SECONDS);
    inputRefs.current[0]?.focus();
  }

  const timerLabel = `0:${String(seconds).padStart(2, '0')}`;

  return (
    <div className={styles.screen}>
      <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Назад">
        ‹
      </button>

      <h1 className={styles.title}>{t('auth.step3Title')}</h1>
      <p className={styles.subtitle}>
        {t('auth.step3Sub')} <strong className={styles.phoneHighlight}>{phone}</strong>
      </p>

      <div className={styles.digits}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className={styles.digit}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
          />
        ))}
      </div>

      <div className={styles.timer}>
        {seconds > 0 ? (
          <span>{t('auth.resendCodeTimer').replace('{time}', timerLabel)}</span>
        ) : (
          <button type="button" className={styles.resendBtn} onClick={handleResend}>
            {t('auth.resendCode')}
          </button>
        )}
      </div>
    </div>
  );
}
