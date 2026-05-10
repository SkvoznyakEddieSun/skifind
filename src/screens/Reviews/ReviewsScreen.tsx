import { useState } from 'react';
import styles from './ReviewsScreen.module.css';

type Filter = 'all' | '5' | 'photo' | 'replied';

interface Review {
  initials: string;
  avClass: string;
  name: string;
  meta: string;
  rating: number;
  tags: string[];
  text: string;
  reply?: string;
  hasPhoto: boolean;
}

const REVIEWS: Review[] = [
  {
    initials: 'ТН',
    avClass: 'avMint',
    name: 'Татьяна Новикова',
    meta: '22 апреля · 1 занятие',
    rating: 5,
    tags: ['Подход к детям', 'Терпение', 'Безопасность'],
    text: '«Дочка в восторге! Алексей очень терпеливо объяснял, не торопил. К концу занятия она сама съехала с горки. Спасибо большое!»',
    reply: 'Татьяна, спасибо за отзыв! С Машенькой было одно удовольствие работать — ждём вас на следующих занятиях',
    hasPhoto: false,
  },
  {
    initials: 'КВ',
    avClass: 'avIce',
    name: 'Кирилл Волков',
    meta: '15 апреля · 3 занятия',
    rating: 5,
    tags: ['Понятно объясняет', 'Прогресс'],
    text: '«За три занятия я с уровня "впервые на доске" дошёл до того что катаю красные. Алексей действительно знает как объяснить технику.»',
    hasPhoto: false,
  },
  {
    initials: 'АБ',
    avClass: 'avPurple',
    name: 'Анна Белова',
    meta: '12 апреля · 1 занятие',
    rating: 5,
    tags: ['Чувство юмора', 'Хорошая программа'],
    text: '«Лучшее занятие за весь сезон. Без занудства, по делу, с шутками. Рекомендую всем кто хочет получить удовольствие от обучения.»',
    hasPhoto: false,
  },
  {
    initials: 'МО',
    avClass: 'avStraw',
    name: 'Михаил Орлов',
    meta: '5 апреля · 5 занятий',
    rating: 4,
    tags: ['Пунктуальность'],
    text: '«В целом всё хорошо, но по технике ожидал большего глубже. Возможно мне нужен инструктор который специализируется на продвинутых.»',
    reply: 'Михаил, спасибо за честный отзыв. Передам коллеге Дмитрию — он работает с фрирайдом, вам у него точно будет интересно.',
    hasPhoto: false,
  },
  {
    initials: 'РЕ',
    avClass: 'avCoral',
    name: 'Роман Ефимов',
    meta: '2 апреля · 2 занятия',
    rating: 5,
    tags: ['Терпение', 'Безопасность'],
    text: '«Брали с женой пару занятий перед поездкой. Алексей научил основам так, что сейчас спокойно катаемся на синих трассах. Безопасно и весело.»',
    hasPhoto: false,
  },
  {
    initials: 'СЛ',
    avClass: 'avBlue',
    name: 'Сергей Лебедев',
    meta: '28 марта · 1 занятие',
    rating: 5,
    tags: ['Прогресс'],
    text: '«Профессионал. Заметил проблемы с моей стойкой за пять минут, дал упражнения, к концу занятия я их исправил.»',
    hasPhoto: false,
  },
];

const BARS = [
  { label: '5', pct: 88, count: 42 },
  { label: '4', pct: 10, count: 5 },
  { label: '3', pct: 2,  count: 1 },
  { label: '2', pct: 0,  count: 0 },
  { label: '1', pct: 0,  count: 0 },
];

interface ReviewsScreenProps {
  onBack: () => void;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className={styles.revStars}>
      {'★'.repeat(rating)}
      {rating < 5 && <span className={styles.revStarDim}>{'★'.repeat(5 - rating)}</span>}
    </div>
  );
}

export function ReviewsScreen({ onBack }: ReviewsScreenProps) {
  const [activeFilter, setActiveFilter] = useState<Filter>('all');

  const filtered = REVIEWS.filter(r => {
    if (activeFilter === '5') return r.rating === 5;
    if (activeFilter === 'photo') return r.hasPhoto;
    if (activeFilter === 'replied') return !!r.reply;
    return true;
  });

  const labels: Record<Filter, string> = {
    all: 'Все',
    '5': '5★ только',
    photo: 'С фото',
    replied: 'С ответом',
  };

  return (
    <div className={styles.screen}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.tbRow}>
          <button className={styles.tbBack} onClick={onBack}>‹</button>
          <div>
            <div className={styles.tbTitle}>Отзывы</div>
            <div className={styles.tbSub}>48 отзывов</div>
          </div>
        </div>
      </div>

      <div className={styles.scroll}>
        {/* Summary */}
        <div className={styles.reviewsSummary}>
          <div className={styles.rsRow}>
            <div>
              <div className={styles.rsRatingBig}>4.9</div>
              <div className={styles.rsStars}>★★★★★</div>
              <div className={styles.rsCount}>48 отзывов</div>
            </div>
            <div className={styles.rsBars}>
              {BARS.map(b => (
                <div key={b.label} className={styles.rsBarRow}>
                  <span className={styles.rsBarLabel}>{b.label}</span>
                  <div className={styles.rsBarTrack}>
                    <div className={styles.rsBarFill} style={{ width: `${b.pct}%` }} />
                  </div>
                  <span className={styles.rsBarPct}>{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className={styles.revFilter}>
          {(['all', '5', 'photo', 'replied'] as Filter[]).map(f => (
            <button
              key={f}
              className={`${styles.chip} ${activeFilter === f ? styles.chipActive : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {labels[f]}
            </button>
          ))}
        </div>

        {/* Review list */}
        <div className={styles.revList}>
          {filtered.map((r, i) => (
            <div key={i} className={styles.revItem}>
              <div className={styles.revHead}>
                <div className={`${styles.av} ${styles[r.avClass as keyof typeof styles]}`}>
                  {r.initials}
                </div>
                <div className={styles.revInfo}>
                  <div className={styles.revName}>{r.name}</div>
                  <div className={styles.revMeta}>{r.meta}</div>
                </div>
                <Stars rating={r.rating} />
              </div>
              <div className={styles.revTags}>
                {r.tags.map(tag => (
                  <span key={tag} className={styles.revTag}>{tag}</span>
                ))}
              </div>
              <div className={styles.revText}>{r.text}</div>
              {r.reply && (
                <div className={styles.revReply}>
                  <div className={styles.revReplyHead}>Ответ инструктора</div>
                  <div className={styles.revReplyText}>{r.reply}</div>
                </div>
              )}
            </div>
          ))}
          <div className={styles.revFooter}>
            Показано 6 из 48. Загрузка остальных — после переноса на бэкенд.
          </div>
        </div>
      </div>
    </div>
  );
}
