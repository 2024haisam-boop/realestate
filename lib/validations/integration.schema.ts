import { z } from 'zod';

const optionalString = z.string().max(500).optional().or(z.literal(''));

export const integrationSettingsSchema = z.object({
  // Twilio
  twilio_account_sid: optionalString,
  twilio_auth_token: optionalString,
  twilio_phone_number: optionalString,
  twilio_whatsapp_number: optionalString,
  // Email
  resend_api_key: optionalString,
  // OpenAI
  openai_api_key: optionalString,
  openai_base_url: optionalString,
  // Zapier (social publish)
  zapier_webhook_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  // Modes
  lead_assignment_mode: z.enum(['round_robin', 'manual', 'least_busy']),
  dry_run_mode: z.boolean(),
  // AI calling agent
  ai_provider: z.enum(['vapi', 'retell', 'bland', 'none']),
  ai_api_key: optionalString,
  ai_assistant_id: optionalString,
  ai_assistant_id_urdu: optionalString,
  ai_calling_enabled: z.boolean(),
  ai_auto_call_new_leads: z.boolean(),
  ai_default_language: z.enum(['english', 'urdu', 'roman_urdu']),
  ai_calling_hours_start: z.coerce.number().int().min(0).max(23),
  ai_calling_hours_end: z.coerce.number().int().min(0).max(23),
  ai_max_calls_per_day: z.coerce.number().int().min(0).max(10000),
});
export type IntegrationSettingsInput = z.infer<typeof integrationSettingsSchema>;
