'use client';

import { useTransition } from 'react';
import { Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { callLeadAction } from '@/app/(dashboard)/leads/actions';

interface CallButtonProps {
  leadId: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  label?: string;
}

export function CallButton({
  leadId,
  disabled,
  variant = 'default',
  size = 'sm',
  className,
  label = 'Call',
}: CallButtonProps) {
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const result = await callLeadAction({ leadId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const tag = result.data.isDryRun ? ' (dry run)' : '';
      toast.success(`Bridge call started${tag}`, {
        description: result.data.isDryRun
          ? "Twilio credentials aren't configured — check the calls table for the simulated record."
          : 'Your phone should ring momentarily.',
      });
    });
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled || isPending}
      onClick={onClick}
      loading={isPending}
      className={className}
    >
      <Phone className="h-4 w-4" />
      {label}
    </Button>
  );
}
