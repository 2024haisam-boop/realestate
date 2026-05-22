import { createServiceClient } from '@/lib/supabase/server';
import { sendMessage } from './messageService';
import { formatPKR } from '@/lib/utils';
import type { MessageChannel } from '@/lib/supabase/types';

export interface ShareWithLeadInput {
  leadId: string;
  propertyId: string;
  sharedBy: string;
  organizationId: string;
  channel: MessageChannel;
  customMessage?: string | null;
}

export interface ShareWithLeadResult {
  success: boolean;
  shareUrl: string;
  messageId?: string;
  isDryRun?: boolean;
  error?: string;
}

/**
 * Build the default WhatsApp message for sharing a property with a lead.
 * Uses the exact template from the spec.
 */
function buildShareMessage(args: {
  leadName: string;
  propertyTitle: string;
  location: string;
  price: number;
  bedrooms: number | null;
  sizeSqft: number | null;
  shareUrl: string;
}): string {
  const parts = [
    `Hi ${args.leadName}, sharing details of ${args.propertyTitle} in ${args.location}.`,
    `Price: ${formatPKR(args.price)}.`,
  ];
  if (args.bedrooms) parts.push(`Bedrooms: ${args.bedrooms}.`);
  if (args.sizeSqft) parts.push(`Size: ${args.sizeSqft} sqft.`);
  parts.push(`View photos and details: ${args.shareUrl}`);
  parts.push('- Team EstateFlow');
  return parts.join(' ');
}

/**
 * Share a property with a lead:
 *   1. Look up property + lead.
 *   2. Build the share URL using the property's share_token.
 *   3. Compose the message (template or override).
 *   4. Send via messageService (respects dry-run).
 *   5. Insert a lead_property_shares audit row.
 *   6. Log a property_shared activity.
 */
export async function shareWithLead(input: ShareWithLeadInput): Promise<ShareWithLeadResult> {
  const admin = createServiceClient();

  const { data: property } = await admin
    .from('properties')
    .select('id, title, location, price, bedrooms, size_sqft, share_token')
    .eq('id', input.propertyId)
    .maybeSingle();
  if (!property) return { success: false, shareUrl: '', error: 'Property not found' };

  const { data: lead } = await admin
    .from('leads')
    .select('id, full_name, phone, email')
    .eq('id', input.leadId)
    .maybeSingle();
  if (!lead) return { success: false, shareUrl: '', error: 'Lead not found' };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const shareUrl = `${baseUrl}/property/${property.share_token}`;

  const body =
    input.customMessage && input.customMessage.trim().length > 0
      ? input.customMessage
      : buildShareMessage({
          leadName: lead.full_name,
          propertyTitle: property.title,
          location: property.location,
          price: property.price,
          bedrooms: property.bedrooms,
          sizeSqft: property.size_sqft,
          shareUrl,
        });

  // Pick the destination address based on channel.
  const to =
    input.channel === 'email'
      ? (lead.email ?? '')
      : lead.phone;
  if (!to) {
    return {
      success: false,
      shareUrl,
      error: input.channel === 'email' ? 'Lead has no email on file' : 'Lead has no phone on file',
    };
  }

  const sendResult = await sendMessage({
    to,
    body,
    channel: input.channel,
    leadId: input.leadId,
    agentId: input.sharedBy,
    organizationId: input.organizationId,
  });
  if (!sendResult.success) {
    return { success: false, shareUrl, error: sendResult.error };
  }

  // Audit row
  await admin.from('lead_property_shares').insert({
    organization_id: input.organizationId,
    lead_id: input.leadId,
    property_id: input.propertyId,
    shared_by: input.sharedBy,
    channel: input.channel,
    message_sent: body,
  });

  // Activity log
  await admin.from('activities').insert({
    organization_id: input.organizationId,
    lead_id: input.leadId,
    user_id: input.sharedBy,
    type: 'property_shared',
    title: `Shared ${property.title}`,
    description: `via ${input.channel.toUpperCase()}`,
    metadata: { propertyId: property.id, shareUrl, channel: input.channel } as never,
  });

  return {
    success: true,
    shareUrl,
    messageId: sendResult.messageId,
    isDryRun: sendResult.isDryRun,
  };
}
