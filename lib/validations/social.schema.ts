import { z } from 'zod';

const PLATFORMS = [
  'instagram_post',
  'instagram_reel',
  'instagram_story',
  'facebook_post',
  'linkedin_post',
] as const;

const STATUSES = ['idea', 'draft', 'scheduled', 'published', 'cancelled'] as const;

export const socialPostCreateSchema = z.object({
  platform: z.enum(PLATFORMS),
  caption: z.string().max(63206).optional().or(z.literal('')),
  status: z.enum(STATUSES).default('idea'),
  scheduledAt: z.string().optional().or(z.literal('')),
  assignedTo: z.string().uuid().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  mediaUrls: z.array(z.string().url().max(2048)).max(10).optional(),
});
export type SocialPostCreateInput = z.infer<typeof socialPostCreateSchema>;

export const socialPostUpdateSchema = socialPostCreateSchema.partial().extend({
  postId: z.string().uuid(),
});
export type SocialPostUpdateInput = z.infer<typeof socialPostUpdateSchema>;

export const generateCaptionSchema = z.object({
  platform: z.enum(PLATFORMS),
  prompt: z.string().min(3, 'Describe your post in a few words').max(400),
});
export type GenerateCaptionInput = z.infer<typeof generateCaptionSchema>;
