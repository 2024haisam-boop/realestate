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
});
export type IntegrationSettingsInput = z.infer<typeof integrationSettingsSchema>;
