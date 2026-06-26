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
  // Per-duration individual prices (1h / 1.5h / 2h). null = not set.
  priceIndividual1h: number | null;
  priceIndividual1_5h: number | null;
  priceIndividual2h: number | null;
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
