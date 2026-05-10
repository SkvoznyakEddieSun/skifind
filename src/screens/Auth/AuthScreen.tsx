import styles from './AuthScreen.module.css';
import { useTranslation } from '@/i18n/useTranslation';

interface AuthScreenProps {
  onSelectRole: (role: 'guest' | 'instructor') => void;
  onLoginByPhone: () => void;
}

/**
 * Стартовый экран — выбор роли (гость / инструктор) или вход по номеру.
 * 1-в-1 копия из прототипа index.html, секция scr-auth → authStep1.
 *
 * НИКАКИХ изменений дизайна без согласования.
 */
export function AuthScreen({ onSelectRole, onLoginByPhone }: AuthScreenProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.screen}>
      <div className={styles.hero}>
        <h1 className={styles.title}>{t('auth.greeting')}</h1>
        <p className={styles.subtitle}>{t('auth.intro')}</p>
      </div>

      <div className={styles.roleSelect}>
        <button
          type="button"
          className={styles.roleCard}
          onClick={() => onSelectRole('guest')}
        >
          <div className={styles.roleIcon} aria-hidden>🏔️</div>
          <div className={styles.roleInfo}>
            <div className={styles.roleTitle}>{t('auth.iAmStudent')}</div>
            <div className={styles.roleSub}>{t('auth.studentDescription')}</div>
          </div>
          <span className={styles.roleArrow} aria-hidden>›</span>
        </button>

        <button
          type="button"
          className={styles.roleCard}
          onClick={() => onSelectRole('instructor')}
        >
          <div className={styles.roleIcon} aria-hidden>🎿</div>
          <div className={styles.roleInfo}>
            <div className={styles.roleTitle}>{t('auth.iAmInstructor')}</div>
            <div className={styles.roleSub}>{t('auth.instructorDescription')}</div>
          </div>
          <span className={styles.roleArrow} aria-hidden>›</span>
        </button>
      </div>

      <div className={styles.divider}>
        <span>{t('auth.or')}</span>
      </div>

      <button
        type="button"
        className={styles.loginLink}
        onClick={onLoginByPhone}
      >
        {t('auth.haveAccount')} <strong>{t('auth.loginByPhone')}</strong>
      </button>

      <p className={styles.legal}>{t('auth.legal')}</p>
    </div>
  );
}
