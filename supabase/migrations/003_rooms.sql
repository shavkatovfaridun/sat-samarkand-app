-- Rooms table for managing physical rooms/classrooms
CREATE TABLE IF NOT EXISTS rooms (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL UNIQUE,
  capacity   int  NOT NULL DEFAULT 20,
  floor      int  NOT NULL DEFAULT 1,
  color      text NOT NULL DEFAULT '#1B4FD8',
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  notes      text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on rooms" ON rooms FOR ALL USING (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS rooms_status_idx ON rooms(status);
CREATE INDEX IF NOT EXISTS rooms_name_idx   ON rooms(name);
