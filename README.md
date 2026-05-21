# EstateFlow CRM

Mobile-first real estate CRM for high-velocity sales teams. Auto-assigns
inbound leads via round-robin, places agent-first bridge calls through Twilio,
shares properties with leads over WhatsApp, and tracks the whole pipeline —
attendance, social calendar, and reports included.

---

## 1. Overview

| Surface | What it does |
|---|---|
| **Leads** | Manual + webhook intake, round-robin assignment, status board, lead timeline. |
| **Calls** | Twilio bridge: rings the agent first, dials the lead, joins both in a conference, records, logs duration. Dry-run mode by default. |
| **Properties** | Inventory with multi-image gallery, swipeable on mobile, public share link, ±20% budget match against leads. |
| **Messaging** | WhatsApp + SMS via Twilio, 6 built-in follow-up templates, variable substitution, property share template. |
| **Follow-ups** | Scheduler with Due / Upcoming / Completed / Missed tabs, snooze, complete with notes. |
| **Attendance** | GPS check-in + optional selfie, status (present/late) computed against a 9:30 AM threshold, admin roster + CSV export. |
| **Social media** | Content calendar (month view), platform-aware post form, AI caption helper via OpenAI-compatible API, Zapier webhook dispatch on publish. |
| **Reports** | 6 Recharts visualisations: leads by source, leads by status, agent performance, follow-up completion, properties shared, won/lost funnel. |
| **Notifications** | In-app realtime bell with unread badge, full notifications page with mark-read. |

Multi-tenant from day one. Every row is org-scoped; RLS policies enforce it.

---

## 2. Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript strict mode |
| Styling | Tailwind CSS v3, shadcn/ui (25 components) |
| Backend | Next.js API Routes + Server Actions |
| Database | Supabase Postgres (15 tables, 19 enums, role-aware RLS) |
| Auth | Supabase Auth (admin-create + auto sign-in, no email confirmation gate) |
| Storage | Supabase Storage (`property-images`, `attendance-selfies`) |
| Realtime | Supabase Realtime → React Query invalidation |
| Voice | Twilio Voice (Programmable Voice + Conferences) |
| Messaging | Twilio WhatsApp Business API + Programmable SMS |
| AI | OpenAI-compatible adapter (per-org or env-level credentials) |
| Hosting | Vercel (Edge middleware + Serverless functions) |
| Validation | Zod (server + client) |
| Forms | React Hook Form + `@hookform/resolvers/zod` |
| State | Zustand for UI state, TanStack Query for server cache |
| Icons | Lucide React (only) |
| Fonts | Geist Sans + Geist Mono via `next/font` |
| Dates | date-fns |
| Charts | Recharts |

---

## 3. Prerequisites

- **Node 20+** (project uses Next 15.1)
- **A Supabase project** — free tier is fine. Get the project URL + anon key + service role key from Settings → API.
- **A Twilio account** (optional during dev) — only needed when you flip `dry_run_mode` off.
- **An OpenAI API key** (optional) — only needed for AI caption generation.

---

## 4. Environment setup

```bash
cp .env.local.example .env.local
```

Fill in the values:

| Variable | Required? | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | Supabase anon (public) JWT |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | Supabase service-role JWT — used by webhooks, sign-up, storage |
| `NEXT_PUBLIC_APP_URL` | ✓ | e.g. `http://localhost:3000` — used in TwiML callback URLs + share links |
| `TWILIO_ACCOUNT_SID` | only when going live | Per-org settings override env vars |
| `TWILIO_AUTH_TOKEN` | only when going live | |
| `TWILIO_PHONE_NUMBER` | only when going live | Sender number for voice + SMS |
| `TWILIO_WHATSAPP_NUMBER` | only when going live | Form: `whatsapp:+14155238886` |
| `RESEND_API_KEY` | optional | Email channel (stubbed in Phase 5) |
| `OPENAI_API_KEY` | optional | AI caption fallback if not set per-org |
| `LEAD_WEBHOOK_SECRET` | ✓ for webhook | 32+ char random secret used for HMAC validation |
| `DRY_RUN_MODE` | ✓ for dev | `true` short-circuits Twilio entirely |

---

## 5. Database setup

The schema, RLS policies, helper functions, and triggers all live under
[supabase/](supabase/). The easiest way to get going:

1. Open the Supabase dashboard SQL Editor for your project.
2. Paste the entire contents of [supabase/setup.sql](supabase/setup.sql).
3. Click **Run**.

