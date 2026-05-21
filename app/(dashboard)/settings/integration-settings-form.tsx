'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  rotateWebhookSecretAction,
  testTwilioCredentialsAction,
  updateIntegrationSettingsAction,
} from './actions';
import {
  integrationSettingsSchema,
  type IntegrationSettingsInput,
} from '@/lib/validations/integration.schema';
import type { IntegrationSettingsRow } from '@/lib/supabase/types';

interface IntegrationSettingsFormProps {
  settings: IntegrationSettingsRow;
  webhookUrl: string;
}

function SecretInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10 font-mono text-xs"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted hover:text-text-secondary"
        aria-label={visible ? 'Hide value' : 'Show value'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function IntegrationSettingsForm({ settings, webhookUrl }: IntegrationSettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isTesting, startTest] = useTransition();
  const [isRotating, startRotate] = useTransition();
  const [secret, setSecret] = useState(settings.webhook_secret);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<IntegrationSettingsInput>({
    resolver: zodResolver(integrationSettingsSchema),
    defaultValues: {
      twilio_account_sid: settings.twilio_account_sid ?? '',
      twilio_auth_token: settings.twilio_auth_token ?? '',
      twilio_phone_number: settings.twilio_phone_number ?? '',
      twilio_whatsapp_number: settings.twilio_whatsapp_number ?? '',
      resend_api_key: settings.resend_api_key ?? '',
      openai_api_key: settings.openai_api_key ?? '',
      openai_base_url: settings.openai_base_url ?? '',
      zapier_webhook_url: settings.zapier_webhook_url ?? '',
      lead_assignment_mode: settings.lead_assignment_mode,
      dry_run_mode: settings.dry_run_mode,
    },
  });

  const dryRun = watch('dry_run_mode');
  const assignmentMode = watch('lead_assignment_mode');

  const onSubmit = (values: IntegrationSettingsInput) => {
    startTransition(async () => {
      const r = await updateIntegrationSettingsAction(values);
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      toast.success('Integration settings saved');
      router.refresh();
    });
  };

  const onTest = () => {
    const sid = getValues('twilio_account_sid') ?? '';
    const token = getValues('twilio_auth_token') ?? '';
    if (!sid || !token) {
      toast.error('Enter both Account SID and Auth Token first');
      return;
    }
    startTest(async () => {
      const r = await testTwilioCredentialsAction({ sid, token });
      if (!r.success) {
        toast.error('Twilio rejected the credentials', { description: r.error });
        return;
      }
      toast.success('Twilio credentials look good ✓', {
        description: `${r.data.accountFriendlyName} · ${r.data.status}`,
      });
    });
  };

  const onRotate = () => {
    startRotate(async () => {
      const r = await rotateWebhookSecretAction();
      if (!r.success) {
        toast.error(r.error);
        return;
      }
      setSecret(r.data.secret);
      toast.success('Webhook secret rotated', {
        description: 'Update your lead-source integrations with the new value.',
      });
    });
  };

  const copyToClipboard = (text: string, label: string) => async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Dry run + assignment mode */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Mode</CardTitle>
            <CardDescription>
              Dry-run is on by default. Flip it off only when Twilio is fully configured and tested.
            </CardDescription>
          </div>
          <Badge variant={dryRun ? 'warning' : 'success'}>
            {dryRun ? 'Dry run' : 'Live'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between rounded-lg border border-border bg-surface-2 p-3">
            <div>
              <p className="text-sm font-medium text-text-primary">Dry-run mode</p>
              <p className="text-xs text-text-secondary">
                Simulate Twilio calls + messages instead of sending them. Activity log still fires.
              </p>
            </div>
            <Switch
              checked={dryRun}
              onCheckedChange={(v) => setValue('dry_run_mode', v, { shouldDirty: true })}
            />
          </label>

          <div className="space-y-1.5">
            <Label>Lead assignment</Label>
            <Select
              value={assignmentMode}
              onValueChange={(v) =>
                setValue('lead_assignment_mode', v as IntegrationSettingsInput['lead_assignment_mode'], {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="round_robin">Round robin (default)</SelectItem>
                <SelectItem value="least_busy">Least busy</SelectItem>
                <SelectItem value="manual">Manual — never auto-assign</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-text-muted">
              Round-robin cycles through active sales agents. Least busy picks the one with the fewest
              open leads. Manual leaves new webhook leads unassigned until a manager picks an owner.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Twilio */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Twilio</CardTitle>
            <CardDescription>
              Bridge calls + WhatsApp + SMS. Get values from{' '}
              <a
                href="https://console.twilio.com"
                target="_blank"
                rel="noreferrer"
                className="text-brand-primary hover:underline"
              >
                console.twilio.com
              </a>
              .
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onTest} loading={isTesting}>
            <CheckCircle2 className="h-4 w-4" />
            Test
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="twilio_account_sid">Account SID</Label>
            <SecretInput
              id="twilio_account_sid"
              value={watch('twilio_account_sid') ?? ''}
              onChange={(v) => setValue('twilio_account_sid', v, { shouldDirty: true })}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="twilio_auth_token">Auth Token</Label>
            <SecretInput
              id="twilio_auth_token"
              value={watch('twilio_auth_token') ?? ''}
              onChange={(v) => setValue('twilio_auth_token', v, { shouldDirty: true })}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="twilio_phone_number">Voice + SMS sender</Label>
              <Input
                id="twilio_phone_number"
                placeholder="+1XXXXXXXXXX"
                {...register('twilio_phone_number')}
              />
              <p className="text-xs text-text-muted">E.164 format, e.g. +918045678901</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="twilio_whatsapp_number">WhatsApp sender</Label>
              <Input
                id="twilio_whatsapp_number"
                placeholder="whatsapp:+14155238886"
                {...register('twilio_whatsapp_number')}
              />
              <p className="text-xs text-text-muted">
                Use the sandbox <code className="font-mono">whatsapp:+14155238886</code> for testing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-accent" />
            AI captions
          </CardTitle>
          <CardDescription>
            OpenAI-compatible. Used by the social media caption generator. Optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="openai_api_key">API key</Label>
            <SecretInput
              id="openai_api_key"
              value={watch('openai_api_key') ?? ''}
              onChange={(v) => setValue('openai_api_key', v, { shouldDirty: true })}
              placeholder="sk-..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="openai_base_url">Base URL (optional)</Label>
            <Input
              id="openai_base_url"
              placeholder="https://api.openai.com/v1"
              {...register('openai_base_url')}
            />
            <p className="text-xs text-text-muted">
              Override to use a compatible provider (Together, Groq, etc.).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Zapier */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base inline-flex items-center gap-2">
            <Zap className="h-4 w-4 text-brand-accent" />
            Zapier webhook
          </CardTitle>
          <CardDescription>
            Published social posts POST to this URL so your Zap can publish to IG / FB / LinkedIn.
            Optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="https://hooks.zapier.com/hooks/catch/..."
            {...register('zapier_webhook_url')}
          />
          {errors.zapier_webhook_url ? (
            <p className="mt-1 text-xs text-brand-danger">{errors.zapier_webhook_url.message}</p>
          ) : null}
        </CardContent>
      </Card>

      {/* Lead intake webhook */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="text-base inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-primary" />
              Lead intake webhook
            </CardTitle>
            <CardDescription>
              Point your lead sources at this URL with an HMAC-SHA256 signature header.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRotate}
            loading={isRotating}
          >
            <RefreshCcw className="h-4 w-4" />
            Rotate
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>URL</Label>
            <div className="flex gap-2">
              <code className="flex-1 truncate rounded-md bg-surface-2 px-3 py-2 font-mono text-xs">
                {webhookUrl}
              </code>
              <Button type="button" variant="outline" size="sm" onClick={copyToClipboard(webhookUrl, 'URL')}>
                Copy
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Secret</Label>
            <div className="flex gap-2">
              <code className="flex-1 truncate rounded-md bg-surface-2 px-3 py-2 font-mono text-xs">
                {secret.slice(0, 8)}…{secret.slice(-6)}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyToClipboard(secret, 'Secret')}
              >
                Copy full
              </Button>
            </div>
            <p className="text-xs text-text-muted">
              Compute <code className="font-mono">HMAC-SHA256(raw_body, secret)</code> and send it in
              the <code className="font-mono">X-Webhook-Signature: sha256=&lt;hex&gt;</code> header.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={isPending} disabled={!isDirty && !isPending}>
          Save settings
        </Button>
      </div>
    </form>
  );
}
