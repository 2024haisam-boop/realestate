import Link from 'next/link';
import {
  Building2,
  Sparkles,
  ShieldCheck,
  PhoneCall,
  TrendingUp,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Auto-assigned leads',
    body: 'Round-robin pushes every new lead to the next available agent, instantly.',
  },
  {
    icon: PhoneCall,
    title: 'One-tap bridge calls',
    body: 'Twilio rings the agent first, then dials the lead — no missed connections.',
  },
  {
    icon: TrendingUp,
    title: 'Pipeline at a glance',
    body: 'Eight live metrics, hot leads, and 6 reports — all updated in realtime.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-aware by default',
    body: 'Agents see their own pipeline. Managers see the team. Org-isolated.',
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      {/* Hero panel — desktop only */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-gradient p-10 text-white lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-brand-accent/15 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.85) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <Link href="/" className="relative inline-flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15 backdrop-blur">
            <Building2 className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">EstateFlow</span>
        </Link>

        <div className="relative max-w-md space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/15 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Built for high-velocity teams
            </span>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">
              The CRM your sales floor will actually open every morning.
            </h2>
            <p className="text-base text-white/75">
              Inbound leads, bridge calls, property sharing, and reports — in one mobile-first
              workspace.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="flex items-start gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10 backdrop-blur"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-white/65">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/55">
          © {new Date().getFullYear()} EstateFlow · Built for Indian real estate
        </p>
      </aside>

      {/* Form panel */}
      <main className="relative flex min-h-dvh items-center justify-center bg-hero-gradient px-4 py-10">
        <div className="w-full max-w-md page-enter">
          <Link
            href="/"
            className="mb-6 flex items-center justify-center gap-2 lg:hidden"
            aria-label="Home"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-white shadow-brand">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-text-primary">
              EstateFlow
            </span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
