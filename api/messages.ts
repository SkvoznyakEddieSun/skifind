import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listMessages, sendMessage } from './_lib/messages';

function statusForCode(code: string): number {
  switch (code) {
    case 'UNAUTHORIZED':  return 401;
    case 'FORBIDDEN':     return 403;
    case 'NOT_FOUND':     return 404;
    case 'PHONE_BLOCKED': return 422;
    default:              return 400;
  }
}

// GET  /api/messages?chatId=…&since=ISO  — chat history (since → only newer)
// POST /api/messages  { chatId, text }   — send a message
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const auth = req.headers.authorization;
    if (req.method === 'GET') {
      const chatId = String(req.query.chatId ?? '');
      const since  = req.query.since ? String(req.query.since) : undefined;
      const result = await listMessages(auth, chatId, since);
      return res.status(result.ok ? 200 : statusForCode(result.code)).json(result);
    }
    if (req.method === 'POST') {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const result = await sendMessage(auth, String(body.chatId ?? ''), String(body.text ?? ''));
      return res.status(result.ok ? 201 : statusForCode(result.code)).json(result);
    }
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  } catch (e) {
    console.error('[api/messages]', e);
    return res.status(500).json({ ok: false, error: 'Server error', code: 'SERVER_ERROR' });
  }
}
