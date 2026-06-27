-- =============================================================================
-- Migration: canonical booking statuses
--
-- Lifecycle: PENDING → ACCEPTED → COMPLETED
--   branches: DECLINED  (instructor rejected a PENDING request)
--             CANCELLED (an already-ACCEPTED booking was cancelled)
--
-- Widens bookings.status CHECK from ('PENDING','ACCEPTED','DECLINED') to
-- ('PENDING','ACCEPTED','DECLINED','CANCELLED','COMPLETED').
-- (NONE is a frontend chat UI state, not a DB row status — not added here.)
--
-- The overlap trigger (check_booking_overlap) is intentionally NOT changed —
-- see the note below for why CANCELLED/COMPLETED must stay non-blocking.
-- =============================================================================

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'COMPLETED'));
