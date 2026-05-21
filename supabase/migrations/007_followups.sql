-- Migration 007: followups (scheduled touchpoints with leads)

CREATE TYPE followup_type AS ENUM ('call', 'whatsapp', 'sms', 'email', 'site_visit', 'other');
CREATE TYPE followup_status AS ENUM ('pending', 'completed', 'snoozed', 'missed');

CREATE TABLE followups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES profiles(id),
  type followup_type NOT NULL,
  status followup_status DEFAULT 'pending',
  scheduled_at timestamptz NOT NULL,
  completed_at timestamptz,
  notes text,
  template_used text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_followups_organization_id ON followups(organization_id);
CREATE INDEX idx_followups_lead_id ON followups(lead_id);
CREATE INDEX idx_followups_agent_id ON followups(agent_id);
CREATE INDEX idx_followups_scheduled_at ON followups(scheduled_at);
CREATE INDEX idx_followups_status ON followups(status);
CREATE INDEX idx_followups_due_lookup
  ON followups(organization_id, status, scheduled_at)
  WHERE status = 'pending';

CREATE TRIGGER trg_followups_updated_at
  BEFORE UPDATE ON followups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
