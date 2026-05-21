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
