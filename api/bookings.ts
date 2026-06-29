import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createBooking, listBookings, acceptBookingRequest, declineBookingRequest,
} from './_lib/bookings';

// Thin Vercel wrapper — no business logic here.
// POST branches on body.action: 'accept' | 'decline' | (none) → create.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const result = await listBookings(req.headers.authorization);
      return res.status(result.ok ? 200 : 401).json(result);
    }
    if (req.method === 'POST') {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const auth = req.headers.authorization;

      if (body.action === 'accept') {
        const result = await acceptBookingRequest(auth, String(body.bookingId ?? ''));
        return res.status(result.ok ? 200 : statusForCode(result.code)).json(result);
      }
      if (body.action === 'decline') {
        const result = await declineBookingRequest(auth, String(body.bookingId ?? ''));
        return res.status(result.ok ? 200 : statusForCode(result.code)).json(result);
      }

      const result = await createBooking(auth, body);
      return res.status(result.ok ? 201 : statusForCode(result.code)).json(result);
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
    case 'FORBIDDEN':            return 403;
    case 'NOT_FOUND':            return 404;
    case 'INSTRUCTOR_NOT_FOUND': return 404;
    case 'NOT_PENDING':          return 409;
    case 'SLOT_TAKEN':           return 409;
    case 'SLOT_ALREADY_ACCEPTED': return 409;
    default:                     return 400;   // validation errors
  }
}
