import { z } from 'zod';
import { LEAD_SOURCES, PROPERTY_TYPES } from '@/lib/constants';

/**
 * Payload accepted by POST /api/webhooks/leads.
 * Only fullName, phone, and organizationSlug are strictly required.
 */
export const leadWebhookSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Phone must be in E.164 format'),
  email: z.string().email().optional(),
  source: z.enum(LEAD_SOURCES as [string, ...string[]]).optional(),
  propertyType: z.enum(PROPERTY_TYPES as [string, ...string[]]).optional(),
  budgetMin: z.coerce.number().int().nonnegative().optional(),
  budgetMax: z.coerce.number().int().nonnegative().optional(),
  preferredLocation: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  externalId: z.string().max(120).optional(),
  organizationSlug: z.string().min(1).max(120),
});
export type LeadWebhookInput = z.infer<typeof leadWebhookSchema>;
