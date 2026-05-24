'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerSchema, type RegisterInput } from '@/lib/validations/user.schema';
import { registerAction } from '../actions';

export function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { organizationName: '', fullName: '', email: '', password: '' },
  });

  const onSubmit = (values: RegisterInput) => {
    setServerError(null);
    startTransition(async () => {
      // Server action redirects on success — we only land here on failure.
      const result = await registerAction(values);
      if (result && !result.success) {
        setServerError(result.error);
        toast.error(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="organizationName">Organization name</Label>
        <Input
          id="organizationName"
          placeholder="Sapphire Estates (Pvt) Ltd"
          {...register('organizationName')}
        />
        {errors.organizationName ? (
          <p className="text-xs text-brand-danger">{errors.organizationName.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fullName">Your full name</Label>
        <Input id="fullName" placeholder="Ahmed Khan" autoComplete="name" {...register('fullName')} />
        {errors.fullName ? (
          <p className="text-xs text-brand-danger">{errors.fullName.message}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          {...register('email')}
        />
        {errors.email ? <p className="text-xs text-brand-danger">{errors.email.message}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          {...register('password')}
        />
        {errors.password ? (
          <p className="text-xs text-brand-danger">{errors.password.message}</p>
        ) : null}
      </div>

      {serverError ? (
        <div className="rounded-md border border-brand-danger/30 bg-brand-danger/10 px-3 py-2 text-sm text-brand-danger">
          {serverError}
        </div>
      ) : null}

      <Button type="submit" size="lg" className="w-full" loading={isPending}>
        Create workspace
      </Button>
    </form>
  );
}
