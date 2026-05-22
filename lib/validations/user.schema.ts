import { z } from 'zod';
import { ROLES } from '../constants';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is too short').max(80),
  fullName: z.string().min(2, 'Enter your full name').max(80),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const inviteMemberSchema = z.object({
  fullName: z.string().min(2, 'Full name is too short').max(80),
  email: z.string().email('Enter a valid email'),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Phone must be in E.164 format, e.g. +923001000003')
    .optional()
    .or(z.literal('')),
  role: z.enum(ROLES as [string, ...string[]]),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(ROLES as [string, ...string[]]).optional(),
  isActive: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
});
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
