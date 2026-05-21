-- ============================================================
-- RESET: drops every EstateFlow table, type, and function.
-- Safe to run on an empty / partially-set-up Supabase project.
-- DESTRUCTIVE: any data in these tables will be lost.
-- ============================================================

-- Tables (reverse of creation order so foreign keys unwind cleanly)
DROP TABLE IF EXISTS lead_property_shares CASCADE;
DROP TABLE IF EXISTS integration_settings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS social_posts CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS followups CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS property_documents CASCADE;
DROP TABLE IF EXISTS property_images CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Functions
DROP FUNCTION IF EXISTS get_user_org_id() CASCADE;
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

-- Types
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS post_status CASCADE;
DROP TYPE IF EXISTS post_platform CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS activity_type CASCADE;
DROP TYPE IF EXISTS followup_status CASCADE;
DROP TYPE IF EXISTS followup_type CASCADE;
DROP TYPE IF EXISTS message_status CASCADE;
DROP TYPE IF EXISTS message_direction CASCADE;
DROP TYPE IF EXISTS message_channel CASCADE;
DROP TYPE IF EXISTS call_outcome CASCADE;
DROP TYPE IF EXISTS call_status CASCADE;
DROP TYPE IF EXISTS furnishing_status CASCADE;
DROP TYPE IF EXISTS property_status CASCADE;
DROP TYPE IF EXISTS property_interest CASCADE;
DROP TYPE IF EXISTS lead_source CASCADE;
DROP TYPE IF EXISTS lead_temperature CASCADE;
DROP TYPE IF EXISTS lead_status CASCADE;
