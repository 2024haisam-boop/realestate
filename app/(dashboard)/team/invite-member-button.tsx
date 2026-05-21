'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  inviteMemberSchema,
  type InviteMemberInput,
} from '@/lib/validations/user.schema';
import { ROLE_DESCRIPTION, ROLE_LABEL, ROLES } from '@/lib/constants';
import { inviteMemberAction } from './actions';

export function InviteMemberButton() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      role: 'sales_agent',
      password: '',
    },
  });

  const role = watch('role');

  const onSubmit = (values: InviteMemberInput) => {
    startTransition(async () => {
      const result = await inviteMemberAction(values);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success('Member added');
      reset();
      setOpen(false);
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Invite member
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Invite a team member</SheetTitle>
          <SheetDescription>
            We&apos;ll create their account and email-confirm it. They can change their password on
            first sign-in.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-name">Full name</Label>
            <Input id="invite-name" placeholder="Arjun Sharma" {...register('fullName')} />
            {errors.fullName ? (
              <p className="text-xs text-brand-danger">{errors.fullName.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" type="email" placeholder="arjun@yourdomain.com" {...register('email')} />
            {errors.email ? <p className="text-xs text-brand-danger">{errors.email.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-phone">Phone (optional)</Label>
            <Input id="invite-phone" placeholder="+919811000003" {...register('phone')} />
            {errors.phone ? <p className="text-xs text-brand-danger">{errors.phone.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setValue('role', v, { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-text-muted">{ROLE_DESCRIPTION[role as keyof typeof ROLE_DESCRIPTION]}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-password">Temporary password</Label>
            <Input
              id="invite-password"
              type="text"
              placeholder="At least 8 characters"
              {...register('password')}
            />
            {errors.password ? (
              <p className="text-xs text-brand-danger">{errors.password.message}</p>
            ) : null}
            <p className="text-xs text-text-muted">Share this securely. They can change it after signing in.</p>
          </div>

          <Button type="submit" size="lg" className="w-full" loading={isPending}>
            Add member
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
