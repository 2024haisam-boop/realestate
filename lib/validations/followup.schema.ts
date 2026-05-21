import { z } from 'zod';

const FOLLOWUP_TYPES = ['call', 'whatsapp', 'sms', 'email', 'site_visit', 'other'] as const;

export const followupCreateSchema = z.object({
  leadId: z.string().uuid(),
  agentId: z.string().uuid().optional().or(z.literal('')),
  type: z.enum(FOLLOWUP_TYPES),
  scheduledAt: z.string().min(1, 'Schedule date is required'),
  notes: z.string().max(2000).optional().or(z.literal('')),
  templateUsed: z.string().max(40).optional().or(z.literal('')),
});
export type FollowupCreateInput = z.infer<typeof followupCreateSchema>;

export const followupCompleteSchema = z.object({
  followupId: z.string().uuid(),
  notes: z.string().max(2000).optional().or(z.literal('')),
});
export type FollowupCompleteInput = z.infer<typeof followupCompleteSchema>;

export const followupSnoozeSchema = z.object({
  followupId: z.string().uuid(),
  newScheduledAt: z.string().min(1),
});
export type FollowupSnoozeInput = z.infer<typeof followupSnoozeSchema>;

export const sendWhatsappTemplateSchema = z.object({
  leadId: z.string().uuid(),
  templateId: z.string().min(1),
  /** Override the rendered body before sending (optional). */
  customBody: z.string().max(2000).optional().or(z.literal('')),
});
export type SendWhatsappTemplateInput = z.infer<typeof sendWhatsappTemplateSchema>;
