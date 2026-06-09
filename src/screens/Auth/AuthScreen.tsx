import styles from './AuthScreen.module.css';
import { Icon } from '@/components/Icon/Icon';

interface AuthScreenProps {
  onGuest:        () => void;   // «Я ученик» → сразу в каталог
  onLoginByPhone: () => void;   // «Я инструктор» и «Войти по номеру» → PhoneScreen
}

/**
 * Стартовый экран — выбор роли.
 * «Я ученик» → гостевой каталог без регистрации.
 * «Я инструктор» / «Войти по номеру» → двухшаговый вход (телефон + SMS).
 */
export function AuthScreen({ onGuest, onLoginByPhone }: AuthScreenProps) {
  return (
    <div className={styles.screen}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Добро пожаловать</h1>
        <p className={styles.subtitle}>Найдите инструктора по горным лыжам или сноуборду в Шерегеше</p>
      </div>

      <div className={styles.roleSelect}>
        <button
          type="button"
          className={styles.roleCard}
          onClick={onGuest}
        >
          <div className={styles.roleIcon} aria-hidden><Icon name="mountain" size={26} /></div>
          <div className={styles.roleInfo}>
            <div className={styles.roleTitle}>Я ученик</div>
            <div className={styles.roleSub}>Найти инструктора и записаться</div>
          </div>
          <span className={styles.roleArrow} aria-hidden>›</span>
        </button>

        <button
          type="button"
          className={styles.roleCard}
          onClick={onLoginByPhone}
        >
          <div className={styles.roleIcon} aria-hidden><Icon name="ski" size={26} /></div>
          <div className={styles.roleInfo}>
            <div className={styles.roleTitle}>Я инструктор</div>
            <div className={styles.roleSub}>Управлять расписанием и заявками</div>
          </div>
          <span className={styles.roleArrow} aria-hidden>›</span>
        </button>
      </div>

      <div className={styles.divider}>
        <span>или</span>
      </div>

      <button
        type="button"
        className={styles.loginLink}
        onClick={onLoginByPhone}
      >
        Уже есть аккаунт? <strong>Войдите по номеру</strong>
      </button>

      <p className={styles.legal}>
        Продолжая, вы принимаете условия использования и политику конфиденциальности
      </p>
    </div>
  );
}
