import { z } from 'zod';
import { PROPERTY_STATUSES, PROPERTY_TYPES } from '@/lib/constants';

const FURNISHING = ['unfurnished', 'semi_furnished', 'fully_furnished'] as const;

export const propertyCreateSchema = z.object({
  title: z.string().min(2, 'Title is too short').max(160),
  location: z.string().min(1, 'Location is required').max(120),
  address: z.string().max(280).optional().or(z.literal('')),
  propertyType: z.enum(PROPERTY_TYPES as [string, ...string[]]),
  price: z.coerce.number().int().nonnegative('Price must be a positive number'),
  sizeSqft: z.coerce.number().int().nonnegative().optional(),
  bedrooms: z.coerce.number().int().nonnegative().optional(),
  bathrooms: z.coerce.number().int().nonnegative().optional(),
  floor: z.coerce.number().int().optional(),
  furnishing: z.enum(FURNISHING).default('unfurnished'),
  status: z.enum(PROPERTY_STATUSES as [string, ...string[]]).default('available'),
  description: z.string().max(4000).optional().or(z.literal('')),
  amenities: z.array(z.string().max(80)).max(40).optional(),
  developerName: z.string().max(120).optional().or(z.literal('')),
});
export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;

export const propertyUpdateSchema = propertyCreateSchema.partial().extend({
  propertyId: z.string().uuid(),
});
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;

export const propertyShareSchema = z.object({
  propertyId: z.string().uuid(),
  leadId: z.string().uuid(),
  channel: z.enum(['whatsapp', 'sms']).default('whatsapp'),
  customMessage: z.string().max(2000).optional().or(z.literal('')),
});
export type PropertyShareInput = z.infer<typeof propertyShareSchema>;
