-- =============================================================================
-- RPC: create a booking AND its direct chat in one transaction.
--
-- Guarantees no booking without a chat: the INSERT into bookings (overlap trigger
-- may RAISE here) and the INSERT into chats run in the same function invocation =
-- one implicit transaction. If either fails, both roll back. Overlap exceptions
-- (P0001) propagate to the caller, which maps them to SLOT_TAKEN.
--
-- Validation (instructor exists, date horizon, working window, price) stays in
-- the server _lib before this call; here we only do the atomic write.
-- =============================================================================

CREATE OR REPLACE FUNCTION create_booking_with_chat(
  p_instructor_id uuid,
  p_student_id    uuid,
  p_date          date,
  p_start         time,
  p_end           time,
  p_format        text,
  p_price         integer,
  p_commission    integer
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_chat_id uuid;
BEGIN
  INSERT INTO bookings (instructor_id, student_id, date, start_time, end_time, format, status, price, commission)
  VALUES (p_instructor_id, p_student_id, p_date, p_start, p_end, p_format, 'PENDING', p_price, p_commission)
  RETURNING * INTO v_booking;           -- overlap trigger may RAISE → whole tx rolls back

  INSERT INTO chats (booking_id, type)
  VALUES (v_booking.id, 'direct')
  RETURNING id INTO v_chat_id;

  RETURN jsonb_build_object('booking', to_jsonb(v_booking), 'chatId', v_chat_id);
END;
$$;

GRANT EXECUTE ON FUNCTION create_booking_with_chat(uuid, uuid, date, time, time, text, integer, integer) TO service_role;