You'll get 15 tables, 19 enums, the `get_user_org_id()` helper, and all RLS
policies in one shot.

To re-set a partial database (e.g. you ran some migrations and they failed
midway):

```sql
-- run supabase/fresh-setup.sql once — drops first, then re-creates
```

Or use the Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

To load the demo data (1 org, 5 users, 20 leads, 10 properties, etc.):

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
# OR paste seed.sql into the SQL editor
```

After seeding, sign in as any seeded user with password `Password123!` (e.g.
`vikram@prestigerealty.com` is the admin).

**Verify the database is ready** by hitting the diagnostic:

```bash
curl http://localhost:3000/api/diagnose
# expect: { "ok": true, "tables": { ... all 15 listed as exists: true } }
```

---

## 6. Running locally

```bash
npm install
npm run dev
```

Then:

1. Open <http://localhost:3000/register> to create your first workspace (you
   become its admin) — **or** sign in with a seeded account if you ran
   `seed.sql`.
2. Land on `/dashboard` — the 8 metric cards, hot leads, follow-ups due, and
   live activity feed all start populating from real data.

---

## 7. Twilio setup

The bridge call code lives in
[lib/services/callService.ts](lib/services/callService.ts) and the TwiML
endpoints under [app/api/twilio/](app/api/twilio/).

When you're ready to flip from dry-run to real calls:

1. **Buy a Twilio number** (Voice + SMS capable, and a WhatsApp sender if you
   want WhatsApp).
2. **Set the per-org credentials in Supabase** (preferred) — open the
   `integration_settings` row for the org and fill in `twilio_account_sid`,
   `twilio_auth_token`, `twilio_phone_number`, `twilio_whatsapp_number`. Flip
   `dry_run_mode` to `false`.
3. **Or set the env-level fallbacks** in `.env.local` and remove
   `DRY_RUN_MODE=true`.
4. **Expose your dev server publicly** (Twilio needs a callable URL for
   TwiML + status callbacks):
   ```bash
   npx ngrok http 3000
   # then set NEXT_PUBLIC_APP_URL=https://<your-ngrok-host>.ngrok.app
   ```
5. **Confirm the status callback** points at `<NEXT_PUBLIC_APP_URL>/api/twilio/status`.

Flow when real:

```
[lead webhook arrives]
  -> POST /api/webhooks/leads
  -> leadAssignmentService picks an agent (round-robin)
  -> callService.bridgeCall(agent_phone)
      Twilio rings the agent first
      -> agent answers -> /api/twilio/voice serves <Gather><Say>...</Say></Gather>
      -> agent presses key -> /api/twilio/conference dials the lead + bridges both
      -> /api/twilio/status updates the calls row
```

---

## 8. Webhook testing

The lead intake webhook is `POST /api/webhooks/leads` with HMAC-SHA256 auth.

```bash
BODY='{"fullName":"Test Lead","phone":"+919811000099","email":"t@x.com","source":"36acre","propertyType":"apartment","budgetMin":7500000,"budgetMax":12000000,"preferredLocation":"Gurgaon","externalId":"36ACRE-0001","organizationSlug":"prestige-realty"}'

SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$LEAD_WEBHOOK_SECRET" | sed 's/^.* //')

curl -X POST http://localhost:3000/api/webhooks/leads \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$BODY"
```

Expected response (HTTP 201):

```json
{
  "success": true,
  "leadId": "…",
  "assignedAgent": "Arjun Sharma",
  "callTriggered": true
}
```

Idempotency: if you re-send the same `externalId`, the response returns the
existing `leadId` with `deduped: true` and HTTP 200.

---

## 9. Dry run mode

When `DRY_RUN_MODE=true` **or** the org's `integration_settings.dry_run_mode`
is `true` **or** Twilio credentials aren't filled in, the system:

- Logs every outbound Twilio interaction to stdout with a `[DRY RUN]` prefix.
- Saves `calls` / `messages` rows with `is_dry_run = true`.
- Returns a mock `callId` / `messageId` to the caller.
- Surfaces a "(dry run)" badge in success toasts.

The rest of the system (DB, activity log, notifications, assignments) behaves
exactly as production — only the outbound network call is suppressed.

The check is at [lib/services/callService.ts](lib/services/callService.ts)
and [lib/services/messageService.ts](lib/services/messageService.ts).

---

## 10. Deployment (Vercel + Supabase)

1. **Push to GitHub.**
2. **Import to Vercel** — point at this repo, Framework auto-detects Next.js
   15.
3. **Set env vars** in Vercel Project Settings → Environment Variables. Use
   the same names as `.env.local.example`. Set `DRY_RUN_MODE=false` for prod.
4. **Set `NEXT_PUBLIC_APP_URL`** to your production URL (e.g.
   `https://crm.example.com`) — required for share links + Twilio callbacks.
