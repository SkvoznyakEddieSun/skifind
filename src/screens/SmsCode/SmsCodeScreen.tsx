import { useEffect, useRef, useState } from 'react';
import styles from './SmsCodeScreen.module.css';
import { verify as apiVerify } from '@/lib/api';
import type { SessionProfile } from '@/lib/session';

interface SmsCodeScreenProps {
  phone:      string;
  /** TODO: remove devCode hint when real SMS is wired up — no SMS yet, so we
   *  show the code returned by request-code so the user can enter it. */
  devCode?:   string;
  onBack:     () => void;
  onVerified: (token: string, profile: SessionProfile) => void;
}

const CODE_LENGTH    = 4;
const RESEND_SECONDS = 59;

/**
 * Шаг 2 входа: 4-значный код. Код проверяется на сервере (api.verify);
 * при успехе родитель сохраняет сессию и выбирает интерфейс по profile.role.
 */
export function SmsCodeScreen({ phone, devCode, onBack, onVerified }: SmsCodeScreenProps) {
  const [digits,  setDigits]  = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
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
    if (error) setError(null);
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
    setError(null);
    inputRefs.current[0]?.focus();
  }

  const codeComplete = digits.every(d => d !== '');

  async function handleLogin() {
    if (!codeComplete || loading) return;
    setLoading(true);
    setError(null);
    const res = await apiVerify(phone, digits.join(''));
    setLoading(false);
    if (res.ok) {
      onVerified(res.token, res.profile);
    } else {
      // WRONG_CODE, CODE_NOT_FOUND, CODE_EXPIRED → показать и дать повторить
      setError(res.error);
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
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

      {/* TODO: убрать подсказку при подключении реального SMS-провайдера */}
      {devCode && (
        <p className={styles.devHint}>Тестовый код: <strong>{devCode}</strong></p>
      )}

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

      {error && <p className={styles.error} role="alert">{error}</p>}

      <button
        type="button"
        className={styles.submitBtn}
        onClick={handleLogin}
        disabled={!codeComplete || loading}
      >
        {loading ? 'Проверка…' : 'Войти'}
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
