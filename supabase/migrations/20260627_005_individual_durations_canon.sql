-- =============================================================================
-- Migration: individual-lesson durations → canonical 1h / 2h / 3h / 4h / full-day
--
-- Fixes an earlier wrong model (1h / 1.5h / 2h). The correct model is
-- 1h / 2h / 3h / 4h + full day (a fixed 6h block, priced separately).
--
--   - drop price_individual_1_5h         (the erroneous 1.5h column)
--   - add  price_individual_3h           (3h)
--   - add  price_individual_4h           (4h)
--   - add  price_individual_full_day     (full-day block; duration = 6h, set in
--                                          app code as FULL_DAY_HOURS)
--   - keep price_individual (legacy "from" price) and _1h / _2h as they are
--
-- All new columns nullable (existing rows have no data yet).
-- =============================================================================

ALTER TABLE instructors DROP COLUMN IF EXISTS price_individual_1_5h;

ALTER TABLE instructors ADD COLUMN IF NOT EXISTS price_individual_3h        integer;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS price_individual_4h        integer;
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS price_individual_full_day  integer;
