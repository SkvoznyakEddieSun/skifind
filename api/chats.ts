import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listChats } from './_lib/chats';

// GET /api/chats — direct chats of the current user (with real last-message preview).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    }
    const result = await listChats(req.headers.authorization);
    return res.status(result.ok ? 200 : 401).json(result);
  } catch (e) {
    console.error('[api/chats]', e);
    return res.status(500).json({ ok: false, error: 'Server error', code: 'SERVER_ERROR' });
  }
}
