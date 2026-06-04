import { useRef, useState } from 'react';
import styles from './ShareModal.module.css';

const CLOSE_THRESHOLD = 100; // px вниз для закрытия

interface ShareModalProps {
  onClose: () => void;
  instructorId?: string;   // e.g. 'aleksey'
  instructorName?: string; // e.g. 'Алексей Морозов'
}

export function ShareModal({ onClose, instructorId = 'aleksey-morozov', instructorName = 'Инструктор' }: ShareModalProps) {
  // slug: 'aleksey' → 'aleksey', или транслитерация имени если id отсутствует
  const slug = instructorId.includes('-') ? instructorId : instructorId;
  const PROFILE_URL = `skifind.app/u/${slug}`;
  const [copied, setCopied] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  function onTouchStart(e: React.TouchEvent) {
    startY.current = e.touches[0].clientY;
    setDragging(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setDragY(delta); // только вниз
  }

  function onTouchEnd() {
    setDragging(false);
    if (dragY >= CLOSE_THRESHOLD) {
      onClose();
    } else {
      setDragY(0);
    }
  }

  function handleCopy() {
    navigator.clipboard?.writeText('https://' + PROFILE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: `${instructorName} — инструктор`, url: 'https://' + PROFILE_URL });
    } else {
      handleCopy();
    }
  }

  const opacity = Math.max(0, 1 - dragY / 300);

  return (
    <div
      className={styles.overlay}
      style={{ opacity }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={sheetRef}
        className={styles.sheet}
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragging ? 'none' : 'transform .3s ease',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={styles.handle} />
        <div className={styles.title}>Поделиться профилем</div>
        <div className={styles.sub}>QR-код или ссылка — отправь ученикам</div>

        {/* QR code — SVG из прототипа 1:1 */}
        <div className={styles.qrBox}>
          <svg className={styles.qrSvg} viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
            <rect width="25" height="25" fill="#fff"/>
            <g fill="#042C53">
              <rect x="0" y="0" width="7" height="7"/><rect x="1" y="1" width="5" height="5" fill="#fff"/><rect x="2" y="2" width="3" height="3"/>
              <rect x="18" y="0" width="7" height="7"/><rect x="19" y="1" width="5" height="5" fill="#fff"/><rect x="20" y="2" width="3" height="3"/>
              <rect x="0" y="18" width="7" height="7"/><rect x="1" y="19" width="5" height="5" fill="#fff"/><rect x="2" y="20" width="3" height="3"/>
              <rect x="9" y="0" width="1" height="1"/><rect x="11" y="0" width="2" height="1"/><rect x="14" y="0" width="1" height="1"/><rect x="16" y="0" width="1" height="1"/>
              <rect x="8" y="1" width="1" height="1"/><rect x="10" y="1" width="1" height="1"/><rect x="13" y="1" width="2" height="1"/><rect x="16" y="1" width="1" height="1"/>
              <rect x="9" y="2" width="2" height="1"/><rect x="12" y="2" width="1" height="1"/><rect x="15" y="2" width="1" height="1"/><rect x="17" y="2" width="1" height="1"/>
              <rect x="8" y="3" width="1" height="1"/><rect x="10" y="3" width="1" height="1"/><rect x="13" y="3" width="1" height="1"/><rect x="16" y="3" width="2" height="1"/>
              <rect x="9" y="4" width="3" height="1"/><rect x="14" y="4" width="2" height="1"/><rect x="17" y="4" width="1" height="1"/>
              <rect x="8" y="5" width="1" height="1"/><rect x="11" y="5" width="2" height="1"/><rect x="15" y="5" width="3" height="1"/>
              <rect x="10" y="6" width="2" height="1"/><rect x="13" y="6" width="1" height="1"/><rect x="16" y="6" width="1" height="1"/>
              <rect x="0" y="8" width="2" height="1"/><rect x="3" y="8" width="2" height="1"/><rect x="7" y="8" width="1" height="1"/><rect x="9" y="8" width="3" height="1"/><rect x="13" y="8" width="1" height="1"/><rect x="16" y="8" width="2" height="1"/><rect x="20" y="8" width="1" height="1"/><rect x="22" y="8" width="3" height="1"/>
              <rect x="1" y="9" width="1" height="1"/><rect x="4" y="9" width="2" height="1"/><rect x="8" y="9" width="2" height="1"/><rect x="12" y="9" width="3" height="1"/><rect x="17" y="9" width="1" height="1"/><rect x="19" y="9" width="2" height="1"/><rect x="23" y="9" width="1" height="1"/>
              <rect x="0" y="10" width="1" height="1"/><rect x="2" y="10" width="3" height="1"/><rect x="6" y="10" width="2" height="1"/><rect x="10" y="10" width="1" height="1"/><rect x="13" y="10" width="2" height="1"/><rect x="17" y="10" width="2" height="1"/><rect x="21" y="10" width="2" height="1"/><rect x="24" y="10" width="1" height="1"/>
              <rect x="1" y="11" width="2" height="1"/><rect x="4" y="11" width="1" height="1"/><rect x="7" y="11" width="3" height="1"/><rect x="11" y="11" width="2" height="1"/><rect x="14" y="11" width="1" height="1"/><rect x="16" y="11" width="2" height="1"/><rect x="19" y="11" width="1" height="1"/><rect x="22" y="11" width="1" height="1"/>
              <rect x="0" y="12" width="2" height="1"/><rect x="3" y="12" width="3" height="1"/><rect x="8" y="12" width="1" height="1"/><rect x="10" y="12" width="2" height="1"/><rect x="13" y="12" width="1" height="1"/><rect x="15" y="12" width="2" height="1"/><rect x="18" y="12" width="1" height="1"/><rect x="20" y="12" width="3" height="1"/><rect x="24" y="12" width="1" height="1"/>
              <rect x="2" y="13" width="1" height="1"/><rect x="4" y="13" width="2" height="1"/><rect x="9" y="13" width="2" height="1"/><rect x="12" y="13" width="2" height="1"/><rect x="16" y="13" width="3" height="1"/><rect x="20" y="13" width="1" height="1"/><rect x="23" y="13" width="1" height="1"/>
              <rect x="0" y="14" width="3" height="1"/><rect x="5" y="14" width="1" height="1"/><rect x="7" y="14" width="2" height="1"/><rect x="11" y="14" width="3" height="1"/><rect x="15" y="14" width="1" height="1"/><rect x="17" y="14" width="2" height="1"/><rect x="20" y="14" width="2" height="1"/><rect x="24" y="14" width="1" height="1"/>
              <rect x="1" y="15" width="2" height="1"/><rect x="4" y="15" width="3" height="1"/><rect x="9" y="15" width="2" height="1"/><rect x="12" y="15" width="1" height="1"/><rect x="14" y="15" width="2" height="1"/><rect x="18" y="15" width="3" height="1"/><rect x="22" y="15" width="2" height="1"/>
              <rect x="0" y="16" width="1" height="1"/><rect x="2" y="16" width="3" height="1"/><rect x="6" y="16" width="2" height="1"/><rect x="10" y="16" width="3" height="1"/><rect x="14" y="16" width="1" height="1"/><rect x="16" y="16" width="1" height="1"/><rect x="18" y="16" width="2" height="1"/><rect x="21" y="16" width="2" height="1"/><rect x="24" y="16" width="1" height="1"/>
              <rect x="8" y="17" width="3" height="1"/><rect x="13" y="17" width="2" height="1"/><rect x="16" y="17" width="3" height="1"/><rect x="22" y="17" width="2" height="1"/>
              <rect x="8" y="18" width="1" height="1"/><rect x="10" y="18" width="2" height="1"/><rect x="13" y="18" width="3" height="1"/><rect x="17" y="18" width="1" height="1"/><rect x="19" y="18" width="2" height="1"/><rect x="22" y="18" width="1" height="1"/><rect x="24" y="18" width="1" height="1"/>
              <rect x="9" y="19" width="2" height="1"/><rect x="12" y="19" width="1" height="1"/><rect x="14" y="19" width="2" height="1"/><rect x="17" y="19" width="3" height="1"/><rect x="21" y="19" width="3" height="1"/>
              <rect x="8" y="20" width="2" height="1"/><rect x="11" y="20" width="3" height="1"/><rect x="15" y="20" width="1" height="1"/><rect x="17" y="20" width="2" height="1"/><rect x="20" y="20" width="1" height="1"/><rect x="22" y="20" width="2" height="1"/>
              <rect x="9" y="21" width="3" height="1"/><rect x="13" y="21" width="2" height="1"/><rect x="16" y="21" width="3" height="1"/><rect x="20" y="21" width="2" height="1"/><rect x="23" y="21" width="2" height="1"/>
              <rect x="8" y="22" width="1" height="1"/><rect x="10" y="22" width="2" height="1"/><rect x="13" y="22" width="1" height="1"/><rect x="15" y="22" width="3" height="1"/><rect x="19" y="22" width="2" height="1"/><rect x="22" y="22" width="1" height="1"/>
              <rect x="9" y="23" width="2" height="1"/><rect x="12" y="23" width="3" height="1"/><rect x="16" y="23" width="2" height="1"/><rect x="20" y="23" width="2" height="1"/><rect x="23" y="23" width="1" height="1"/>
              <rect x="8" y="24" width="3" height="1"/><rect x="13" y="24" width="2" height="1"/><rect x="16" y="24" width="1" height="1"/><rect x="18" y="24" width="3" height="1"/><rect x="22" y="24" width="2" height="1"/>
            </g>
          </svg>
        </div>

        {/* Link row */}
        <div className={styles.linkRow}>
          <span className={styles.linkText}>{PROFILE_URL}</span>
          <button
            className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✓ Скопировано' : 'Копировать'}
          </button>
        </div>

        {/* Share actions */}
        <button className={styles.shareWideBtn} onClick={handleShare}>
          <span>↗</span> Поделиться
        </button>

        <button className={styles.closeBtn} onClick={onClose}>Закрыть</button>
      </div>
    </div>
  );
}
