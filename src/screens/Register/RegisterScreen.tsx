import { useRef, useState } from 'react';
import styles from './RegisterScreen.module.css';
import { applyPhoneMask } from '@/utils/phoneMask';
import { INSTR_FLAGS, updateInstrFlags } from '@/store/instructorProfile';
import { INSTRUCTORS } from '@/screens/Catalog/CatalogScreen';

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function expToNum(key: string): number {
  const map: Record<string, number> = { '<1': 0, '1-3': 2, '3-5': 4, '5-10': 7, '10+': 12 };
  return map[key] ?? 4;
}

function numToExp(n: number): string {
  if (n >= 10) return '10+';
  if (n >= 5)  return '5-10';
  if (n >= 3)  return '3-5';
  if (n >= 1)  return '1-3';
  return '<1';
}

function buildTags(
  type: ('ski' | 'board')[],
  worksWithKids: boolean,
  level: string[],
): { label: string; color: 'blue' | 'mint' | 'straw' | 'purple' | 'gray' }[] {
  const tags: { label: string; color: 'blue' | 'mint' | 'straw' | 'purple' | 'gray' }[] = [];
  if (type.includes('board')) tags.push({ label: 'Сноуборд', color: 'blue' });
  if (type.includes('ski'))   tags.push({ label: 'Горные лыжи', color: 'blue' });
  if (worksWithKids)          tags.push({ label: 'Дети', color: 'purple' });
  if (level.includes('beginner'))    tags.push({ label: 'Новички', color: 'mint' });
  if (level.includes('freeride'))    tags.push({ label: 'Фрирайд', color: 'straw' });
  return tags;
}

// ── CheckItem — toggle chip ───────────────────────────────────────────────────

function CheckItem({
  label,
  defaultOn,
  onChange,
}: {
  label: string;
  defaultOn?: boolean;
  onChange?: (v: boolean) => void;
}) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <button
      className={`${styles.checkItem} ${on ? styles.checkItemOn : ''}`}
      onClick={() => { const next = !on; setOn(next); onChange?.(next); }}
    >
      {label}
    </button>
  );
}

// ── ControlledCheckItem — driven by parent state ──────────────────────────────

