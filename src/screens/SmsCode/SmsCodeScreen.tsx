import { useEffect, useRef, useState } from 'react';
import styles from './SmsCodeScreen.module.css';

interface SmsCodeScreenProps {
  phone:      string;
  onBack:     () => void;
  onVerified: (code: string) => void;
}

const CODE_LENGTH    = 4;
const RESEND_SECONDS = 59;

/**
 * Шаг 2 входа инструктора: 4-значный SMS-код.
 * Любой корректно заполненный 4-значный код принимается (имитация SMS).
 * Кнопка «Войти» активируется после ввода всех 4 цифр.
 */
export function SmsCodeScreen({ phone, onBack, onVerified }: SmsCodeScreenProps) {
  const [digits,  setDigits]  = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Auto-focus first input
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

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

  const codeComplete = digits.every(d => d !== '');

  function handleLogin() {
    if (!codeComplete) return;
    onVerified(digits.join(''));
  }

  const timerLabel = `0:${String(seconds).padStart(2, '0')}`;

  return (
    <div className={styles.screen}>
      <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Назад">
        ‹
      </button>

      <h1 className={styles.title}>Введите код из SMS</h1>
      <p className={styles.subtitle}>
        Код отправлен на <strong className={styles.phoneHighlight}>{phone}</strong>
      </p>

      <div className={styles.digits}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className={`${styles.digit} ${d ? styles.digitFilled : ''}`}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
          />
        ))}
      </div>

      <button
        type="button"
        className={styles.submitBtn}
        onClick={handleLogin}
        disabled={!codeComplete}
      >
        Войти
      </button>

      <div className={styles.timer}>
        {seconds > 0 ? (
          <span>Отправить код повторно через {timerLabel}</span>
        ) : (
          <button type="button" className={styles.resendBtn} onClick={handleResend}>
            Отправить код повторно
          </button>
        )}
      </div>
    </div>
  );
}
