-- Migration 009: attendance (GPS check-in / check-out)

CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent', 'half_day');

CREATE TABLE attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  check_in_time timestamptz,
  check_out_time timestamptz,
  check_in_lat decimal(10, 8),
  check_in_lng decimal(11, 8),
  check_out_lat decimal(10, 8),
  check_out_lng decimal(11, 8),
  check_in_selfie_url text,
  status attendance_status,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_attendance_organization_id ON attendance(organization_id);
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_date ON attendance(date DESC);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date DESC);

CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
