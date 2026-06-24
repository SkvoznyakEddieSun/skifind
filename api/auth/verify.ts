import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyCode } from '../_lib/auth';

// Thin Vercel wrapper — no business logic here.
// To migrate to Express: replace (req, res) types and wire into app.post().
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const body = req.body as Record<string, unknown> | undefined;
  const { phone, code } = body ?? {};
  if (typeof phone !== 'string' || !phone || typeof code !== 'string' || !code) {
    return res.status(400).json({ ok: false, error: 'phone and code are required', code: 'MISSING_FIELDS' });
  }

  const result = await verifyCode(phone, code);
  return res.status(result.ok ? 200 : 400).json(result);
}
