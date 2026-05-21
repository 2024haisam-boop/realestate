-- Migration 012: integration_settings (per-org credentials + feature flags)

CREATE TABLE integration_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  twilio_account_sid text,
  twilio_auth_token text,
  twilio_phone_number text,
  twilio_whatsapp_number text,
  resend_api_key text,
  smtp_host text,
  smtp_port integer,
  smtp_user text,
  smtp_pass text,
  openai_api_key text,
  openai_base_url text DEFAULT 'https://api.openai.com/v1',
  webhook_secret text DEFAULT encode(gen_random_bytes(32), 'hex'),
  lead_assignment_mode text DEFAULT 'round_robin'
    CHECK (lead_assignment_mode IN ('round_robin', 'manual', 'least_busy')),
  zapier_webhook_url text,
  dry_run_mode boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_integration_settings_organization_id ON integration_settings(organization_id);

CREATE TRIGGER trg_integration_settings_updated_at
  BEFORE UPDATE ON integration_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
