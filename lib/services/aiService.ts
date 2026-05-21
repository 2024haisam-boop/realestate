import OpenAI from 'openai';
import { createServiceClient } from '@/lib/supabase/server';
import type { PostPlatform } from '@/lib/supabase/types';

const PLATFORM_LIMITS: Record<PostPlatform, number> = {
  instagram_post: 2200,
  instagram_reel: 2200,
  instagram_story: 2200,
  facebook_post: 4000,
  linkedin_post: 3000,
};

interface GenerateCaptionInput {
  organizationId: string;
  platform: PostPlatform;
  prompt: string;
}

export interface GenerateCaptionResult {
  success: boolean;
  caption?: string;
  error?: string;
  /** When true, the call short-circuited because no API key is configured. */
  unconfigured?: boolean;
}

/**
 * Generate a social caption using an OpenAI-compatible API.
 *
 * Looks up credentials in this order:
 *   1. integration_settings.openai_api_key (per-org)
 *   2. process.env.OPENAI_API_KEY (project-wide fallback)
 *
 * Returns { unconfigured: true } when no key is available — callers should
 * render the spec's "AI features require OpenAI API key in Settings > Integrations" message.
 */
export async function generateCaption(input: GenerateCaptionInput): Promise<GenerateCaptionResult> {
  const admin = createServiceClient();
  const { data: settings } = await admin
    .from('integration_settings')
    .select('openai_api_key, openai_base_url')
    .eq('organization_id', input.organizationId)
    .maybeSingle();

  const apiKey = settings?.openai_api_key ?? process.env.OPENAI_API_KEY ?? null;
  const baseURL =
    settings?.openai_base_url ?? process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';

  if (!apiKey) return { success: false, unconfigured: true };

  const platformLabel = input.platform.replace('_', ' ');
  const charLimit = PLATFORM_LIMITS[input.platform];

  const system = [
    'You write captions for a premium Indian real estate brand.',
    'Tone: aspirational, concise, confident. Avoid hyperbole.',
    `Target platform: ${platformLabel}. Keep the caption under ${charLimit} characters.`,
    'Include 3 to 6 relevant hashtags at the end (no #spam).',
    'Output plain text only — no JSON, no markdown headings.',
  ].join(' ');

  try {
    const client = new OpenAI({ apiKey, baseURL });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: input.prompt },
      ],
      max_tokens: 400,
      temperature: 0.8,
    });
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return { success: false, error: 'AI returned an empty response' };
    return { success: true, caption: text.slice(0, charLimit) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI call failed';
    console.error('[aiService.generateCaption]', err);
    return { success: false, error: message };
  }
}
