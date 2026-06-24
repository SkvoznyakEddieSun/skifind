-- =============================================================================
-- Migration: restore strict role on profiles
--
-- WHY: migration 002 dropped NOT NULL on profiles.role to let login create a
--   profile before onboarding picked a role. New decision: every new user is a
--   'student' by default; 'instructor' is granted manually later. So role goes
--   back to NOT NULL, with a DEFAULT so login INSERTs don't need to pass it.
--
-- The CHECK (role IN ('student','instructor')) constraint already exists from
-- migration 001 — not touched here.
-- =============================================================================

-- Backfill any null rows created during step-1 testing
UPDATE profiles SET role = 'student' WHERE role IS NULL;

ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'student';
ALTER TABLE profiles ALTER COLUMN role SET NOT NULL;
