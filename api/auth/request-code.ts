import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requestCode } from '../_lib/auth';

// Thin Vercel wrapper — no business logic here.
// To migrate to Express: replace (req, res) types and wire into app.post().
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const body = req.body as Record<string, unknown> | undefined;
  const phone = body?.phone;
  if (typeof phone !== 'string' || !phone) {
    return res.status(400).json({ ok: false, error: 'phone is required', code: 'MISSING_PHONE' });
  }

  const result = await requestCode(phone);
  const status = result.ok ? 200 : result.code === 'RATE_LIMITED' ? 429 : 400;
  return res.status(status).json(result);
}
