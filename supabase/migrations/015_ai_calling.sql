-- Migration 015: AI calling agent (Vapi.ai) per-org settings + per-call rows

ALTER TABLE integration_settings
  ADD COLUMN IF NOT EXISTS ai_provider text DEFAULT 'vapi'
    CHECK (ai_provider IN ('vapi', 'retell', 'bland', 'none')),
  ADD COLUMN IF NOT EXISTS ai_api_key text,
  ADD COLUMN IF NOT EXISTS ai_assistant_id text,
  ADD COLUMN IF NOT EXISTS ai_assistant_id_urdu text,
  ADD COLUMN IF NOT EXISTS ai_calling_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_auto_call_new_leads boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_default_language text DEFAULT 'english'
    CHECK (ai_default_language IN ('english', 'urdu', 'roman_urdu')),
  ADD COLUMN IF NOT EXISTS ai_calling_hours_start integer DEFAULT 9
    CHECK (ai_calling_hours_start >= 0 AND ai_calling_hours_start <= 23),
  ADD COLUMN IF NOT EXISTS ai_calling_hours_end integer DEFAULT 21
    CHECK (ai_calling_hours_end >= 0 AND ai_calling_hours_end <= 23),
  ADD COLUMN IF NOT EXISTS ai_max_calls_per_day integer DEFAULT 50
    CHECK (ai_max_calls_per_day >= 0);

-- Per-call AI call rows (separate from `calls` table because the call lifecycle,
-- billing model and metadata are different — AI calls have transcripts, tool
-- usage, sentiment scores, and may end with a transfer to a human via the
-- existing `calls` table).
CREATE TABLE IF NOT EXISTS ai_calls (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  provider text DEFAULT 'vapi' NOT NULL,
  provider_call_id text,
  language text DEFAULT 'english' NOT NULL,
  status text DEFAULT 'queued' NOT NULL
    CHECK (status IN ('queued', 'in_progress', 'completed', 'failed', 'transferred')),
  duration_seconds integer,
  cost_usd numeric(10, 4),
  recording_url text,
  transcript text,
  summary text,
  sentiment text,
  intent text,
  ended_reason text,
  transferred_to_agent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_calls_organization_id ON ai_calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_calls_lead_id ON ai_calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_calls_provider_call_id ON ai_calls(provider_call_id);
CREATE INDEX IF NOT EXISTS idx_ai_calls_created_at ON ai_calls(created_at DESC);

CREATE TRIGGER trg_ai_calls_updated_at
  BEFORE UPDATE ON ai_calls
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: org-isolated reads + writes for admins/managers, agents see only AI
-- calls for leads they own.
ALTER TABLE ai_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_calls_select_org ON ai_calls
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY ai_calls_insert_org ON ai_calls
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY ai_calls_update_org ON ai_calls
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );
