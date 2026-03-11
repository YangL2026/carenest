CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS procedure_steps CASCADE;
DROP TABLE IF EXISTS procedures CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS med_logs CASCADE;
DROP TABLE IF EXISTS medications CASCADE;
DROP TABLE IF EXISTS dependents CASCADE;

-- Dependents (the people being cared for)
CREATE TABLE dependents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  photo_url TEXT,
  household_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medications
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_id UUID REFERENCES dependents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT,

  -- Timing type
  timing_type TEXT NOT NULL DEFAULT 'clock',  -- 'clock' | 'interval' | 'as_needed'

  -- For clock-based: specific times of day
  times TEXT[],                               -- e.g., ARRAY['07:00', '19:00']

  -- For interval-based: minimum hours between doses
  interval_hours INTEGER,                     -- e.g., 6 for "every 6 hours"

  -- Treatment duration
  duration_type TEXT DEFAULT 'ongoing',       -- 'ongoing' | 'fixed_course'
  total_doses INTEGER,                        -- for fixed_course: total prescribed doses
  doses_given INTEGER DEFAULT 0,              -- for fixed_course: counter
  course_end_date DATE,                       -- alternative: end by date instead of count

  -- Supply tracking (optional)
  supply_tracking BOOLEAN DEFAULT FALSE,
  supply_total INTEGER,                       -- total doses in current supply
  supply_remaining INTEGER,                   -- decremented on each check-off
  supply_low_threshold INTEGER DEFAULT 10,    -- days remaining to trigger warning

  -- Status
  status TEXT DEFAULT 'active',               -- 'active' | 'paused' | 'completed' | 'discontinued'
  pause_reason TEXT,
  pause_linked_procedure_id UUID,             -- if paused for a procedure
  resume_date DATE,                           -- optional auto-resume date

  -- Meta
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily medication check-off log
CREATE TABLE med_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  dependent_id UUID REFERENCES dependents(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_scheduled TIME,                        -- null for as-needed meds
  time_taken TIMESTAMPTZ,                     -- when actually given
  status TEXT DEFAULT 'pending',              -- 'pending' | 'taken' | 'missed' | 'skipped' | 'taken_late'
  notes TEXT,                                 -- optional note ("gave with food", etc.)
  UNIQUE(medication_id, date, time_scheduled)
);

-- Tasks (pharmacy pickups, phone calls, blood work, etc.)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_id UUID REFERENCES dependents(id) ON DELETE CASCADE,
  household_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT DEFAULT 'errand',            -- 'errand' | 'phone_call' | 'pharmacy_pickup' | 'blood_work' | 'appointment'

  -- Deadline window
  deadline_date DATE,                         -- when this needs to be done by
  warning_days INTEGER DEFAULT 2,             -- days before deadline to show amber

  -- For appointments with specific times
  appointment_datetime TIMESTAMPTZ,
  location TEXT,

  -- Status
  status TEXT DEFAULT 'pending',              -- 'pending' | 'completed' | 'expired'
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procedures (surgeries, colonoscopies, etc.)
CREATE TABLE procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dependent_id UUID REFERENCES dependents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  procedure_datetime TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'upcoming',             -- 'upcoming' | 'prep_active' | 'completed'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Procedure timeline steps
CREATE TABLE procedure_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id UUID REFERENCES procedures(id) ON DELETE CASCADE,
  offset_minutes INTEGER NOT NULL,            -- negative = before, positive = after
  instruction TEXT NOT NULL,
  step_type TEXT DEFAULT 'task',              -- 'info' | 'medication_pause' | 'medication_resume' | 'task' | 'dietary'
  linked_medication_id UUID REFERENCES medications(id),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notification_sent BOOLEAN DEFAULT FALSE,
  sort_order INTEGER NOT NULL
);

-- Push notification subscriptions (one per device)
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
