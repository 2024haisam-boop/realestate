-- Migration 002: profiles
-- Extends Supabase auth.users with org membership, role, and round-robin state.

CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL CHECK (role IN ('admin', 'sales_manager', 'sales_agent', 'field_executive', 'social_media_manager')),
  avatar_url text,
  is_active boolean DEFAULT true,
  is_available boolean DEFAULT true,
  last_assigned_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_assignment_lookup
  ON profiles(organization_id, role, is_active, is_available, last_assigned_at);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
