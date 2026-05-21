import Link from 'next/link';
import { RegisterForm } from './register-form';

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center lg:text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Create your workspace
        </h1>
        <p className="text-sm text-text-secondary">
          Set up an EstateFlow organization. You become the admin.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-md backdrop-blur">
        <RegisterForm />
      </div>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
