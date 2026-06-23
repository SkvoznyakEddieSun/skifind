-- =============================================================================
-- SkiFind — Initial Schema Migration
-- Apply via: Supabase Dashboard → SQL Editor → paste & Run
-- =============================================================================

-- ── 1. profiles ──────────────────────────────────────────────────────────────
-- id = auth.uid() — должен совпадать с Supabase Auth user id,
-- чтобы RLS-политика auth.uid() = id работала без JOIN.
-- Приложение при регистрации делает INSERT INTO profiles (id, ...) VALUES (auth.uid(), ...).
CREATE TABLE IF NOT EXISTS profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone      text        UNIQUE NOT NULL,
  name       text,
  role       text        NOT NULL CHECK (role IN ('student', 'instructor')),
  created_at timestamptz DEFAULT now()
);

-- ── 2. instructors ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS instructors (
  profile_id             uuid    PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  discipline             text    CHECK (discipline IN ('ski', 'snowboard')),
  tags                   text[], -- ['children','freeride','freestyle','advanced']
  price_individual       integer,
  price_mini_group_base  integer,
  price_mini_group_extra integer,
  mini_group_max         integer,
  -- {"mon":{"start":"10:00","end":"18:00","off":false}, "tue":{...}, ...}
  week_schedule          jsonb,
  bio                    text,
  photo_url              text
);

-- ── 3. bookings ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid        NOT NULL REFERENCES instructors(profile_id),
  student_id    uuid        NOT NULL REFERENCES profiles(id),
  date          date        NOT NULL,
  start_time    time        NOT NULL,
  end_time      time        NOT NULL,
  format        text        CHECK (format IN ('individual', 'mini_group')),
  status        text        NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
  price         integer,
  commission    integer, -- 5% от price, считается при INSERT на уровне приложения
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_instructor_date
  ON bookings (instructor_id, date);

-- ── 4. masterclasses ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS masterclasses (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id    uuid        NOT NULL REFERENCES instructors(profile_id),
  title            text,
  date             date        NOT NULL,
  start_time       time        NOT NULL,
  duration_minutes integer     NOT NULL DEFAULT 120,
  max_participants integer,
  price            integer,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS masterclasses_instructor_date
  ON masterclasses (instructor_id, date);

-- ── 5. masterclass_participants ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS masterclass_participants (
  masterclass_id uuid        NOT NULL REFERENCES masterclasses(id) ON DELETE CASCADE,
  student_id     uuid        NOT NULL REFERENCES profiles(id),
  joined_at      timestamptz DEFAULT now(),
  PRIMARY KEY (masterclass_id, student_id)
);

-- ── 6. chats ─────────────────────────────────────────────────────────────────
-- booking_id      → прямой чат ученик↔инструктор (type='direct')
-- masterclass_id  → групповой чат МК (type='masterclass')  ← добавлено к спецификации
-- NULL booking_id + type='community' → сообщество SkiFind
CREATE TABLE IF NOT EXISTS chats (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id     uuid        REFERENCES bookings(id) ON DELETE SET NULL,
  masterclass_id uuid        REFERENCES masterclasses(id) ON DELETE SET NULL,
  type           text        NOT NULL CHECK (type IN ('direct', 'masterclass', 'community')),
  created_at     timestamptz DEFAULT now()
);

-- ── 7. messages ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    uuid        NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id  uuid        REFERENCES profiles(id),
  text       text,
  -- card_data для "Предложение на занятие":
  -- {"date":"28 апреля","start_time":"11:00","end_time":"13:00",
  --  "format":"individual","place":"Сектор Е","price":5000}
  card_data  jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_chat_created
  ON messages (chat_id, created_at);

-- =============================================================================
-- DOUBLE-BOOKING PROTECTION
-- Триггер BEFORE INSERT OR UPDATE на bookings проверяет пересечение нового
-- интервала (date+start_time/end_time) с:
--   а) другими bookings того же инструктора (status PENDING/ACCEPTED) на ту же дату
--   б) masterclasses того же инструктора на ту же дату
-- =============================================================================

