-- SAT Samarkand — Phase 1 Schema
-- Run this in Supabase SQL editor or via supabase db push

-- Extend the existing users table (already has telegram_id, name, role, last_active_at)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS telegram_username text,
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';

-- ─── TEACHERS ────────────────────────────────────────────────────────────────
-- Teachers are rows in users with role = 'teacher'
-- No separate table needed for Phase 1

-- ─── GROUPS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  subject         text NOT NULL CHECK (subject IN ('math', 'english')),
  teacher_id      bigint REFERENCES users(telegram_id),
  schedule        jsonb NOT NULL DEFAULT '[]',  -- [{day, startTime, endTime}]
  student_ids     bigint[] NOT NULL DEFAULT '{}',
  max_capacity    int NOT NULL DEFAULT 12,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'full', 'upcoming')),
  room            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── STUDENTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id         bigint UNIQUE REFERENCES users(telegram_id),
  name                text NOT NULL,
  subject             text NOT NULL CHECK (subject IN ('math', 'english', 'both')),
  type                text NOT NULL DEFAULT 'group' CHECK (type IN ('group', 'individual')),
  group_id            uuid REFERENCES groups(id),
  teacher_math_id     bigint REFERENCES users(telegram_id),
  teacher_english_id  bigint REFERENCES users(telegram_id),
  phase               text NOT NULL DEFAULT 'intensive' CHECK (phase IN ('intensive', 'examPrep')),
  exam_date           date,
  target_score        int,
  current_score       int,
  enrollment_date     date NOT NULL DEFAULT CURRENT_DATE,
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'graduated', 'dropped')),
  monthly_fee_math    int NOT NULL DEFAULT 0,
  monthly_fee_english int NOT NULL DEFAULT 0,
  referred_by         uuid REFERENCES students(id),
  parent_telegram_id  bigint,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── PROBLEMS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS problems (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject       text NOT NULL CHECK (subject IN ('math', 'english')),
  topic         text NOT NULL,
  difficulty    text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  content       text NOT NULL,
  options       jsonb NOT NULL DEFAULT '["A","B","C","D"]',  -- [{key, text}] or string array
  correct_answer text NOT NULL,
  explanation   text,
  source        text,
  added_by      bigint REFERENCES users(telegram_id),
  approved      boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── ASSIGNMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid REFERENCES groups(id),
  student_id  uuid REFERENCES students(id),  -- null if group assignment
  problem_ids uuid[] NOT NULL,
  due_date    date NOT NULL,
  assigned_by bigint REFERENCES users(telegram_id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── SUBMISSIONS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id),
  student_id    uuid NOT NULL REFERENCES students(id),
  answers       jsonb NOT NULL DEFAULT '{}',  -- {problem_id: "A"|"B"|"C"|"D"}
  score         int,                           -- correct count
  total         int,                           -- total problems
  submitted_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── ATTENDANCE ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    uuid NOT NULL REFERENCES groups(id),
  student_id  uuid NOT NULL REFERENCES students(id),
  class_date  date NOT NULL,
  status      text NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  marked_by   bigint REFERENCES users(telegram_id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, student_id, class_date)
);

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES students(id),
  month         text NOT NULL,  -- YYYY-MM
  subject       text NOT NULL CHECK (subject IN ('math', 'english', 'both')),
  amount        int NOT NULL,   -- UZS
  due_date      date NOT NULL,
  paid_date     date,
  status        text NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'overdue', 'partial', 'frozen')),
  discounts     jsonb NOT NULL DEFAULT '[]',  -- [{type, amount}]
  net_amount    int NOT NULL,
  receipt_sent  boolean NOT NULL DEFAULT false,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_students_telegram_id ON students(telegram_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_date);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- For Phase 1: service role bypasses RLS (all writes go through API routes with admin client)
-- Public anon reads are blocked by default
-- Add granular policies in Phase 2 when individual role auth is fully wired
