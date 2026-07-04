-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(255) NOT NULL,
  email                VARCHAR(255) UNIQUE NOT NULL,
  password             TEXT NOT NULL,
  role                 VARCHAR(20) NOT NULL CHECK (role IN ('patient','doctor','admin')),
  phone                VARCHAR(20),
  google_refresh_token TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DOCTORS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialisation VARCHAR(100) NOT NULL,
  slot_duration  INTEGER NOT NULL DEFAULT 30,
  work_start     TIME NOT NULL DEFAULT '09:00',
  work_end       TIME NOT NULL DEFAULT '17:00',
  work_days      INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  bio            TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─── DOCTOR LEAVES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_leaves (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id   UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  leave_date  DATE NOT NULL,
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, leave_date)
);

-- ─── SLOTS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS slots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id   UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'available'
              CHECK (status IN ('available','held','booked','cancelled')),
  held_until  TIMESTAMPTZ,
  held_by     UUID REFERENCES users(id),
  UNIQUE(doctor_id, start_time)
);

CREATE INDEX IF NOT EXISTS idx_slots_doctor_status ON slots(doctor_id, status);
CREATE INDEX IF NOT EXISTS idx_slots_start_time    ON slots(start_time);

-- ─── APPOINTMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id            UUID NOT NULL REFERENCES slots(id),
  patient_id         UUID NOT NULL REFERENCES users(id),
  doctor_id          UUID NOT NULL REFERENCES doctors(id),
  status             VARCHAR(20) NOT NULL DEFAULT 'confirmed'
                     CHECK (status IN ('confirmed','completed','cancelled','rescheduled')),
  symptoms           TEXT,
  pre_visit_summary  JSONB,
  post_visit_notes   TEXT,
  post_visit_summary TEXT,
  prescription       JSONB,
  google_event_id    TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appt_patient  ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appt_doctor   ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appt_status   ON appointments(status);

-- ─── MEDICATION REMINDERS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medication_reminders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id     UUID NOT NULL REFERENCES users(id),
  drug_name      TEXT NOT NULL,
  dose           TEXT,
  frequency      TEXT,
  next_reminder  TIMESTAMPTZ,
  active         BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_patient ON medication_reminders(patient_id, active);
CREATE INDEX IF NOT EXISTS idx_reminders_next    ON medication_reminders(next_reminder) WHERE active = TRUE;

-- ─── NOTIFICATION LOG ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type         VARCHAR(50) NOT NULL,
  recipient_id UUID REFERENCES users(id),
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','sent','failed')),
  attempts     INTEGER DEFAULT 0,
  payload      JSONB,
  error        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