5. **Set Supabase project URL + keys**. The service role key goes in the
   Vercel env vars, **not** in any committed file.
6. **Configure Twilio**:
   - Add your prod URL `/api/twilio/status` as the status callback.
   - Confirm the WhatsApp sender is approved.
7. **Configure your lead-source webhook integrations** (36acre, MagicBricks,
   etc.) to POST to `https://<your-app>/api/webhooks/leads` with the
   `X-Webhook-Signature: sha256=…` header.
8. **Optional but recommended**: set `TZ=Asia/Kolkata` in Vercel env vars so
   the attendance `late` cutoff (9:30 AM) is computed in your business
   timezone.

---

## 11. Role reference

Five roles live in `profiles.role`. Routes and server actions enforce these
on top of RLS.

| Role | Can do | Cannot do |
|---|---|---|
| **admin** | Everything: invite/remove team, manage integration settings, see all leads, all reports, all attendance, delete properties/leads | n/a |
| **sales_manager** | See all leads + all attendance, run reports, reassign leads, delete leads/properties | Edit integration settings, invite/remove team |
| **sales_agent** | See only leads assigned to them, place bridge calls, send templates, schedule follow-ups, share properties | See other agents' leads, delete leads/properties, edit integration settings |
| **field_executive** | Handle site visits, check in/out, see only leads assigned to them | Delete records, edit integration settings |
| **social_media_manager** | Create/edit/schedule/delete social posts, use AI caption helper | See lead pipeline data, delete leads or properties |

RLS policies are defined in
[supabase/migrations/014_rls_policies.sql](supabase/migrations/014_rls_policies.sql).

---

## Project layout

```
estateflow-crm/
├── app/
│   ├── (auth)/                  ← Sign in / sign up
│   ├── (dashboard)/             ← Main app — gated by middleware
│   │   ├── dashboard/           ← 8 metric cards + recent activity
│   │   ├── leads/               ← List, detail (with timeline), new
│   │   ├── properties/          ← Inventory with gallery
│   │   ├── followups/           ← Due/Upcoming/Completed/Missed tabs
│   │   ├── attendance/          ← Personal + admin team view
│   │   ├── social/              ← Posts + content calendar
│   │   ├── reports/             ← 6 Recharts dashboards
│   │   ├── notifications/       ← Realtime list + mark-read
│   │   ├── team/                ← Invite + role management
│   │   └── settings/            ← Workspace config
│   ├── api/
│   │   ├── webhooks/leads/      ← External lead intake (HMAC-signed)
│   │   ├── twilio/              ← TwiML endpoints + status callback
│   │   ├── properties/[id]/share/ ← HTTP share endpoint
│   │   └── diagnose/            ← Schema + orphan-user diagnostics
│   └── property/[shareToken]/   ← PUBLIC property page (no auth)
├── components/
│   ├── ui/                      ← 25 shadcn/ui primitives
│   ├── layout/                  ← Mobile shell, top bar, bottom nav
│   ├── leads/  properties/  followups/  attendance/
│   ├── social/  calls/  dashboard/  reports/
│   └── shared/                  ← EmptyState, ConfirmDialog, etc.
├── lib/
│   ├── supabase/                ← Browser / server / middleware clients
│   ├── services/                ← Twilio, OpenAI, storage, share, assignment, attendance
│   ├── db/                      ← Typed query modules per entity
│   ├── validations/             ← Zod schemas
│   ├── stores/                  ← Zustand (page title)
│   ├── constants.ts             ← Roles, statuses, templates, etc.
│   └── utils.ts                 ← cn(), formatINR(), shortRelative()
├── hooks/                       ← useNotifications, useRealtime
├── supabase/
│   ├── migrations/              ← 14 SQL migrations, run in order
│   ├── setup.sql                ← Concatenated, paste-and-run
│   ├── reset.sql                ← Drop everything
│   ├── fresh-setup.sql          ← Drop then re-create in one paste
│   └── seed.sql                 ← Demo org + users + 20 leads + 10 properties
├── middleware.ts                ← Session refresh + protected-route redirect
└── README.md                    ← This file
```

---

## License

Internal — bundled with the EstateFlow build.
