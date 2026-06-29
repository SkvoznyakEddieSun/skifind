import { getDb } from './db';
import { verifyToken } from './auth';
import type { MessageRow, MessageDTO, MessagesResult, SendMessageResult } from './types';

function err(code: string, error: string): { ok: false; error: string; code: string } {
  return { ok: false, error, code };
}

/**
 * Российский телефон в тексте (зеркало фронтового hasPhone).
 * 10 цифр с 9 / 11 цифр с 7|8 внутри «числоподобного» куска.
 */
function hasPhone(text: string): boolean {
  const chunks = text.match(/[\+\d][\d\s\-()\.]{6,18}\d/g) ?? [];
  return chunks.some(chunk => {
    const d = chunk.replace(/\D/g, '');
    return (d.length === 10 && d[0] === '9') || (d.length === 11 && (d[0] === '7' || d[0] === '8'));
  });
}

function rowToDTO(m: MessageRow): MessageDTO {
  return {
    id: m.id,
    senderId: m.sender_id,
    text: m.text,
    cardData: m.card_data,
    createdAt: m.created_at,
  };
}

interface ChatBooking {
  bookingId: string;
  studentId: string;
  instructorId: string;
  status: string;
}

/**
 * Resolve the chat's booking and verify the caller is a participant
 * (the booking's student or instructor). Returns the booking context or an
 * error code (NOT_FOUND / FORBIDDEN).
 */
async function resolveParticipant(
  db: ReturnType<typeof getDb>,
  chatId: string,
  userId: string,
): Promise<{ ok: true; ctx: ChatBooking } | { ok: false; code: 'NOT_FOUND' | 'FORBIDDEN' }> {
  const { data: chat, error: cErr } = await db
    .from('chats').select('booking_id, type').eq('id', chatId).maybeSingle();
  if (cErr) { console.error('[messages] chat error:', cErr); throw new Error('DB error reading chat'); }
  if (!chat) return { ok: false, code: 'NOT_FOUND' };

  const bookingId = (chat as { booking_id: string | null }).booking_id;
  if (!bookingId) return { ok: false, code: 'NOT_FOUND' };   // non-direct chat (МК/community) — не этот шаг

  const { data: bk, error: bErr } = await db
    .from('bookings').select('id, student_id, instructor_id, status').eq('id', bookingId).maybeSingle();
  if (bErr) { console.error('[messages] booking error:', bErr); throw new Error('DB error reading booking'); }
  if (!bk) return { ok: false, code: 'NOT_FOUND' };

  const b = bk as { id: string; student_id: string; instructor_id: string; status: string };
  if (b.student_id !== userId && b.instructor_id !== userId) return { ok: false, code: 'FORBIDDEN' };

  return { ok: true, ctx: { bookingId: b.id, studentId: b.student_id, instructorId: b.instructor_id, status: b.status } };
}

/**
 * Messages of a chat, oldest first. `since` (ISO created_at) → only newer ones
 * (for polling). Only a chat participant may read (else 403).
 */
export async function listMessages(authHeader: string | undefined, chatId: string, since?: string): Promise<MessagesResult> {
  const auth = verifyToken(authHeader);
  if (!auth) return err('UNAUTHORIZED', 'Требуется авторизация');
  if (!chatId) return err('INVALID_BODY', 'Не указан чат');

  const db = getDb();
  const part = await resolveParticipant(db, chatId, auth.userId);
  if (!part.ok) return err(part.code, part.code === 'FORBIDDEN' ? 'Нет доступа к этому чату' : 'Чат не найден');

  let q = db.from('messages').select('*').eq('chat_id', chatId).order('created_at', { ascending: true });
  if (since) q = q.gt('created_at', since);
  const { data, error } = await q;
  if (error) { console.error('[listMessages] error:', error); throw new Error('DB error reading messages'); }

  return { ok: true, messages: ((data ?? []) as MessageRow[]).map(rowToDTO) };
}

/**
 * Send a text message. sender_id = JWT userId (never the body). Only participants.
 * Phone rule (mirrors the client): a message containing a phone number is blocked
 * until the booking is ACCEPTED (instructor's contact is revealed only after
 * confirmation).
 */
export async function sendMessage(authHeader: string | undefined, chatId: string, text: string): Promise<SendMessageResult> {
  const auth = verifyToken(authHeader);
  if (!auth) return err('UNAUTHORIZED', 'Требуется авторизация');
  if (!chatId) return err('INVALID_BODY', 'Не указан чат');
  const body = (text ?? '').trim();
  if (!body) return err('INVALID_BODY', 'Пустое сообщение');

  const db = getDb();
  const part = await resolveParticipant(db, chatId, auth.userId);
  if (!part.ok) return err(part.code, part.code === 'FORBIDDEN' ? 'Нет доступа к этому чату' : 'Чат не найден');

  if (hasPhone(body) && part.ctx.status !== 'ACCEPTED') {
    return err('PHONE_BLOCKED', 'Номер телефона можно отправить только после подтверждения брони');
  }

  const { data, error } = await db
    .from('messages')
    .insert({ chat_id: chatId, sender_id: auth.userId, text: body })
    .select()
    .single();
  if (error) { console.error('[sendMessage] insert error:', error); throw new Error('DB error sending message'); }

  return { ok: true, message: rowToDTO(data as MessageRow) };
}
