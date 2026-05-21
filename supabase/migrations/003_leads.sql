-- Migration 003: leads + supporting enums

CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'interested',
  'site_visit_scheduled',
  'negotiation',
  'won',
  'lost',
  'not_responding',
  'call_pending'
);

CREATE TYPE lead_temperature AS ENUM ('cold', 'warm', 'hot');

CREATE TYPE lead_source AS ENUM (
  '36acre',
  'magicbricks',
  'housing',
  'facebook',
  'instagram',
  'website',
  'referral',
  'manual',
  'other'
);

CREATE TYPE property_interest AS ENUM (
  'apartment',
  'villa',
  'plot',
  'commercial',
  'rental'
);

CREATE TABLE leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  source lead_source DEFAULT 'manual',
  property_type property_interest,
  budget_min bigint,
  budget_max bigint,
  preferred_location text,
  status lead_status DEFAULT 'new',
  temperature lead_temperature DEFAULT 'cold',
  assigned_agent_id uuid REFERENCES profiles(id),
  notes text,
  next_followup_at timestamptz,
  last_contacted_at timestamptz,
  is_hot boolean DEFAULT false,
  external_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_leads_organization_id ON leads(organization_id);
CREATE INDEX idx_leads_assigned_agent_id ON leads(assigned_agent_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_is_hot ON leads(is_hot) WHERE is_hot = true;
CREATE INDEX idx_leads_next_followup_at ON leads(next_followup_at) WHERE next_followup_at IS NOT NULL;

CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
