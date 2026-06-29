-- =============================================================================
-- Migration: accept_booking_tx — guard against confirming over an ACCEPTED slot.
--
-- Symmetric to create: you cannot ACCEPT a request whose interval overlaps an
-- already-ACCEPTED booking of the same instructor (same date, start<other_end
-- AND end>other_start). Returns code SLOT_ALREADY_ACCEPTED in that case.
--
-- Still atomic: target row locked FOR UPDATE; the guard, the accept and the
-- auto-decline of overlapping PENDING run in one transaction.
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

  -- Guard: no other ACCEPTED booking may overlap this interval (symmetric to create).
  IF EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.instructor_id = v_booking.instructor_id
      AND b.date          = v_booking.date
      AND b.status        = 'ACCEPTED'
      AND b.id           <> p_booking_id
      AND b.start_time    < v_booking.end_time
      AND b.end_time      > v_booking.start_time
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'SLOT_ALREADY_ACCEPTED');
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
