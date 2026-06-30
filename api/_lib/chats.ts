import { getDb } from './db';
import { verifyToken } from './auth';
import { rowToDTO } from './bookings';
import type { BookingRow, ChatsResult, ChatListItemDTO } from './types';

function err(code: string, error: string): { ok: false; error: string; code: string } {
  return { ok: false, error, code };
}

/**
 * Direct-чаты текущего пользователя (он — участник брони, к которой привязан чат).
 * Для каждого: реальное последнее сообщение (превью), бронь (имя собеседника +
 * статус-бейдж + данные карточки). Сортировка — по времени последнего сообщения
 * (свежие сверху); чаты без сообщений падают на created_at чата (новая бронь,
 * ещё не писали — наверху как свежая). unread не считаем (нет модели read-receipts
 * — отдельная будущая фича).
 */
export async function listChats(authHeader: string | undefined): Promise<ChatsResult> {
  const auth = verifyToken(authHeader);
  if (!auth) return err('UNAUTHORIZED', 'Требуется авторизация');

  const db = getDb();
  const asInstructor = auth.role === 'instructor';
  const col = asInstructor ? 'instructor_id' : 'student_id';

  // Брони пользователя → их direct-чаты.
  const { data: bks, error: bErr } = await db.from('bookings').select('*').eq(col, auth.userId);
  if (bErr) { console.error('[listChats] bookings error:', bErr); throw new Error('DB error reading bookings'); }
  const bookings = (bks ?? []) as BookingRow[];
  if (bookings.length === 0) return { ok: true, chats: [] };

  const bookingById = new Map(bookings.map(b => [b.id, b]));
  const { data: chs, error: cErr } = await db
    .from('chats')
    .select('id, booking_id, created_at')
    .eq('type', 'direct')
    .in('booking_id', bookings.map(b => b.id));
  if (cErr) { console.error('[listChats] chats error:', cErr); throw new Error('DB error reading chats'); }
  const chats = (chs ?? []) as { id: string; booking_id: string; created_at: string }[];
  if (chats.length === 0) return { ok: true, chats: [] };

  // Последнее сообщение на чат (одним запросом, затем reduce).
  const chatIds = chats.map(c => c.id);
  const { data: msgs, error: mErr } = await db
    .from('messages')
    .select('chat_id, text, created_at')
    .in('chat_id', chatIds)
    .order('created_at', { ascending: false });
  if (mErr) { console.error('[listChats] messages error:', mErr); throw new Error('DB error reading messages'); }
  const lastByChat = new Map<string, { text: string | null; created_at: string }>();
  for (const m of (msgs ?? []) as { chat_id: string; text: string | null; created_at: string }[]) {
    if (!lastByChat.has(m.chat_id)) lastByChat.set(m.chat_id, { text: m.text, created_at: m.created_at });
  }

  // Имена/телефоны собеседников (вторая сторона относительно зрителя).
  const otherIds = [...new Set(bookings.map(b => asInstructor ? b.student_id : b.instructor_id))];
  const profById = new Map<string, { name: string | null; phone: string | null }>();
  const { data: profs, error: pErr } = await db.from('profiles').select('id, name, phone').in('id', otherIds);
  if (pErr) { console.error('[listChats] profiles error:', pErr); throw new Error('DB error reading profiles'); }
  for (const p of (profs ?? []) as { id: string; name: string | null; phone: string | null }[]) {
    profById.set(p.id, { name: p.name, phone: p.phone });
  }

  const items: ChatListItemDTO[] = chats.map(c => {
    const b = bookingById.get(c.booking_id)!;
    const cp = profById.get(asInstructor ? b.student_id : b.instructor_id);
    const last = lastByChat.get(c.id);
    return {
      chatId: c.id,
      lastMessageText: last?.text ?? null,
      lastMessageAt: last?.created_at ?? null,
      booking: rowToDTO(b, cp?.name ?? null, cp?.phone ?? null, c.id),
      // created_at чата для сортировки чатов без сообщений (не входит в DTO):
      _sortKey: last?.created_at ?? c.created_at,
    } as ChatListItemDTO & { _sortKey: string };
  });

  items.sort((a, b) =>
    ((b as ChatListItemDTO & { _sortKey: string })._sortKey).localeCompare((a as ChatListItemDTO & { _sortKey: string })._sortKey));
  // убираем служебное поле сортировки
  return { ok: true, chats: items.map(({ ...rest }) => { delete (rest as { _sortKey?: string })._sortKey; return rest; }) };
}
