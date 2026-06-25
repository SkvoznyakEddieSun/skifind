import { getDb } from './db';
import { verifyToken } from './auth';
import type { InstructorsResult, InstructorDTO } from './types';

/**
 * Public catalog list — every profile that has an instructors row (i.e. an
 * actually set-up instructor), joined with profiles for the name.
 *
 * Reading is public to any logged-in user, but a valid JWT is still required
 * (login is mandatory for everyone). Invalid token → ok:false → caller maps 401.
 * DB problems throw → wrapper returns 500.
 */
export async function listInstructors(authHeader: string | undefined): Promise<InstructorsResult> {
  const auth = verifyToken(authHeader);
  if (!auth) return { ok: false, error: 'Требуется авторизация', code: 'UNAUTHORIZED' };

  const db = getDb();
  // inner join on profiles → only instructors whose profile exists.
  const { data, error } = await db
    .from('instructors')
    .select(
      'profile_id, discipline, tags, price_individual, price_mini_group_base, ' +
      'price_mini_group_extra, mini_group_max, week_schedule, bio, photo_url, ' +
      'profiles!inner(name)'
    );

  if (error) {
    console.error('[listInstructors] db error:', error);
    throw new Error('DB error reading instructors');
  }

  // supabase-js infers a parser type for embedded selects without generated DB
  // types — cast rows to a plain record shape before mapping.
  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const instructors: InstructorDTO[] = rows.map((row) => {
    const profile = row.profiles as { name: string | null } | null;
    return {
      id:                  row.profile_id as string,
      name:                profile?.name ?? null,
      discipline:          (row.discipline as InstructorDTO['discipline']) ?? null,
      tags:                (row.tags as string[] | null) ?? [],
      priceIndividual:     (row.price_individual as number | null) ?? null,
      priceMiniGroupBase:  (row.price_mini_group_base as number | null) ?? null,
      priceMiniGroupExtra: (row.price_mini_group_extra as number | null) ?? null,
      miniGroupMax:        (row.mini_group_max as number | null) ?? null,
      weekSchedule:        (row.week_schedule as InstructorDTO['weekSchedule']) ?? null,
      bio:                 (row.bio as string | null) ?? null,
      photoUrl:            (row.photo_url as string | null) ?? null,
    };
  });

  return { ok: true, instructors };
}
