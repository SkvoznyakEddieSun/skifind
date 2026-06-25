import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listInstructors } from './_lib/instructors';

// Thin Vercel wrapper — no business logic here.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const result = await listInstructors(req.headers.authorization);
    // ok:false here = auth problem (invalid token) → 401.
    return res.status(result.ok ? 200 : 401).json(result);
  } catch (e) {
    console.error('[api/instructors]', e);
    return res.status(500).json({ ok: false, error: 'Server error', code: 'SERVER_ERROR' });
  }
}
