-- Migration 006: messages (WhatsApp / SMS / Email)

CREATE TYPE message_channel AS ENUM ('whatsapp', 'sms', 'email');
CREATE TYPE message_direction AS ENUM ('outbound', 'inbound');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read', 'failed', 'pending');

CREATE TABLE messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  channel message_channel NOT NULL,
  direction message_direction DEFAULT 'outbound',
  body text NOT NULL,
  status message_status DEFAULT 'pending',
  twilio_sid text,
  is_dry_run boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_organization_id ON messages(organization_id);
CREATE INDEX idx_messages_lead_id ON messages(lead_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_twilio_sid ON messages(twilio_sid) WHERE twilio_sid IS NOT NULL;

CREATE TRIGGER trg_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
