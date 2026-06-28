/**
 * Каноническая модель статусов брони — единый источник для всего фронта.
 * Значения совпадают с bookings.status в БД (верхний регистр).
 *
 * Жизненный цикл: PENDING → ACCEPTED → COMPLETED
 *   ветки: DECLINED (инструктор отклонил заявку из PENDING),
 *          CANCELLED (отмена уже ACCEPTED брони).
 */
export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED';

/**
 * Статус в контексте чата = канон + UI-состояние «брони нет / режим превью».
 * NONE — это НЕ статус строки bookings, только состояние экрана чата.
 */
export type ChatBookingStatus = BookingStatus | 'NONE';

/**
 * Русская подпись статуса (для бейджей/лейблов).
 * Значение статуса (канон) и его отображаемая подпись — разные вещи:
 * напр. ACCEPTED → «Подтверждено» (раньше для этого был отдельный статус
 * 'confirmed', теперь его нет как значения — только как текст здесь).
 */
export function statusLabel(status: BookingStatus): string {
  switch (status) {
    case 'PENDING':   return '⏳ Ожидает подтверждения';
    case 'ACCEPTED':  return '● Подтверждено';
    case 'COMPLETED': return '✓ Завершено';
    case 'CANCELLED': return '✕ Отменено';
    case 'DECLINED':  return '✕ Отклонено';
  }
}
