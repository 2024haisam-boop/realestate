import type {
  AppRole,
  LeadSource,
  LeadStatus,
  LeadTemperature,
  PropertyInterest,
  PropertyStatus,
  MessageChannel,
  PostPlatform,
} from './supabase/types';

// ──────────────────────────── Role metadata ────────────────────────────

export const ROLES: AppRole[] = [
  'admin',
  'sales_manager',
  'sales_agent',
  'field_executive',
  'social_media_manager',
];

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: 'Admin',
  sales_manager: 'Sales Manager',
  sales_agent: 'Sales Agent',
  field_executive: 'Field Executive',
  social_media_manager: 'Social Media Manager',
};

export const ROLE_DESCRIPTION: Record<AppRole, string> = {
  admin: 'Full access to all features, settings, and integrations',
  sales_manager: 'Sees all leads, can reassign, runs reports',
  sales_agent: 'Sees only assigned leads, places calls, sends follow-ups',
  field_executive: 'Handles site visits and field operations',
  social_media_manager: 'Creates and schedules social media content',
};

export function isManagerial(role: AppRole): boolean {
  return role === 'admin' || role === 'sales_manager';
}

// ──────────────────────────── Lead metadata ────────────────────────────

export const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'contacted',
  'interested',
  'site_visit_scheduled',
  'negotiation',
  'won',
  'lost',
  'not_responding',
  'call_pending',
];

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  site_visit_scheduled: 'Site Visit Scheduled',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
  not_responding: 'Not Responding',
  call_pending: 'Call Pending',
};

export const LEAD_STATUS_TONE: Record<LeadStatus, 'neutral' | 'info' | 'success' | 'danger' | 'warning'> = {
  new: 'info',
  contacted: 'neutral',
  interested: 'info',
  site_visit_scheduled: 'warning',
  negotiation: 'warning',
  won: 'success',
  lost: 'danger',
  not_responding: 'danger',
  call_pending: 'warning',
};

export const LEAD_TEMPERATURES: LeadTemperature[] = ['cold', 'warm', 'hot'];

export const LEAD_TEMPERATURE_LABEL: Record<LeadTemperature, string> = {
  cold: 'Cold',
  warm: 'Warm',
  hot: 'Hot',
};

export const LEAD_SOURCES: LeadSource[] = [
  '36acre',
  'magicbricks',
  'housing',
  'facebook',
  'instagram',
  'website',
  'referral',
  'manual',
  'other',
];

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  '36acre': '36acre',
  magicbricks: 'MagicBricks',
  housing: 'Housing.com',
  facebook: 'Facebook',
  instagram: 'Instagram',
  website: 'Website',
  referral: 'Referral',
  manual: 'Manual entry',
  other: 'Other',
};

// ──────────────────────────── Property metadata ────────────────────────────

export const PROPERTY_TYPES: PropertyInterest[] = [
  'apartment',
  'villa',
  'plot',
  'commercial',
  'rental',
];

export const PROPERTY_TYPE_LABEL: Record<PropertyInterest, string> = {
  apartment: 'Apartment',
  villa: 'Villa',
  plot: 'Plot',
  commercial: 'Commercial',
  rental: 'Rental',
};

export const PROPERTY_STATUSES: PropertyStatus[] = ['available', 'hold', 'sold', 'rented'];

export const PROPERTY_STATUS_LABEL: Record<PropertyStatus, string> = {
  available: 'Available',
  hold: 'On Hold',
  sold: 'Sold',
  rented: 'Rented',
};

// ──────────────────────────── Message metadata ────────────────────────────

export const MESSAGE_CHANNELS: MessageChannel[] = ['whatsapp', 'sms', 'email'];

export const MESSAGE_CHANNEL_LABEL: Record<MessageChannel, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'Email',
};

// ──────────────────────────── Social metadata ────────────────────────────

export const POST_PLATFORM_LABEL: Record<PostPlatform, string> = {
  instagram_post: 'Instagram Post',
  instagram_reel: 'Instagram Reel',
  instagram_story: 'Instagram Story',
  facebook_post: 'Facebook Post',
  linkedin_post: 'LinkedIn Post',
};

export const POST_CHARACTER_LIMITS: Record<PostPlatform, number> = {
  instagram_post: 2200,
  instagram_reel: 2200,
  instagram_story: 2200,
  facebook_post: 63206,
  linkedin_post: 3000,
};

// ──────────────────────────── Follow-up templates ────────────────────────────

export interface FollowupTemplate {
  id: string;
  name: string;
  channel: MessageChannel;
  body: string;
}

export const FOLLOWUP_TEMPLATES: FollowupTemplate[] = [
  {
    id: 'ft1',
    name: 'Property Review Check',
    channel: 'whatsapp',
    body: 'Hi {{leadName}}, just checking if you had a chance to review the property details I shared. Do let me know if you have any questions! 🏠',
  },
  {
    id: 'ft2',
    name: 'Call Availability',
    channel: 'whatsapp',
    body: 'Hi {{leadName}}, are you available for a quick call today to discuss properties in {{preferredLocation}}? I have some great options for you.',
  },
  {
    id: 'ft3',
    name: 'New Options Available',
    channel: 'whatsapp',
    body: 'Hi {{leadName}}, we have a few new options matching your budget of ₹{{budgetMax}}. Should I share them with you?',
  },
  {
    id: 'ft4',
    name: 'Site Visit Invite',
    channel: 'whatsapp',
    body: 'Hi {{leadName}}, would you like to schedule a site visit this week? It usually takes just 30-45 minutes and gives you a much better feel for the property. 📍',
  },
  {
    id: 'ft5',
    name: 'Re-engagement',
    channel: 'whatsapp',
    body: "Hi {{leadName}}, hope you're doing well! We have some exciting new inventory in {{preferredLocation}} that just became available. Shall I send you the details?",
  },
  {
    id: 'ft6',
    name: 'Post-Visit Follow-up',
    channel: 'sms',
    body: 'Hi {{leadName}}, thank you for visiting us today. Please let us know your thoughts on the property. We are here to help! - EstateFlow Team',
  },
];

// ──────────────────────────── Attendance ────────────────────────────

export const LATE_THRESHOLD_HOUR = 9;
export const LATE_THRESHOLD_MINUTE = 30;
