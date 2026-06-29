-- =============================================================================
-- Migration: marketplace overlap model — only ACCEPTED bookings block a slot.
--
-- Before: a new/updated booking was blocked if it overlapped ANY booking with
-- status PENDING or ACCEPTED → two students could never have competing pending
-- requests for the same slot, and the accept→auto-decline flow was impossible.
--
-- Now: the booking↔booking clause blocks only against ACCEPTED bookings.
-- Multiple PENDING requests for the same slot coexist; the instructor confirms
-- one (server auto-declines the overlapping PENDING ones). SLOT_TAKEN on create
-- now means "the slot is already CONFIRMED".
--
-- The booking↔masterclass clause is unchanged (a masterclass is a confirmed
-- event). check_masterclass_overlap is not touched.
-- =============================================================================

CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Проверяем пересечения только когда строка становится активной
  -- (PENDING/ACCEPTED). Перевод в DECLINED/CANCELLED/COMPLETED пропускаем —
  -- иначе авто-отклонение пересекающейся заявки падало бы на только что
  -- подтверждённой брони (её интервал пересекается с отклоняемой).
  IF NEW.status NOT IN ('PENDING', 'ACCEPTED') THEN
    RETURN NEW;
  END IF;

  -- (а) Пересечение с ПОДТВЕРЖДЁННЫМИ бронями (PENDING больше не блокирует —
  --     несколько заявок на слот сосуществуют, инструктор подтверждает одну).
  IF EXISTS (
    SELECT 1
    FROM   bookings b
    WHERE  b.instructor_id = NEW.instructor_id
      AND  b.date          = NEW.date
      AND  b.status        = 'ACCEPTED'
      AND  b.id           <> NEW.id            -- исключаем себя при UPDATE
      AND  b.start_time    < NEW.end_time
      AND  b.end_time      > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'Этот интервал уже занят (пересечение с существующей бронью)';
  END IF;

  -- (б) Пересечение с мастер-классами — без изменений (МК = подтверждённое событие).
  IF EXISTS (
    SELECT 1
    FROM   masterclasses mc
    WHERE  mc.instructor_id = NEW.instructor_id
      AND  mc.date          = NEW.date
      AND  mc.start_time    < NEW.end_time
      AND  (mc.start_time + mc.duration_minutes * interval '1 minute') > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'Этот интервал уже занят (пересечение с мастер-классом)';
  END IF;

  RETURN NEW;
END;
$$;
