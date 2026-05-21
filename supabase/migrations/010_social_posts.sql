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