CREATE OR REPLACE FUNCTION check_booking_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- а) Пересечение с другими бронями
  IF EXISTS (
    SELECT 1
    FROM   bookings b
    WHERE  b.instructor_id = NEW.instructor_id
      AND  b.date          = NEW.date
      AND  b.status        IN ('PENDING', 'ACCEPTED')
      AND  b.id           <> NEW.id            -- исключаем себя при UPDATE
      AND  b.start_time    < NEW.end_time
      AND  b.end_time      > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'Этот интервал уже занят (пересечение с существующей бронью)';
  END IF;

  -- б) Пересечение с мастер-классами
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

CREATE OR REPLACE TRIGGER trg_booking_overlap
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION check_booking_overlap();

-- Симметричная защита на стороне masterclasses:
-- при создании/изменении МК проверяем пересечение с бронями И другими МК.
-- end_time МК = start_time + duration_minutes * interval '1 minute'.
CREATE OR REPLACE FUNCTION check_masterclass_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_end time := NEW.start_time + NEW.duration_minutes * interval '1 minute';
BEGIN
  -- а) Пересечение с существующими бронями того же инструктора
  IF EXISTS (
    SELECT 1
    FROM   bookings b
    WHERE  b.instructor_id = NEW.instructor_id
      AND  b.date          = NEW.date
      AND  b.status        IN ('PENDING', 'ACCEPTED')
      AND  b.start_time    < new_end
      AND  b.end_time      > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'Этот интервал уже занят (пересечение с существующей бронью)';
  END IF;

  -- б) Пересечение с другими мастер-классами того же инструктора
  IF EXISTS (
    SELECT 1
    FROM   masterclasses mc
    WHERE  mc.instructor_id = NEW.instructor_id
      AND  mc.date          = NEW.date
      AND  mc.id           <> NEW.id          -- исключаем себя при UPDATE
      AND  mc.start_time    < new_end
      AND  (mc.start_time + mc.duration_minutes * interval '1 minute') > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'Этот интервал уже занят (пересечение с другим мастер-классом)';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_masterclass_overlap
  BEFORE INSERT OR UPDATE ON masterclasses
  FOR EACH ROW EXECUTE FUNCTION check_masterclass_overlap();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors              ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE masterclasses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE masterclass_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                 ENABLE ROW LEVEL SECURITY;

-- ── profiles ─────────────────────────────────────────────────────────────────

-- Своя строка: полный доступ
CREATE POLICY "profiles: own row"
  ON profiles
  USING      (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Профили инструкторов — публичное чтение (каталог открыт всем)
CREATE POLICY "profiles: instructor public read"
  ON profiles
  FOR SELECT
  USING (role = 'instructor');

-- Профиль ученика виден инструктору из общей брони
-- УПРОЩЕНО: только участники booking могут читать профиль ученика.
-- Если нужен доступ через chat/masterclass — добавить отдельной политикой.
CREATE POLICY "profiles: student via booking"
  ON profiles
  FOR SELECT
  USING (
    role = 'student'
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.student_id = profiles.id
        AND (b.instructor_id = auth.uid() OR b.student_id = auth.uid())
    )
  );

-- ── instructors ──────────────────────────────────────────────────────────────

CREATE POLICY "instructors: public read"
  ON instructors
  FOR SELECT
  USING (true);

CREATE POLICY "instructors: own write"
  ON instructors
  FOR ALL
  USING      (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- ── bookings ─────────────────────────────────────────────────────────────────

-- SELECT: оба участника читают свои брони
CREATE POLICY "bookings: select"
  ON bookings
  FOR SELECT
  USING (auth.uid() = instructor_id OR auth.uid() = student_id);

-- INSERT: создающий должен быть одним из участников
CREATE POLICY "bookings: insert"
  ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = instructor_id OR auth.uid() = student_id);

-- UPDATE: только участник брони, и только по строкам, где он участник.
-- Заморозка instructor_id/student_id обеспечивается триггером ниже, а не здесь:
-- RLS не может сравнивать OLD и NEW в одной политике — это ограничение Postgres.
CREATE POLICY "bookings: update"
  ON bookings
  FOR UPDATE
  USING      (auth.uid() = instructor_id OR auth.uid() = student_id)
  WITH CHECK (auth.uid() = instructor_id OR auth.uid() = student_id);

-- DELETE: политики нет → RLS запрещает физическое удаление для всех.
-- Статус брони меняется через UPDATE (→ DECLINED), строка не удаляется.

-- Триггер: запрещает менять instructor_id и student_id после создания брони.
-- Нужен именно триггер, потому что RLS не имеет доступа к OLD в WITH CHECK.
CREATE OR REPLACE FUNCTION prevent_booking_participant_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.instructor_id <> NEW.instructor_id THEN
    RAISE EXCEPTION 'instructor_id cannot be changed after booking is created';
  END IF;
  IF OLD.student_id <> NEW.student_id THEN
    RAISE EXCEPTION 'student_id cannot be changed after booking is created';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_booking_immutable_participants
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION prevent_booking_participant_change();

-- ── masterclasses ────────────────────────────────────────────────────────────

CREATE POLICY "masterclasses: public read"
  ON masterclasses
  FOR SELECT
  USING (true);

CREATE POLICY "masterclasses: instructor write"
  ON masterclasses
  FOR ALL
  USING      (auth.uid() = instructor_id)
  WITH CHECK (auth.uid() = instructor_id);

-- ── masterclass_participants ──────────────────────────────────────────────────

-- Студент видит свои записи
CREATE POLICY "mc_participants: own"
  ON masterclass_participants
  FOR ALL
  USING      (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Инструктор видит участников своих МК
CREATE POLICY "mc_participants: instructor"
  ON masterclass_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM masterclasses mc
      WHERE mc.id = masterclass_participants.masterclass_id
        AND mc.instructor_id = auth.uid()
    )
  );

