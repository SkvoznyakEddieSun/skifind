-- =============================================================================
-- RPC: accept a booking + auto-decline overlapping PENDING ones, atomically.
--
-- A single function invocation runs in one implicit transaction, so the accept
-- and the cascade of auto-declines either all commit or all roll back — no race
-- where a slot ends up double-accepted. The target row is locked FOR UPDATE to
-- serialise concurrent accepts of the same booking.
--
-- Auth (instructor ownership) and the PENDING precondition are enforced INSIDE
-- the function so they're part of the same transaction. The server passes the
-- caller's JWT userId as p_instructor_id (never trusted from the body).
--
-- Overlap rule mirrors check_booking_overlap: same instructor, same date,
-- start < other_end AND end > other_start. Non-overlapping PENDING are untouched.
-- Returns JSON: { ok, code?, declinedIds[] }.
-- =============================================================================

CREATE OR REPLACE FUNCTION accept_booking_tx(p_booking_id uuid, p_instructor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking  bookings%ROWTYPE;
  v_declined uuid[];
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;
  IF v_booking.instructor_id <> p_instructor_id THEN
    RETURN jsonb_build_object('ok', false, 'code', 'FORBIDDEN');
  END IF;
  IF v_booking.status <> 'PENDING' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_PENDING');
  END IF;

  UPDATE bookings SET status = 'ACCEPTED' WHERE id = p_booking_id;

  WITH declined AS (
    UPDATE bookings b
       SET status = 'DECLINED'
     WHERE b.instructor_id = v_booking.instructor_id
       AND b.date          = v_booking.date
       AND b.status        = 'PENDING'
       AND b.id           <> p_booking_id
       AND b.start_time    < v_booking.end_time
       AND b.end_time      > v_booking.start_time
     RETURNING b.id
  )
  SELECT array_agg(id) INTO v_declined FROM declined;

  RETURN jsonb_build_object(
    'ok', true,
    'declinedIds', COALESCE(to_jsonb(v_declined), '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION accept_booking_tx(uuid, uuid) TO service_role;
