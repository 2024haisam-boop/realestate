/**
 * Database types for EstateFlow CRM.
 *
 * Until you wire up `supabase gen types typescript`, this hand-maintained
 * file mirrors the migrations exactly. Once the Supabase CLI is set up, run:
 *
 *   npm run db:types
 *
 * which will overwrite this file.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ───────────────────────── Enums (mirror migrations) ─────────────────────────

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'site_visit_scheduled'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'not_responding'
  | 'call_pending';

export type LeadTemperature = 'cold' | 'warm' | 'hot';

export type LeadSource =
  | 'zameen'
  | 'graana'
  | 'olx'
  | 'pakistanproperty'
  | 'facebook'
  | 'instagram'
  | 'website'
  | 'referral'
  | 'manual'
  | 'other';

export type PropertyInterest = 'apartment' | 'villa' | 'plot' | 'commercial' | 'rental';

export type PropertyStatus = 'available' | 'hold' | 'sold' | 'rented';
export type FurnishingStatus = 'unfurnished' | 'semi_furnished' | 'fully_furnished';

export type CallStatus =
  | 'initiated'
  | 'agent_ringing'
  | 'agent_answered'
  | 'lead_ringing'
  | 'connected'
  | 'completed'
  | 'failed'
  | 'no_answer'
  | 'busy';

export type CallOutcome =
  | 'connected'
  | 'not_answered'
  | 'busy'
  | 'wrong_number'
  | 'callback_requested'
  | 'not_interested'
  | 'interested';

export type MessageChannel = 'whatsapp' | 'sms' | 'email';
export type MessageDirection = 'outbound' | 'inbound';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'pending';

export type FollowupType = 'call' | 'whatsapp' | 'sms' | 'email' | 'site_visit' | 'other';
export type FollowupStatus = 'pending' | 'completed' | 'snoozed' | 'missed';

export type ActivityType =
  | 'lead_created'
  | 'lead_assigned'
  | 'status_changed'
  | 'call_made'
  | 'call_completed'
  | 'message_sent'
  | 'property_shared'
  | 'note_added'
  | 'followup_scheduled'
  | 'followup_completed'
  | 'checkin'
  | 'checkout';

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half_day';

export type PostPlatform =
  | 'instagram_post'
  | 'instagram_reel'
  | 'instagram_story'
  | 'facebook_post'
  | 'linkedin_post';

export type PostStatus = 'idea' | 'draft' | 'scheduled' | 'published' | 'cancelled';

export type NotificationType =
  | 'new_lead'
  | 'lead_assigned'
  | 'missed_call'
  | 'followup_due'
  | 'site_visit'
  | 'property_shared'
  | 'attendance_issue'
  | 'social_post_due';

export type AppRole =
  | 'admin'
  | 'sales_manager'
  | 'sales_agent'
  | 'field_executive'
  | 'social_media_manager';

export type LeadAssignmentMode = 'round_robin' | 'manual' | 'least_busy';

// ──────────────────────────── Row interfaces ─────────────────────────────────

export type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string | null;
  created_at: string;
  updated_at: string;
}

export type ProfileRow = {
  id: string;
  organization_id: string | null;
  full_name: string;
  phone: string | null;
  role: AppRole;
  avatar_url: string | null;
  is_active: boolean;
  is_available: boolean;
  last_assigned_at: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadRow = {
  id: string;
  organization_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  source: LeadSource;
  property_type: PropertyInterest | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_location: string | null;
  status: LeadStatus;
  temperature: LeadTemperature;
  assigned_agent_id: string | null;
  notes: string | null;
  next_followup_at: string | null;
  last_contacted_at: string | null;
  is_hot: boolean;
  external_id: string | null;
  created_at: string;
  updated_at: string;
}

export type PropertyRow = {
  id: string;
  organization_id: string;
  title: string;
  location: string;
  address: string | null;
  property_type: PropertyInterest;
  price: number;
  size_sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  furnishing: FurnishingStatus;
  status: PropertyStatus;
  description: string | null;
  amenities: string[] | null;
  developer_name: string | null;
  share_token: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type PropertyImageRow = {
  id: string;
  property_id: string;
  storage_path: string;
  public_url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export type PropertyDocumentRow = {
  id: string;
  property_id: string;
  name: string;
  storage_path: string;
  public_url: string;
  created_at: string;
}

export type CallRow = {
  id: string;
  organization_id: string;
  lead_id: string | null;
  agent_id: string | null;
  call_sid: string | null;
  conference_sid: string | null;
  agent_call_sid: string | null;
  lead_call_sid: string | null;
  status: CallStatus;
  outcome: CallOutcome | null;
  duration_seconds: number;
  recording_url: string | null;
  is_dry_run: boolean;
  notes: string | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MessageRow = {
  id: string;
  organization_id: string;
  lead_id: string | null;
  agent_id: string | null;
  channel: MessageChannel;
  direction: MessageDirection;
  body: string;
  status: MessageStatus;
  twilio_sid: string | null;
  is_dry_run: boolean;
  created_at: string;
  updated_at: string;
}

export type FollowupRow = {
  id: string;
  organization_id: string;
  lead_id: string;
  agent_id: string | null;
  type: FollowupType;
  status: FollowupStatus;
  scheduled_at: string;
  completed_at: string | null;
  notes: string | null;
  template_used: string | null;
  created_at: string;
  updated_at: string;
}

export type ActivityRow = {
  id: string;
  organization_id: string;
  lead_id: string | null;
  user_id: string | null;
  type: ActivityType;
  title: string;
  description: string | null;
  metadata: Json;
  created_at: string;
}

export type AttendanceRow = {
  id: string;
  organization_id: string;
  user_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  check_out_lat: number | null;
  check_out_lng: number | null;
  check_in_selfie_url: string | null;
  status: AttendanceStatus | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type SocialPostRow = {
  id: string;
  organization_id: string;
  created_by: string | null;
  assigned_to: string | null;
  platform: PostPlatform;
  caption: string | null;
  media_urls: string[] | null;
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  notes: string | null;
  zapier_webhook_sent: boolean;
  created_at: string;
  updated_at: string;
}

export type NotificationRow = {
  id: string;
  organization_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  is_read: boolean;
  metadata: Json;
  created_at: string;
}

export type IntegrationSettingsRow = {
  id: string;
  organization_id: string;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  twilio_phone_number: string | null;
  twilio_whatsapp_number: string | null;
  resend_api_key: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_pass: string | null;
  openai_api_key: string | null;
  openai_base_url: string | null;
  webhook_secret: string;
  lead_assignment_mode: LeadAssignmentMode;
  zapier_webhook_url: string | null;
  dry_run_mode: boolean;
  created_at: string;
  updated_at: string;
}

export type LeadPropertyShareRow = {
  id: string;
  organization_id: string;
  lead_id: string;
  property_id: string;
  shared_by: string | null;
  channel: MessageChannel | null;
  message_sent: string | null;
  created_at: string;
}

// ──────────────────────────── Database shape ────────────────────────────────
//
// Insert/Update are intentionally permissive (`Record<string, unknown>`):
// supabase-js v2's generic extraction collapses stricter Partial<Row> /
// intersection types to `never` for some Row shapes (it broke our Vercel
// build). Row is still strictly typed for reads — runtime safety on writes is
// preserved by NOT NULL constraints + RLS policies in the database.

type TableShape<R> = {
  Row: R;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      organizations: TableShape<OrganizationRow>;
      profiles: TableShape<ProfileRow>;
      leads: TableShape<LeadRow>;
      properties: TableShape<PropertyRow>;
      property_images: TableShape<PropertyImageRow>;
      property_documents: TableShape<PropertyDocumentRow>;
      calls: TableShape<CallRow>;
      messages: TableShape<MessageRow>;
      followups: TableShape<FollowupRow>;
      activities: TableShape<ActivityRow>;
      attendance: TableShape<AttendanceRow>;
      social_posts: TableShape<SocialPostRow>;
      notifications: TableShape<NotificationRow>;
      integration_settings: TableShape<IntegrationSettingsRow>;
      lead_property_shares: TableShape<LeadPropertyShareRow>;
    };
    Views: Record<string, never>;
    Functions: {
      get_user_org_id: { Args: Record<string, never>; Returns: string };
    };
    Enums: {
      lead_status: LeadStatus;
      lead_temperature: LeadTemperature;
      lead_source: LeadSource;
      property_interest: PropertyInterest;
      property_status: PropertyStatus;
      furnishing_status: FurnishingStatus;
      call_status: CallStatus;
      call_outcome: CallOutcome;
      message_channel: MessageChannel;
      message_direction: MessageDirection;
      message_status: MessageStatus;
      followup_type: FollowupType;
      followup_status: FollowupStatus;
      activity_type: ActivityType;
      attendance_status: AttendanceStatus;
      post_platform: PostPlatform;
      post_status: PostStatus;
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
}
