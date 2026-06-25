import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMe } from '../_lib/auth';

// Thin Vercel wrapper — no business logic here.
// To migrate to Express: replace (req, res) types and wire into app.get().
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const result = await getMe(req.headers.authorization);
    // ok:false here = auth problem (bad/expired token, profile gone) → 401.
    return res.status(result.ok ? 200 : 401).json(result);
  } catch (e) {
    // Infra problem (DB down, misconfig) → 500. Client treats as degraded,
    // NOT a logout.
    console.error('[api/auth/me]', e);
    return res.status(500).json({ ok: false, error: 'Server error', code: 'SERVER_ERROR' });
  }
}
