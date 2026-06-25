import styles from './LoadingScreen.module.css';

/** Minimal boot loader shown while the session token is validated (/me). */
export function LoadingScreen() {
  return (
    <div className={styles.screen}>
      <div className={styles.spinner} aria-label="Загрузка" role="status" />
    </div>
  );
}
