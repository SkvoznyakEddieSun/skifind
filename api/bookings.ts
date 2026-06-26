import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createBooking, listBookings } from './_lib/bookings';

// Thin Vercel wrapper — no business logic here.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const result = await listBookings(req.headers.authorization);
      return res.status(result.ok ? 200 : 401).json(result);
    }
    if (req.method === 'POST') {
      const result = await createBooking(req.headers.authorization, (req.body ?? {}) as Record<string, unknown>);
      if (result.ok) return res.status(201).json(result);
      return res.status(statusForCode(result.code)).json(result);
    }
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  } catch (e) {
    console.error('[api/bookings]', e);
    return res.status(500).json({ ok: false, error: 'Server error', code: 'SERVER_ERROR' });
  }
}

function statusForCode(code: string): number {
  switch (code) {
    case 'UNAUTHORIZED':         return 401;
    case 'INSTRUCTOR_NOT_FOUND': return 404;
    case 'SLOT_TAKEN':           return 409;
    default:                     return 400;   // validation errors
  }
}
