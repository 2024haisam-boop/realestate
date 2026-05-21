-- Migration 013: lead_property_shares (audit when a property is shared with a lead)

CREATE TABLE lead_property_shares (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  shared_by uuid REFERENCES profiles(id),
  channel message_channel,
  message_sent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_lead_property_shares_lead_id ON lead_property_shares(lead_id);
CREATE INDEX idx_lead_property_shares_property_id ON lead_property_shares(property_id);
CREATE INDEX idx_lead_property_shares_organization_id ON lead_property_shares(organization_id);
CREATE INDEX idx_lead_property_shares_created_at ON lead_property_shares(created_at DESC);
