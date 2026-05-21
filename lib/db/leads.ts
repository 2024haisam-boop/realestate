import { createClient, createServiceClient } from '@/lib/supabase/server';
import type {
  LeadRow,
  LeadSource,
  LeadStatus,
  LeadTemperature,
  PropertyInterest,
} from '@/lib/supabase/types';

export interface LeadWithAgent extends LeadRow {
  agent: { id: string; full_name: string; avatar_url: string | null } | null;
}

export interface LeadListFilters {
  status?: LeadStatus | 'all';
  temperature?: LeadTemperature | 'all';
  source?: LeadSource | 'all';
  assignedAgentId?: string | 'mine' | 'unassigned' | 'all';
  isHot?: boolean;
  search?: string;
}

interface LeadListOptions {
  organizationId: string;
  currentUserId: string;
  filters?: LeadListFilters;
  limit?: number;
}

export async function listLeads({
  organizationId,
  currentUserId,
  filters = {},
  limit = 100,
}: LeadListOptions): Promise<LeadWithAgent[]> {
  const supabase = await createClient();
  let query = supabase
    .from('leads')
    .select(
      'id, organization_id, full_name, phone, email, source, property_type, budget_min, budget_max, preferred_location, status, temperature, assigned_agent_id, notes, next_followup_at, last_contacted_at, is_hot, external_id, created_at, updated_at, agent:profiles(id, full_name, avatar_url)',
    )
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
  if (filters.temperature && filters.temperature !== 'all') query = query.eq('temperature', filters.temperature);
  if (filters.source && filters.source !== 'all') query = query.eq('source', filters.source);
  if (filters.isHot) query = query.eq('is_hot', true);

  if (filters.assignedAgentId === 'mine') query = query.eq('assigned_agent_id', currentUserId);
  else if (filters.assignedAgentId === 'unassigned') query = query.is('assigned_agent_id', null);
  else if (filters.assignedAgentId && filters.assignedAgentId !== 'all') {
    query = query.eq('assigned_agent_id', filters.assignedAgentId);
  }

  if (filters.search && filters.search.trim()) {
    const term = filters.search.trim();
    query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    organization_id: row.organization_id,
    full_name: row.full_name,
    phone: row.phone,
    email: row.email,
    source: row.source,
    property_type: row.property_type,
    budget_min: row.budget_min,
    budget_max: row.budget_max,
    preferred_location: row.preferred_location,
    status: row.status,
    temperature: row.temperature,
    assigned_agent_id: row.assigned_agent_id,
    notes: row.notes,
    next_followup_at: row.next_followup_at,
    last_contacted_at: row.last_contacted_at,
    is_hot: row.is_hot,
    external_id: row.external_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    agent: Array.isArray(row.agent) ? (row.agent[0] ?? null) : row.agent,
  }));
}

export async function getLeadById(leadId: string): Promise<LeadWithAgent | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('leads')
    .select(
      'id, organization_id, full_name, phone, email, source, property_type, budget_min, budget_max, preferred_location, status, temperature, assigned_agent_id, notes, next_followup_at, last_contacted_at, is_hot, external_id, created_at, updated_at, agent:profiles(id, full_name, avatar_url)',
    )
    .eq('id', leadId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    ...data,
    agent: Array.isArray(data.agent) ? (data.agent[0] ?? null) : data.agent,
  } as LeadWithAgent;
}

interface FindByExternalIdInput {
  organizationId: string;
  externalId: string;
}

/** Webhook deduplication helper. */
export async function findLeadByExternalId({
  organizationId,
  externalId,
}: FindByExternalIdInput): Promise<LeadRow | null> {
  const admin = createServiceClient();
  const { data } = await admin
    .from('leads')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('external_id', externalId)
    .maybeSingle();
  return data;
}

interface CreateLeadInput {
  organizationId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  source?: LeadSource;
  propertyType?: PropertyInterest | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  preferredLocation?: string | null;
  notes?: string | null;
  status?: LeadStatus;
  temperature?: LeadTemperature;
  assignedAgentId?: string | null;
  isHot?: boolean;
  externalId?: string | null;
  /** Use the service-role client (for webhooks). Default false. */
  useServiceRole?: boolean;
}

export async function createLead(input: CreateLeadInput): Promise<LeadRow | null> {
  const supabase = input.useServiceRole ? createServiceClient() : await createClient();
  const { data, error } = await supabase
    .from('leads')
    .insert({
      organization_id: input.organizationId,
      full_name: input.fullName,
      phone: input.phone,
      email: input.email ?? null,
      source: input.source ?? 'manual',
      property_type: input.propertyType ?? null,
      budget_min: input.budgetMin ?? null,
      budget_max: input.budgetMax ?? null,
      preferred_location: input.preferredLocation ?? null,
      notes: input.notes ?? null,
      status: input.status ?? 'new',
      temperature: input.temperature ?? 'cold',
      assigned_agent_id: input.assignedAgentId ?? null,
      is_hot: input.isHot ?? false,
      external_id: input.externalId ?? null,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[leads.createLead] insert failed', error);
    return null;
  }
  return data;
}

interface UpdateLeadInput {
  leadId: string;
  patch: Partial<{
    full_name: string;
    phone: string;
    email: string | null;
    source: LeadSource;
    property_type: PropertyInterest | null;
    budget_min: number | null;
    budget_max: number | null;
    preferred_location: string | null;
    notes: string | null;
    status: LeadStatus;
    temperature: LeadTemperature;
    assigned_agent_id: string | null;
    is_hot: boolean;
    last_contacted_at: string | null;
    next_followup_at: string | null;
  }>;
  useServiceRole?: boolean;
}

export async function updateLead({ leadId, patch, useServiceRole }: UpdateLeadInput): Promise<LeadRow | null> {
  const supabase = useServiceRole ? createServiceClient() : await createClient();
  const { data, error } = await supabase
    .from('leads')
    .update(patch)
    .eq('id', leadId)
    .select('*')
    .single();
  if (error) {
    console.error('[leads.updateLead] update failed', error);
    return null;
  }
  return data;
}

export async function deleteLead(leadId: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from('leads').delete().eq('id', leadId);
  return !error;
}
