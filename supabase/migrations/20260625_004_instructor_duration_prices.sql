-- =============================================================================
-- Migration: per-duration prices for individual lessons
--
-- BookSlot offers three individual-lesson durations: 1h / 1.5h / 2h. Until now
-- instructors only had price_individual (a single hourly rate). Add explicit
-- per-duration columns so each duration can be priced independently.
--
-- price_individual is LEFT AS IS for backward compatibility — it still backs the
-- catalog card's "from" price (current reads in listInstructors depend on it).
-- Treat it as the 1h-equivalent; price_individual_1h is the authoritative 1h
-- tariff going forward, price_individual stays in sync for the card.
-- Columns are nullable for now (existing rows have no per-duration data yet).
-- =============================================================================

ALTER TABLE instructors ADD COLUMN IF NOT EXISTS price_individual_1h    integer;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS price_individual_1_5h  integer;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS price_individual_2h    integer;
