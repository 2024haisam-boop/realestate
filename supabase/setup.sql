-- ============================================================
-- migrations/001_organizations.sql
-- ============================================================
-- Migration 001: organizations
-- Top-level tenant entity. Every other row in the system is scoped to an organization.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  plan text DEFAULT 'free',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- migrations/002_users.sql
-- ============================================================
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

-- ============================================================
-- migrations/003_leads.sql
-- ============================================================
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
  'zameen',
  'graana',
  'olx',
  'pakistanproperty',
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

-- ============================================================
-- migrations/004_properties.sql
-- ============================================================
-- Migration 004: properties + images + documents

CREATE TYPE property_status AS ENUM ('available', 'hold', 'sold', 'rented');
CREATE TYPE furnishing_status AS ENUM ('unfurnished', 'semi_furnished', 'fully_furnished');

CREATE TABLE properties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  location text NOT NULL,
  address text,
  property_type property_interest NOT NULL,
  price bigint NOT NULL,
  size_sqft integer,
  bedrooms integer,
  bathrooms integer,
  floor integer,
  furnishing furnishing_status DEFAULT 'unfurnished',
  status property_status DEFAULT 'available',
  description text,
  amenities text[],
  developer_name text,
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_properties_organization_id ON properties(organization_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_share_token ON properties(share_token);
CREATE INDEX idx_properties_match
  ON properties(organization_id, status, property_type, price);

CREATE TRIGGER trg_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE property_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  is_primary boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_property_images_primary ON property_images(property_id, is_primary) WHERE is_primary = true;

CREATE TABLE property_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_property_documents_property_id ON property_documents(property_id);

-- ============================================================
-- migrations/005_calls.sql
-- ============================================================
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

-- ============================================================
-- migrations/006_messages.sql
-- ============================================================
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

-- ============================================================
-- migrations/007_followups.sql
-- ============================================================
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

-- ============================================================
-- migrations/008_activities.sql
-- ============================================================
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

-- ============================================================
-- migrations/009_attendance.sql
-- ============================================================
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

-- ============================================================
-- migrations/010_social_posts.sql
-- ============================================================
-- Migration 010: social_posts (content calendar for IG/FB/LinkedIn)

CREATE TYPE post_platform AS ENUM (
  'instagram_post',
  'instagram_reel',
  'instagram_story',
  'facebook_post',
  'linkedin_post'
);

CREATE TYPE post_status AS ENUM ('idea', 'draft', 'scheduled', 'published', 'cancelled');

CREATE TABLE social_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES profiles(id),
  assigned_to uuid REFERENCES profiles(id),
  platform post_platform NOT NULL,
  caption text,
  media_urls text[],
  status post_status DEFAULT 'idea',
  scheduled_at timestamptz,
  published_at timestamptz,
  notes text,
  zapier_webhook_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_social_posts_organization_id ON social_posts(organization_id);
CREATE INDEX idx_social_posts_assigned_to ON social_posts(assigned_to);
CREATE INDEX idx_social_posts_status ON social_posts(status);
CREATE INDEX idx_social_posts_scheduled_at ON social_posts(scheduled_at);

CREATE TRIGGER trg_social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- migrations/011_notifications.sql
-- ============================================================
-- Migration 011: notifications (in-app push via Supabase Realtime)

CREATE TYPE notification_type AS ENUM (
  'new_lead',
  'lead_assigned',
  'missed_call',
  'followup_due',
  'site_visit',
  'property_shared',
  'attendance_issue',
  'social_post_due'
);

CREATE TABLE notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title text NOT NULL,
  body text,
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_user_unread
  ON notifications(user_id, created_at DESC)
  WHERE is_read = false;

-- ============================================================
-- migrations/012_integration_settings.sql
-- ============================================================
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

-- ============================================================
-- migrations/013_lead_property_shares.sql
-- ============================================================
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

-- ============================================================
-- migrations/014_rls_policies.sql
-- ============================================================
-- Migration 014: Row-Level Security policies
-- All tables are org-scoped. Most policies use the helper get_user_org_id()
-- which returns the calling user's organization_id from profiles.

-- ============================================================
-- Helper function
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_property_shares ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- organizations: users can only see their own org
-- ============================================================
CREATE POLICY "org_isolation" ON organizations
  FOR ALL USING (id = get_user_org_id());

-- ============================================================
-- profiles: members of the same org can see each other
-- ============================================================
CREATE POLICY "profiles_org_isolation" ON profiles
  FOR ALL USING (organization_id = get_user_org_id());

-- ============================================================
-- leads:
--   admin / sales_manager  -> all org leads
--   everyone else          -> only leads assigned to them
-- ============================================================
CREATE POLICY "leads_org_isolation" ON leads
  FOR ALL USING (
    organization_id = get_user_org_id()
    AND (
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'sales_manager')
      OR assigned_agent_id = auth.uid()
    )
  );

-- ============================================================
-- properties: all org members
-- ============================================================
CREATE POLICY "properties_org_isolation" ON properties
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "property_images_org_isolation" ON property_images
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE organization_id = get_user_org_id())
  );

CREATE POLICY "property_documents_org_isolation" ON property_documents
  FOR ALL USING (
    property_id IN (SELECT id FROM properties WHERE organization_id = get_user_org_id())
  );

-- ============================================================
-- calls / messages: org-scoped
-- ============================================================
CREATE POLICY "calls_org_isolation" ON calls
  FOR ALL USING (organization_id = get_user_org_id());

CREATE POLICY "messages_org_isolation" ON messages
  FOR ALL USING (organization_id = get_user_org_id());

-- ============================================================
-- followups:
--   admin / sales_manager  -> all org followups
--   everyone else          -> only their own assignments
-- ============================================================
CREATE POLICY "followups_org_isolation" ON followups
  FOR ALL USING (
    organization_id = get_user_org_id()
    AND (
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'sales_manager')
      OR agent_id = auth.uid()
    )
  );

-- ============================================================
-- activities: org-scoped read for everyone
-- ============================================================
CREATE POLICY "activities_org_isolation" ON activities
  FOR ALL USING (organization_id = get_user_org_id());

-- ============================================================
-- attendance:
--   admin / sales_manager  -> all org attendance
--   everyone else          -> only their own
-- ============================================================
CREATE POLICY "attendance_isolation" ON attendance
  FOR ALL USING (
    organization_id = get_user_org_id()
    AND (
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'sales_manager')
      OR user_id = auth.uid()
    )
  );

-- ============================================================
-- social_posts: org-scoped (all members can collaborate)
-- ============================================================
CREATE POLICY "social_posts_org_isolation" ON social_posts
  FOR ALL USING (organization_id = get_user_org_id());

-- ============================================================
-- notifications: users see only their own
-- ============================================================
CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- integration_settings: admin only
-- ============================================================
CREATE POLICY "integration_admin_only" ON integration_settings
  FOR ALL USING (
    organization_id = get_user_org_id()
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================
-- lead_property_shares: org-scoped
-- ============================================================
CREATE POLICY "lead_property_shares_org_isolation" ON lead_property_shares
  FOR ALL USING (organization_id = get_user_org_id());

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
