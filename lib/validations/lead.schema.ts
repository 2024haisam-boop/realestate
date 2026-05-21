import { z } from 'zod';
import { LEAD_SOURCES, LEAD_STATUSES, LEAD_TEMPERATURES, PROPERTY_TYPES } from '@/lib/constants';

const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{7,14}$/, 'Phone must be in E.164 format, e.g. +919811000001');

export const leadCreateSchema = z.object({
  fullName: z.string().min(2, 'Full name is too short').max(120),
  phone: phoneSchema,
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  source: z.enum(LEAD_SOURCES as [string, ...string[]]).default('manual'),
  propertyType: z
    .enum(PROPERTY_TYPES as [string, ...string[]])
    .optional()
    .or(z.literal('')),
  budgetMin: z.coerce.number().int().nonnegative().optional(),
  budgetMax: z.coerce.number().int().nonnegative().optional(),
  preferredLocation: z.string().max(120).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  assignedAgentId: z.string().uuid().optional().or(z.literal('')),
  temperature: z.enum(LEAD_TEMPERATURES as [string, ...string[]]).default('cold'),
  isHot: z.boolean().default(false),
});
export type LeadCreateInput = z.infer<typeof leadCreateSchema>;

export const leadUpdateSchema = z.object({
  leadId: z.string().uuid(),
  fullName: z.string().min(2).max(120).optional(),
  phone: phoneSchema.optional(),
  email: z.string().email().optional().or(z.literal('')),
  source: z.enum(LEAD_SOURCES as [string, ...string[]]).optional(),
  propertyType: z.enum(PROPERTY_TYPES as [string, ...string[]]).optional().or(z.literal('')),
  budgetMin: z.coerce.number().int().nonnegative().optional(),
  budgetMax: z.coerce.number().int().nonnegative().optional(),
  preferredLocation: z.string().max(120).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  status: z.enum(LEAD_STATUSES as [string, ...string[]]).optional(),
  temperature: z.enum(LEAD_TEMPERATURES as [string, ...string[]]).optional(),
  assignedAgentId: z.string().uuid().nullable().optional(),
  isHot: z.boolean().optional(),
});
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;

export const leadNoteSchema = z.object({
  leadId: z.string().uuid(),
  body: z.string().min(1, 'Note cannot be empty').max(2000),
});
export type LeadNoteInput = z.infer<typeof leadNoteSchema>;
