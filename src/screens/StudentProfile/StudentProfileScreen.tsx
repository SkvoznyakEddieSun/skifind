import styles from './StudentProfileScreen.module.css';
import { getStudentProfile } from './studentData';

const DISC_LABEL: Record<string, string> = {
  board: 'Сноуборд',
  ski:   'Горные лыжи',
};

const DISC_EMOJI: Record<string, string> = {
  board: '🏂',
  ski:   '⛷️',
};

const LEVEL_COLOR: Record<string, string> = {
  'Новичок':     styles.lvlBeginner,
  'Средний':     styles.lvlInter,
  'Продвинутый': styles.lvlAdv,
};

interface StudentProfileScreenProps {
  studentId: string;
  onBack:    () => void;
  onChat:    () => void;
}

export function StudentProfileScreen({ studentId, onBack, onChat }: StudentProfileScreenProps) {
  const profile = getStudentProfile(studentId);

  if (!profile) {
    return (
      <div className={styles.screen}>
        <div className={styles.topbar}>
          <div className={styles.tbRow}>
            <button className={styles.tbBack} onClick={onBack}>‹</button>
            <div style={{ flex: 1 }}>
              <div className={styles.tbTitle}>Профиль</div>
            </div>
          </div>
        </div>
        <div className={styles.empty}>Профиль не найден</div>
      </div>
    );
  }

  const avgRating =
    profile.history.filter(l => l.rating).length > 0
      ? (
          profile.history.reduce((s, l) => s + (l.rating ?? 0), 0) /
          profile.history.filter(l => l.rating).length
        ).toFixed(1)
      : null;

  return (
    <div className={styles.screen}>
      {/* Header */}
      <div className={styles.topbar}>
        <div className={styles.tbRow}>
          <button className={styles.tbBack} onClick={onBack}>‹</button>
          <div style={{ flex: 1 }}>
            <div className={styles.tbTitle}>Профиль ученика</div>
          </div>
        </div>
      </div>

      <div className={styles.scroll}>
        {/* Hero */}
        <div className={styles.hero}>
          <div className={`${styles.av} ${styles[`av-${profile.avColor}`]}`}>
            {profile.initials}
          </div>
          <div className={styles.heroInfo}>
            <div className={styles.heroName}>{profile.name}</div>
            <div className={styles.heroMeta}>
              <span className={styles.roleChip}>
                {profile.role}
              </span>
              <span className={styles.heroDot}>·</span>
              <span className={styles.heroSince}>с {profile.since}</span>
            </div>
            {profile.phone && (
              <div className={styles.heroPhone}>{profile.phone}</div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statVal}>{profile.history.length}</div>
            <div className={styles.statLabel}>занятий</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statCard}>
            <div className={styles.statVal}>{profile.totalHours}</div>
            <div className={styles.statLabel}>часов</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statCard}>
            <div className={`${styles.statVal} ${styles.statValSmall}`}>
              {profile.level}
            </div>
            <div className={styles.statLabel}>уровень</div>
          </div>
          {avgRating && (
            <>
              <div className={styles.statDivider} />
              <div className={styles.statCard}>
                <div className={styles.statVal}>★ {avgRating}</div>
                <div className={styles.statLabel}>оценка</div>
              </div>
            </>
          )}
        </div>

        {/* Disciplines */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Дисциплина</div>
          <div className={styles.chips}>
            {profile.disciplines.map(d => (
              <span key={d} className={`${styles.chip} ${LEVEL_COLOR[profile.level] ?? ''}`}>
                {d}
              </span>
            ))}
            <span className={`${styles.chip} ${styles.chipLevel}`}>
              {profile.level}
            </span>
          </div>
        </div>

        {/* Instructor notes */}
        {profile.about && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Заметки инструктора <span className={styles.notesHint}>· видите только вы</span></div>
            <div className={styles.notesCard}>{profile.about}</div>
          </div>
        )}

        {/* Lesson history */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>История занятий</div>

          {profile.history.length === 0 ? (
            <div className={styles.noHistory}>Занятий пока не было</div>
          ) : (
            <div className={styles.historyList}>
              {profile.history.map((lesson, idx) => (
                <div key={lesson.id} className={styles.lessonCard}>
                  <div className={styles.lcLeft}>
                    <div className={styles.lcDot} />
                    {idx < profile.history.length - 1 && <div className={styles.lcLine} />}
                  </div>
                  <div className={styles.lcBody}>
                    <div className={styles.lcTop}>
                      <span className={styles.lcDate}>{lesson.date}</span>
                      <span className={styles.lcDisc}>
                        {DISC_EMOJI[lesson.discipline]} {DISC_LABEL[lesson.discipline]}
                      </span>
                      {lesson.rating && (
                        <span className={styles.lcRating}>{'★'.repeat(lesson.rating)}</span>
                      )}
                    </div>
                    <div className={styles.lcTime}>{lesson.timeStart}–{lesson.timeEnd}</div>
                    <div className={styles.lcTopic}>{lesson.topic}</div>
                    {lesson.instructorNote && (
                      <div className={styles.lcNote}>💬 {lesson.instructorNote}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom padding */}
        <div style={{ height: 32 }} />
      </div>

      {/* Bottom action */}
      <div className={styles.bottomBar}>
        <button className={styles.chatBtn} onClick={onChat}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          Написать
        </button>
      </div>
    </div>
  );
}