function ControlledCheckItem({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      className={`${styles.checkItem} ${on ? styles.checkItemOn : ''}`}
      onClick={() => onChange(!on)}
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

// ── Main component ────────────────────────────────────────────────────────────

export function RegisterScreen({ onBack, isEditMode = false }: RegisterScreenProps) {
  const [step, setStep] = useState<Step>(1);

  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [name, setName] = useState(() => {
    if (!isEditMode) return '';
    const parts = INSTRUCTORS[0].name.split(' ');
    return parts[0] ?? '';
  });
  const [lname, setLname] = useState(() => {
    if (!isEditMode) return '';
    const parts = INSTRUCTORS[0].name.split(' ');
    return parts.slice(1).join(' ') ?? '';
  });
  const [phone, setPhone] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(() =>
    isEditMode ? (INSTRUCTORS[0].photoUrl ?? null) : null
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const initials = (name[0] || '') + (lname[0] || '') || 'АМ';

  // ── Step 2 state ──────────────────────────────────────────────────────────
  const [disciplines, setDisciplines] = useState<Set<'ski' | 'board'>>(() =>
    isEditMode ? new Set(INSTRUCTORS[0].type) : new Set<'ski' | 'board'>(['board'])
  );

  const [worksAdults, setWorksAdults] = useState(true);
  const [worksKids, setWorksKids] = useState(() =>
    isEditMode ? INSTRUCTORS[0].worksWithKids : INSTR_FLAGS.worksWithKids
  );
  const [worksGroups, setWorksGroups] = useState(() =>
    isEditMode ? (INSTRUCTORS[0].worksWithGroups ?? false) : false
  );

  const [levels, setLevels] = useState<Set<string>>(() => {
    if (!isEditMode) return new Set(['beginner', 'intermediate']);
    // Exclude 'kids' from level set — it's driven by worksKids
    return new Set(INSTRUCTORS[0].level.filter(l => l !== 'kids' && l !== 'all'));
  });

  const [experience, setExperience] = useState(() =>
    isEditMode ? numToExp(INSTRUCTORS[0].exp) : '3-5'
  );

  const [certificates, setCertificates] = useState(() =>
    isEditMode ? (INSTRUCTORS[0].certificates ?? '') : ''
  );

  const [bio, setBio] = useState(() =>
    isEditMode ? (INSTRUCTORS[0].bio ?? '') : ''
  );

  // Курорт зафиксирован — только Шерегеш на старте
  const ACTIVE_RESORTS = ['Шерегеш'];

  const stepNum = typeof step === 'number' ? step : 3;

  // ── Toggle helpers ────────────────────────────────────────────────────────

  function toggleDiscipline(disc: 'ski' | 'board', on: boolean) {
    setDisciplines(prev => {
      const next = new Set(prev);
      if (on) next.add(disc); else next.delete(disc);
      return next;
    });
  }

  function toggleLevel(lvl: string, on: boolean) {
    setLevels(prev => {
      const next = new Set(prev);
      if (on) next.add(lvl); else next.delete(lvl);
      return next;
    });
  }

  // ── Save handler ─────────────────────────────────────────────────────────

  function handleSave() {
    if (isEditMode) {
      // — Name & initials
      const fullName = [name.trim(), lname.trim()].filter(Boolean).join(' ');
      if (fullName) {
        INSTRUCTORS[0].name = fullName;
        INSTRUCTORS[0].initials =
          ((name[0] ?? '') + (lname[0] ?? '')).toUpperCase() || INSTRUCTORS[0].initials;
      }

      // — Disciplines
      const typeArr = [...disciplines] as ('ski' | 'board')[];
      if (typeArr.length > 0) INSTRUCTORS[0].type = typeArr;

      // — Audiences
      INSTRUCTORS[0].worksWithKids = worksKids;
      INSTRUCTORS[0].worksWithGroups = worksGroups;
      updateInstrFlags('worksWithKids', worksKids);

      // — Levels (include 'kids' if worksWithKids)
      const levelArr = [...levels].filter(l => l !== 'kids') as (
        'beginner' | 'intermediate' | 'advanced' | 'freeride' | 'kids'
      )[];
      if (worksKids) levelArr.push('kids');
      if (levelArr.length > 0) INSTRUCTORS[0].level = levelArr;

      // — Experience
      INSTRUCTORS[0].exp = expToNum(experience);

      // — Certificates & bio
      INSTRUCTORS[0].certificates = certificates.trim();
      if (bio.trim()) INSTRUCTORS[0].bio = bio.trim();

      // — Photo
      if (photoUrl) INSTRUCTORS[0].photoUrl = photoUrl;

      // — Recompute tags
      INSTRUCTORS[0].tags = buildTags(
        INSTRUCTORS[0].type,
        worksKids,
        INSTRUCTORS[0].level,
      );
    }
    setStep('success');
  }

  // ── Render ────────────────────────────────────────────────────────────────

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
              <div
                className={styles.avCircle}
                style={photoUrl
                  ? { backgroundImage: `url(${photoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent' }
                  : undefined}
              >
                {photoUrl ? '' : initials}
              </div>
              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setPhotoUrl(URL.createObjectURL(file));
                  }}
                />
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
                <ControlledCheckItem
                  label="Сноуборд"
                  on={disciplines.has('board')}
                  onChange={v => toggleDiscipline('board', v)}
                />
                <ControlledCheckItem
                  label="Горные лыжи"
                  on={disciplines.has('ski')}
                  onChange={v => toggleDiscipline('ski', v)}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>С кем работаете</label>
              <div className={styles.checkGrid}>
                <ControlledCheckItem label="Взрослые" on={worksAdults} onChange={setWorksAdults} />
                <ControlledCheckItem
                  label="Дети"
                  on={worksKids}
                  onChange={v => { setWorksKids(v); updateInstrFlags('worksWithKids', v); }}
                />
                <ControlledCheckItem label="Группы" on={worksGroups} onChange={setWorksGroups} />
              </div>
            </div>

            <div className={styles.field}>
              <label>Уровни учеников</label>
              <div className={styles.checkGrid}>
                <ControlledCheckItem label="Новички"      on={levels.has('beginner')}    onChange={v => toggleLevel('beginner', v)} />
                <ControlledCheckItem label="Средний"      on={levels.has('intermediate')} onChange={v => toggleLevel('intermediate', v)} />
                <ControlledCheckItem label="Продвинутые"  on={levels.has('advanced')}    onChange={v => toggleLevel('advanced', v)} />
                <ControlledCheckItem label="Фрирайд"      on={levels.has('freeride')}    onChange={v => toggleLevel('freeride', v)} />
              </div>
            </div>

            <div className={styles.field}>
              <label>Опыт преподавания</label>
              <select value={experience} onChange={e => setExperience(e.target.value)}>
                <option value="<1">Меньше 1 года</option>
                <option value="1-3">1–3 года</option>
                <option value="3-5">3–5 лет</option>
                <option value="5-10">5–10 лет</option>
                <option value="10+">Более 10 лет</option>
              </select>
            </div>

            <div className={styles.field}>
              <label>Сертификаты</label>
              <textarea
                placeholder="SBINZ Level 2 (2019), инструктор ФГССР (2021)..."
                value={certificates}
                onChange={e => setCertificates(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <label>О себе</label>
              <textarea
                placeholder="Расскажите о подходе к обучению..."
                value={bio}
                onChange={e => setBio(e.target.value)}
              />
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

        {/* ── Step 3 — Preview ── */}
        {step === 3 && (
          <div className={styles.stepBody}>
            <div className={styles.stepTitle}>Проверка</div>

            <div className={styles.reviewBox}>
              <div className={styles.reviewBoxHead}>
                <div className={styles.previewAv}>{initials}</div>
                <div>
                  <div className={styles.previewName}>{name || 'Ваше имя'} {lname}</div>
                  <div className={styles.previewSub}>
                    Инструктор ·{' '}
                    {[
                      disciplines.has('board') && 'Сноуборд',
                      disciplines.has('ski') && 'Горные лыжи',
                    ].filter(Boolean).join(', ') || '—'}
                  </div>
                </div>
              </div>
              <div className={styles.reviewBoxRow}>
                <span>Дисциплина</span>
                <span>
                  {[
                    disciplines.has('board') && 'Сноуборд',
                    disciplines.has('ski') && 'Горные лыжи',
                  ].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
              <div className={styles.reviewBoxRow}>
                <span>С кем</span>
                <span>
                  {[
                    worksAdults  && 'Взрослые',
                    worksKids    && 'Дети',
                    worksGroups  && 'Группы',
                  ].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
              <div className={styles.reviewBoxRow}>
                <span>Уровни</span>
                <span>
                  {[
                    levels.has('beginner')    && 'Новички',
                    levels.has('intermediate') && 'Средний',
                    levels.has('advanced')    && 'Продвинутые',
                    levels.has('freeride')    && 'Фрирайд',
                    worksKids                 && 'Дети',
                  ].filter(Boolean).join(', ') || '—'}
                </span>
              </div>
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
                onClick={handleSave}
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
