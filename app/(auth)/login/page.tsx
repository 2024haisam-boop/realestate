import Link from 'next/link';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center lg:text-left">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Welcome back</h1>
        <p className="text-sm text-text-secondary">Sign in to your EstateFlow workspace.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-md backdrop-blur">
        <LoginForm />
      </div>

      <p className="text-center text-sm text-text-secondary">
        New to EstateFlow?{' '}
        <Link href="/register" className="font-medium text-brand-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
