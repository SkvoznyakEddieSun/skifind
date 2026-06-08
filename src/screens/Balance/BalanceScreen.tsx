import { useRef, useState } from 'react';
import styles from './BalanceScreen.module.css';
import { getAcceptedLessons, getCommission } from '@/store/bookings';

const AMOUNTS = [500, 1000, 2000, 5000];

interface Tx {
  type: 'in' | 'out';
  icon: string;
  title: string;
  meta: string;
  amount: string;
  remainder: string;
  plus: boolean;
}

// Статичная история (финальный остаток = 1 250 ₽ после этих транзакций)
const BASE_BALANCE = 1250;

const STATIC_TRANSACTIONS: Tx[] = [
  { type: 'out', icon: '⚡', title: 'Комиссия за заявку Кирилла Волкова',  meta: '25 апр · занятие 7 000 ₽',  amount: '−350 ₽',  remainder: 'Остаток: 1 250 ₽', plus: false },
  { type: 'out', icon: '⚡', title: 'Комиссия за заявку Татьяны Новиковой', meta: '22 апр · занятие 2 800 ₽', amount: '−140 ₽',  remainder: 'Остаток: 1 600 ₽', plus: false },
  { type: 'in',  icon: '+',  title: 'Пополнение карты *4521',               meta: '20 апр · 13:42',            amount: '+2 000 ₽',remainder: 'Остаток: 1 740 ₽', plus: true  },
  { type: 'out', icon: '⚡', title: 'Комиссия за заявку Романа Матвеева',   meta: '20 апр · занятие 5 000 ₽',  amount: '−250 ₽',  remainder: 'Остаток: −260 ₽',  plus: false },
  { type: 'out', icon: '⚡', title: 'Комиссия за заявку Анны Беловой',      meta: '12 апр · занятие 5 500 ₽',  amount: '−275 ₽',  remainder: 'Остаток: −10 ₽',   plus: false },
];

// IDs уже отражённых в статике уроков (чтобы не дублировать)
const STATIC_LESSON_IDS = new Set(['l1', 'l2']);

function buildTransactions(): { txs: Tx[]; balance: number } {
  // Новые принятые уроки — те что не в статике
  const newLessons = getAcceptedLessons('aleksey')
    .filter(b => !STATIC_LESSON_IDS.has(b.id));

  let balance = BASE_BALANCE;
  const newTxs: Tx[] = newLessons.map(b => {
    const comm = getCommission(b.price);
    balance -= comm;
    return {
      type:      'out',
      icon:      '⚡',
      title:     `Комиссия за заявку ${b.studentName}`,
      meta:      `${b.dayNum} ${b.dayMon} · занятие ${b.price.toLocaleString('ru')} ₽`,
      amount:    `−${comm.toLocaleString('ru')} ₽`,
      remainder: `Остаток: ${balance.toLocaleString('ru')} ₽`,
      plus:      false,
    };
  });

  return { txs: [...newTxs, ...STATIC_TRANSACTIONS], balance };
}

interface BalanceScreenProps {
  onBack: () => void;
}

function TopupModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState(1000);
  const [custom, setCustom] = useState('');
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [success, setSuccess] = useState(false);
  const startY = useRef(0);

  const activeAmount = custom ? Number(custom) : selected;

  function onTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
    setDragging(true);
  }
  function onTouchMove(e: React.TouchEvent) {
    const d = e.touches[0].clientY - startY.current;
    if (d > 0) setDragY(d);
  }
  function onTouchEnd() {
    setDragging(false);
    if (dragY >= 100) onClose();
    else setDragY(0);
  }

  return (
    <div
      className={styles.overlay}
      style={{ opacity: Math.max(0, 1 - dragY / 300) }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={styles.sheet}
        style={{ transform: `translateY(${dragY}px)`, transition: dragging ? 'none' : 'transform .3s ease' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={styles.sheetHandle} />
        <div className={styles.sheetTitle}>Пополнить баланс</div>
        <div className={styles.sheetSub}>Минимальная сумма пополнения 500 ₽</div>

        <div className={styles.amountGrid}>
          {AMOUNTS.map(a => (
            <button
              key={a}
              className={`${styles.amountBtn} ${selected === a && !custom ? styles.amountBtnSelected : ''}`}
              onClick={() => { setSelected(a); setCustom(''); }}
            >
              {a.toLocaleString('ru')} ₽
            </button>
          ))}
        </div>

        <div className={styles.customWrap}>
          <input
            type="number"
            className="input-field"
            placeholder="Другая сумма"
            value={custom}
            onChange={e => { setCustom(e.target.value); }}
          />
          <div className={styles.customMin}>При сумме меньше 500 ₽ пополнение недоступно</div>
        </div>

        {success ? (
          <div className={styles.successMsg}>✓ Баланс пополнен на {activeAmount.toLocaleString('ru')} ₽</div>
        ) : (
          <button
            className={styles.btnPrimary}
            disabled={activeAmount < 500}
            style={activeAmount < 500 ? { opacity: .4 } : undefined}
            onClick={() => { setSuccess(true); setTimeout(onClose, 1500); }}
          >
            Пополнить на {activeAmount.toLocaleString('ru')} ₽
          </button>
        )}
        <button className={styles.btnSecondary} onClick={onClose}>Отмена</button>
      </div>
    </div>
  );
}

export function BalanceScreen({ onBack }: BalanceScreenProps) {
  const { txs, balance } = buildTransactions();
  const [transactions] = useState<Tx[]>(txs);
  const currentBalance = balance;

  const [showTopup, setShowTopup] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className={styles.screen}>
      {showTopup && <TopupModal onClose={() => setShowTopup(false)} />}

      {/* Topbar */}
      <div className={styles.topbar}>
        <div className={styles.tbRow}>
          <button className={styles.tbBack} onClick={onBack}>‹</button>
          <div>
            <div className={styles.tbTitle}>Баланс</div>
            <div className={styles.tbSub}>Комиссия 5% за заявки с платформы</div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroLabel}>Текущий баланс</div>
        <div className={styles.heroAmount}>{currentBalance.toLocaleString('ru')} ₽</div>
        <div className={styles.heroSub}>
          {currentBalance >= 0
            ? `Хватит на ~${Math.floor(currentBalance / 350)} заявки со средним чеком`
            : 'Пополните баланс для приёма новых заявок'}
        </div>
        <div className={styles.heroActions}>
          <button className={`${styles.heroBtn} ${styles.heroBtnPrimary}`} onClick={() => setShowTopup(true)}>
            + Пополнить
          </button>
          <button className={styles.heroBtn} onClick={() => showToast('⚙ Автопополнение — скоро в этом разделе')}>⚙ Автопополнение</button>
        </div>
      </div>

      {/* Scroll */}
      <div className={styles.scroll}>
        <div className={styles.histHead}>
          <div className={styles.histHeadRow}>
            <div className={styles.secLabel}>История за апрель</div>
            <button className={styles.downloadBtn} onClick={() => showToast('📄 Чеки отправлены на email')}>Скачать чеки</button>
          </div>
          <div className={styles.histMetrics}>
            <div className={styles.metric}>
              <div className={`${styles.metricVal} ${styles.metricValMinus}`}>
                −{transactions.filter(t => !t.plus).reduce((s, t) => s + parseInt(t.amount.replace(/[^0-9]/g, '')), 0).toLocaleString('ru')}
              </div>
              <div className={styles.metricLbl}>₽ комиссии</div>
            </div>
            <div className={styles.metric}>
              <div className={`${styles.metricVal} ${styles.metricValPlus}`}>+2 000</div>
              <div className={styles.metricLbl}>₽ пополнения</div>
            </div>
          </div>
        </div>

      {toast && <div className={styles.toast}>{toast}</div>}

        <div className={styles.txList}>
          {transactions.map((tx, i) => (
            <div key={i} className={styles.txItem}>
              <div className={`${styles.txIcon} ${tx.type === 'in' ? styles.txIn : styles.txOut}`}>
                {tx.icon}
              </div>
              <div className={styles.txInfo}>
                <div className={styles.txTitle}>{tx.title}</div>
                <div className={styles.txMeta}>{tx.meta}</div>
              </div>
              <div className={styles.txRight}>
                <div className={`${styles.txAmount} ${tx.plus ? styles.txPlus : styles.txMinus}`}>
                  {tx.amount}
                </div>
                <div className={styles.txRemainder}>{tx.remainder}</div>
              </div>
            </div>
          ))}
          <div className={styles.txFooter}>Это все операции за апрель</div>
        </div>
      </div>
    </div>
  );
}