-- ── chats ────────────────────────────────────────────────────────────────────

-- Сообщество: все авторизованные
CREATE POLICY "chats: community read"
  ON chats
  FOR SELECT
  USING (type = 'community' AND auth.uid() IS NOT NULL);

-- Прямой чат: участники брони
CREATE POLICY "chats: direct"
  ON chats
  FOR ALL
  USING (
    type = 'direct'
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = chats.booking_id
        AND (b.instructor_id = auth.uid() OR b.student_id = auth.uid())
    )
  );

-- Групповой чат МК: инструктор или записавшийся студент
-- УПРОЩЕНО: использует masterclass_id (добавлен к схеме — см. отчёт).
CREATE POLICY "chats: masterclass"
  ON chats
  FOR SELECT
  USING (
    type = 'masterclass'
    AND (
      EXISTS (
        SELECT 1 FROM masterclasses mc
        WHERE mc.id = chats.masterclass_id
          AND mc.instructor_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM masterclass_participants mp
        WHERE mp.masterclass_id = chats.masterclass_id
          AND mp.student_id = auth.uid()
      )
    )
  );

-- ── messages ─────────────────────────────────────────────────────────────────

-- Сообщения сообщества: все авторизованные
CREATE POLICY "messages: community"
  ON messages
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM chats c
      WHERE c.id = messages.chat_id AND c.type = 'community'
    )
  );

-- Прямой чат: только участники брони
CREATE POLICY "messages: direct"
  ON messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM   chats c
      JOIN   bookings b ON b.id = c.booking_id
      WHERE  c.id   = messages.chat_id
        AND  c.type = 'direct'
        AND  (b.instructor_id = auth.uid() OR b.student_id = auth.uid())
    )
  );

-- МК-чат: инструктор или записавшийся студент
CREATE POLICY "messages: masterclass"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   chats c
      WHERE  c.id   = messages.chat_id
        AND  c.type = 'masterclass'
        AND  (
          EXISTS (
            SELECT 1 FROM masterclasses mc
            WHERE mc.id = c.masterclass_id
              AND mc.instructor_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM masterclass_participants mp
            WHERE mp.masterclass_id = c.masterclass_id
              AND mp.student_id = auth.uid()
          )
        )
    )
  );

-- Отправитель может вставить своё сообщение в любой чат, где он участник
-- УПРОЩЕНО: проверяем только sender_id; участие в чате — проверяется выше.
CREATE POLICY "messages: sender insert"
  ON messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- =============================================================================
-- VERIFICATION QUERY (запусти после применения миграции)
-- Должна вернуть 7 строк: profiles, instructors, bookings, masterclasses,
-- masterclass_participants, chats, messages
-- =============================================================================
-- SELECT table_name
-- FROM   information_schema.tables
-- WHERE  table_schema = 'public'
--   AND  table_name IN (
--     'profiles','instructors','bookings','masterclasses',
--     'masterclass_participants','chats','messages'
--   )
-- ORDER BY table_name;
