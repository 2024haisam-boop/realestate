-- Migration 008: activities (timeline / audit log)

CREATE TYPE activity_type AS ENUM (
  'lead_created',
  'lead_assigned',
  'status_changed',
  'call_made',
  'call_completed',
  'message_sent',
  'property_shared',
  'note_added',
  'followup_scheduled',
  'followup_completed',
  'checkin',
  'checkout'
);

CREATE TABLE activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  type activity_type NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_activities_lead_id ON activities(lead_id);
CREATE INDEX idx_activities_organization_id ON activities(organization_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_activities_org_created ON activities(organization_id, created_at DESC);
