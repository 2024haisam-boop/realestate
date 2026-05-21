-- Migration 005: calls (Twilio bridge call records)

CREATE TYPE call_status AS ENUM (
  'initiated',
  'agent_ringing',
  'agent_answered',
  'lead_ringing',
  'connected',
  'completed',
  'failed',
  'no_answer',
  'busy'
);

CREATE TYPE call_outcome AS ENUM (
  'connected',
  'not_answered',
  'busy',
  'wrong_number',
  'callback_requested',
  'not_interested',
  'interested'
);

CREATE TABLE calls (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  call_sid text,
  conference_sid text,
  agent_call_sid text,
  lead_call_sid text,
  status call_status DEFAULT 'initiated',
  outcome call_outcome,
  duration_seconds integer DEFAULT 0,
  recording_url text,
  is_dry_run boolean DEFAULT false,
  notes text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_calls_lead_id ON calls(lead_id);
CREATE INDEX idx_calls_agent_id ON calls(agent_id);
CREATE INDEX idx_calls_organization_id ON calls(organization_id);
CREATE INDEX idx_calls_started_at ON calls(started_at DESC);
CREATE INDEX idx_calls_call_sid ON calls(call_sid) WHERE call_sid IS NOT NULL;
CREATE INDEX idx_calls_conference_sid ON calls(conference_sid) WHERE conference_sid IS NOT NULL;

CREATE TRIGGER trg_calls_updated_at
  BEFORE UPDATE ON calls
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
