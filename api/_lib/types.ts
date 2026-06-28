export interface Profile {
  id: string;
  phone: string;
  name: string | null;
  role: string | null;
  created_at: string;
}

export type RequestCodeResult =
  | { ok: true; devCode: string }
  | { ok: false; error: string; code: string };

export type VerifyResult =
  | { ok: true; token: string; profile: Profile }
  | { ok: false; error: string; code: string };

export type MeResult =
  | { ok: true; profile: Profile }
  | { ok: false; error: string; code: string };

/** Catalog DTO — flat shape from JOIN profiles+instructors. The frontend maps
 *  this into its richer Instructor view-model (initials/colors/level/etc.). */
export interface InstructorDTO {
  id: string;                          // = profiles.id / instructors.profile_id
  name: string | null;
  discipline: 'ski' | 'snowboard' | null;
  tags: string[];
  priceIndividual: number | null;
  // Per-duration individual prices (canon: 1h / 2h / 3h / 4h / full day). null = not set.
  priceIndividual1h: number | null;
  priceIndividual2h: number | null;
  priceIndividual3h: number | null;
  priceIndividual4h: number | null;
  priceIndividualFullDay: number | null;
  priceMiniGroupBase: number | null;
  priceMiniGroupExtra: number | null;
  miniGroupMax: number | null;
  weekSchedule: Record<string, { start: string; end: string; breaks?: { start: string; end: string }[] }> | null;
  bio: string | null;
  photoUrl: string | null;
  // Computed on the server for TODAY (Sheregesh tz), not stored:
  hasFreeToday: boolean;
  nextSlot: string | null;   // "HH:MM" or null
}

export type InstructorsResult =
  | { ok: true; instructors: InstructorDTO[] }
  | { ok: false; error: string; code: string };

// ── Bookings ────────────────────────────────────────────────────────────────

export interface BookingRow {
  id: string;
  instructor_id: string;
  student_id: string;
  date: string;          // YYYY-MM-DD
  start_time: string;    // HH:MM:SS
  end_time: string;
  format: 'individual' | 'mini_group' | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED';
  price: number | null;
  commission: number | null;
  created_at: string;
}

/** Booking as the UI needs it — with the counterparty's name resolved. */
export interface BookingDTO {
  id: string;
  instructorId: string;
  studentId: string;
  date: string;
  startTime: string;     // HH:MM
  endTime: string;       // HH:MM
  format: 'individual' | 'mini_group' | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED';
  price: number | null;
  commission: number | null;
  createdAt: string;
  /** Other party relative to the requester (instructor name for a student's
   *  list, student name for an instructor's list). */
  counterpartyName: string | null;
  counterpartyPhone: string | null;
}

export type CreateBookingResult =
  | { ok: true; booking: BookingDTO }
  | { ok: false; error: string; code: string };

export type BookingsResult =
  | { ok: true; bookings: BookingDTO[] }
  | { ok: false; error: string; code: string };
