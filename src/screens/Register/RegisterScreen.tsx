import { useRef, useState } from 'react';
import styles from './RegisterScreen.module.css';
import { applyPhoneMask } from '@/utils/phoneMask';

type Step = 1 | 2 | 3 | 'success';

interface RegisterScreenProps {
  onBack:    () => void;
  isEditMode?: boolean; // true → «Редактировать профиль» вместо «Регистрация»
}

const STEP_LABELS: Record<number, string> = {
  1: 'Шаг 1 из 3 · Личные данные',
  2: 'Шаг 2 из 3 · Специализация',
  3: 'Шаг 3 из 3 · Проверка',
};

function CheckItem({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <button
      className={`${styles.checkItem} ${on ? styles.checkItemOn : ''}`}
      onClick={() => setOn(v => !v)}
    >
      {label}
    </button>
  );
}

function AgreeItem({ children, link }: { children: React.ReactNode; link?: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className={styles.agreeItem} onClick={() => setOn(v => !v)}>
      <div className={`${styles.agreeBox} ${on ? styles.agreeBoxOn : ''}`}>
        {on ? '✓' : ''}
      </div>
      <span>{children}{link && <span className={styles.agreeLink}> {link}</span>}</span>
    </div>
  );
}

export function RegisterScreen({ onBack, isEditMode = false }: RegisterScreenProps) {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [lname, setLname] = useState('');
  const [phone, setPhone] = useState('');
  // Курорт зафиксирован — только Шерегеш на старте
  const ACTIVE_RESORTS = ['Шерегеш'];
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const initials = (name[0] || '') + (lname[0] || '') || 'АМ';

  const stepNum = typeof step === 'number' ? step : 3;

  return (
    <div className={styles.screen}>
      {/* Hero */}
      <div className={styles.regHero}>
        <button className={styles.backBtn} onClick={step === 1 ? onBack : () => setStep(s => (typeof s === 'number' ? Math.max(1, s - 1) : 4) as Step)}>
          ‹
        </button>
        <div className={styles.regTitle}>{isEditMode ? 'Редактировать профиль' : 'Стать инструктором'}</div>
        <div className={styles.regSub}>
          {step === 'success' ? 'Готово!' : STEP_LABELS[stepNum]}
        </div>
        {step !== 'success' && (
          <div className={styles.progPills}>
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className={`${styles.pp} ${n < stepNum ? styles.ppDone : n === stepNum ? styles.ppActive : ''}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className={styles.scroll}>
        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className={styles.stepBody}>
            <div className={styles.stepTitle}>Личные данные</div>

            <div className={styles.avUpload}>
              <div className={styles.avCircle} style={photoUrl ? { backgroundImage: `url(${photoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' } : undefined}>{photoUrl ? '' : initials}</div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setPhotoUrl(URL.createObjectURL(file));
                }} />
                <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>Загрузить фото</button>
                <div className={styles.uploadHint}>JPG или PNG · до 5 МБ</div>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Имя</label>
                <input type="text" placeholder="Алексей" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Фамилия</label>
                <input type="text" placeholder="Морозов" value={lname} onChange={e => setLname(e.target.value)} />
              </div>
            </div>

            <div className={styles.field}>
              <label>Телефон</label>
              <input
                type="tel"
                placeholder="+7 (___) ___-__-__"
                value={phone}
                onChange={e => setPhone(applyPhoneMask(e.target.value))}
                onFocus={e => { if (!e.target.value) setPhone('+7'); }}
                maxLength={18}
              />
            </div>
            <div className={styles.field}>
              <label>E-mail</label>
              <input type="email" placeholder="name@mail.ru" />
            </div>
            <div className={styles.field}>
              <label>Город</label>
              <input type="text" placeholder="Сочи" />
            </div>
            <div className={styles.field}>
              <label>Языки</label>
              <div className={styles.checkGrid}>
                <CheckItem label="Русский" defaultOn />
                <CheckItem label="Английский" />
                <CheckItem label="Немецкий" />
                <CheckItem label="Французский" />
                <CheckItem label="Китайский" />
              </div>
            </div>

            <div className={styles.stepNav}>
              <button className={styles.btnPrimary} onClick={() => setStep(2)}>Далее →</button>
            </div>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className={styles.stepBody}>
            <div className={styles.stepTitle}>Специализация</div>

            <div className={styles.field}>
              <label>Дисциплина</label>
              <div className={styles.checkGrid}>
                <CheckItem label="Сноуборд" defaultOn />
                <CheckItem label="Горные лыжи" />
              </div>
            </div>
            <div className={styles.field}>
              <label>С кем работаете</label>
              <div className={styles.checkGrid}>
                <CheckItem label="Взрослые" defaultOn />
                <CheckItem label="Дети" defaultOn />
                <CheckItem label="Группы" />
              </div>
            </div>
            <div className={styles.field}>
              <label>Уровни учеников</label>
              <div className={styles.checkGrid}>
                <CheckItem label="Новички" defaultOn />
                <CheckItem label="Средний" defaultOn />
                <CheckItem label="Продвинутые" />
                <CheckItem label="Фрирайд" />
              </div>
            </div>
            <div className={styles.field}>
              <label>Опыт преподавания</label>
              <select defaultValue="3-5">
                <option value="<1">Меньше 1 года</option>
                <option value="1-3">1–3 года</option>
                <option value="3-5">3–5 лет</option>
                <option value="5-10">5–10 лет</option>
                <option value="10+">Более 10 лет</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Сертификаты</label>
              <textarea placeholder="SBINZ Level 2 (2019), инструктор ФГССР (2021)..." />
            </div>
            <div className={styles.field}>
              <label>О себе</label>
              <textarea placeholder="Расскажите о подходе к обучению..." />
            </div>

            <div className={styles.field}>
              <label>Курорт</label>
              <div className={styles.resortLocked}>
                <div className={styles.resortLockedIcon}>📍</div>
                <div className={styles.resortLockedInfo}>
                  <div className={styles.resortLockedName}>{ACTIVE_RESORTS[0]}</div>
                  <div className={styles.resortLockedSub}>
                    Сейчас платформа работает только в Шерегеше.<br />
                    Скоро добавим Розу Хутор и другие курорты.
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.stepNav}>
              <button className={styles.btnSecondary} onClick={() => setStep(1)}>← Назад</button>
              <button className={styles.btnPrimary} onClick={() => setStep(3)}>Далее →</button>
            </div>
          </div>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <div className={styles.stepBody}>
            <div className={styles.stepTitle}>Проверка</div>

            <div className={styles.reviewBox}>
              <div className={styles.reviewBoxHead}>
                <div className={styles.previewAv}>{initials}</div>
                <div>
                  <div className={styles.previewName}>{name || 'Ваше имя'} {lname}</div>
                  <div className={styles.previewSub}>Инструктор · Сноуборд</div>
                </div>
              </div>
              <div className={styles.reviewBoxRow}><span>Дисциплина</span><span>Сноуборд, горные лыжи</span></div>
              <div className={styles.reviewBoxRow}><span>Курорт</span><span>{ACTIVE_RESORTS[0]}</span></div>
              <div className={styles.reviewBoxRow}><span>Языки</span><span>Русский</span></div>
            </div>

            <AgreeItem link="правилами платформы">
              Соглашаюсь с{' '}
            </AgreeItem>
            <AgreeItem>Получать уведомления о новых заявках</AgreeItem>

            <div className={styles.stepNav} style={{ marginTop: 16 }}>
              <button className={styles.btnSecondary} onClick={() => setStep(2)}>← Назад</button>
              <button
                className={`${styles.btnPrimary} ${styles.btnPrimaryGreen}`}
                onClick={() => setStep('success')}
              >
                {isEditMode ? 'Сохранить' : 'Опубликовать'}
              </button>
            </div>
          </div>
        )}

        {/* ── Success ── */}
        {step === 'success' && (
          <div className={styles.successScreen}>
            <div className={styles.successIcon}>✓</div>
            <div className={styles.successTitle}>{isEditMode ? 'Профиль обновлён!' : 'Заявка отправлена!'}</div>
            <div className={styles.successSub}>
              {isEditMode
                ? 'Изменения сохранены и вступят в силу в течение нескольких минут.'
                : 'Проверим ваши данные в течение 24 часов и пришлём письмо на e-mail. После одобрения профиль появится в каталоге.'}
            </div>
            <button className={styles.btnPrimaryBlock} onClick={onBack}>
              Перейти в кабинет
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
