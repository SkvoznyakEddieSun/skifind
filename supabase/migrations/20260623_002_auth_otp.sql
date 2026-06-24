-- =============================================================================
-- Migration: OTP codes table + drop auth.users FK on profiles.id
--
-- WHY the FK drop:
--   profiles.id was REFERENCES auth.users(id) — designed for Supabase Auth where
--   every user is first registered in auth.users. We now use our own JWT auth and
--   never touch auth.users, so inserting a profile would require creating an
--   auth.users row via the admin API first. Removing the FK lets profiles.id be
--   a plain gen_random_uuid() — simpler, and our server-side service_role key
--   bypasses RLS anyway, so losing auth.uid() in RLS policies has no effect on
--   server-originated writes.
-- =============================================================================

-- ── 1. Fix profiles table for own-auth ───────────────────────────────────────
-- Drop FK → auth.users (no longer using Supabase Auth)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
-- Allow role=null: new users exist without a role until onboarding step assigns one
ALTER TABLE profiles ALTER COLUMN role DROP NOT NULL;
-- Grants for service_role (bypasses RLS but still needs table privileges)
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.profiles, public.instructors, public.bookings,
  public.masterclasses, public.masterclass_participants,
  public.chats, public.messages
TO service_role;

-- ── 2. otp_codes ─────────────────────────────────────────────────────────────
-- PRIMARY KEY (phone) = one row per phone; INSERT … ON CONFLICT DO UPDATE
-- overwrites the old code when a new one is requested.
CREATE TABLE IF NOT EXISTS otp_codes (
  phone      text        NOT NULL,
  code       text        NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (phone)
);

-- Used for periodic cleanup of expired rows (optional cron job later).
CREATE INDEX IF NOT EXISTS otp_codes_expires_at ON otp_codes (expires_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.otp_codes TO service_role;
