# Going live — demo this week, production in 2–4 weeks

Two paths. Pick one.

---

## Path A — Demo to your property friends (today, ~1 hour, Rs 0)

Goal: a public URL they can open on their phones, sign up, and click around.
Twilio is **not needed** — dry-run mode shows the entire flow with simulated
calls and messages.

### Step 1 — Push to GitHub (5 min)

```bash
cd estateflow-crm
git init
git add .
git commit -m "EstateFlow CRM initial build"
gh repo create estateflow-crm --private --source=. --push
# or push to an existing repo
```

If you skipped Phase 1's `.gitignore`, confirm `.env.local` and
`.env.local.example` are NOT in the commit. They contain secrets.

### Step 2 — Deploy to Vercel (10 min)

1. Go to <https://vercel.com/new>, import your GitHub repo.
2. Framework auto-detects: **Next.js 15**. Click **Deploy** without other changes.
3. After the first deploy fails (it will, no env vars), open **Project →
   Settings → Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | from your `.env.local` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from your `.env.local` |
   | `SUPABASE_SERVICE_ROLE_KEY` | from your `.env.local` |
   | `NEXT_PUBLIC_APP_URL` | `https://<your-project>.vercel.app` (set this **after** the first deploy when you know the URL) |
   | `LEAD_WEBHOOK_SECRET` | run `openssl rand -hex 32` for a strong value |
   | `DRY_RUN_MODE` | `true` |

4. **Redeploy** (Deployments tab → ⋯ → Redeploy).
5. Open your live URL. You should see `/login`.

### Step 3 — Tell Supabase about the new origin (2 min)

Supabase blocks auth flows from unknown origins by default.

1. Open <https://supabase.com/dashboard/project/_/auth/url-configuration>
2. Add your Vercel URL to **Site URL** and **Redirect URLs**.

### Step 4 — Share the demo (1 min)

Send the URL to your friends. They can:

- **Register a fresh workspace** → they become admin of their own org.
- **Or, sign in as your seed admin** (`ahmed@sapphireestates.pk` /
  `Password123!`) — if you ran [seed.sql](supabase/seed.sql), this gives them
  the 20-lead / 10-property demo dataset to click through.

Show them:

- Dashboard with 8 live metric cards + recent activity
- Lead detail page → click Call ("dry run" toast appears, activity is logged)
- Send Property → pick a lead → see the share link
- Public share page (no sign-in) — open in incognito to prove it
- Reports → all 6 charts
- Add a team member from `/team`

**That's the demo.** Cost: Rs 0. Time to first show: ~1 hour.

---

## Path B — Real go-live (2–4 weeks, ~Rs 2,000–10,000/mo)

When you want to actually place real calls, send real WhatsApps, and ingest
real leads from your sources.

### What you need

| Service | Purpose | Pakistani KYC needed? | Approx cost (small team) |
|---|---|---|---|
| **Twilio account** | Voice + SMS + WhatsApp | Yes for Pakistani numbers | $20–50/mo + per-minute |
| **Twilio phone number** | Outbound dialer + SMS | Yes, +KYC + PTA SMS sender registration | $1–2/mo each |
| **Twilio WhatsApp Business sender** | WhatsApp templates | Yes, FB Business verified | $0.005/conversation |
| **Lead source integrations** | Zameen, Graana, OLX Pakistan | Source-side config | — |
| **Custom domain** (optional) | `crm.yourcompany.com` | DNS edits | Rs 500–2000/yr |
| **OpenAI** (optional) | AI captions | No | ~$5/mo for GPT-4o-mini |

### Phase 1 — Twilio (1–3 days)

1. **Sign up at <https://www.twilio.com/try-twilio>** with your business email.
2. Add a credit card. Trial mode includes $15 credit.
3. **Buy a number** — Phone Numbers → Buy a number. For Pakistan:
   - Easiest start: a US number (no KYC) for outbound demo calls.
   - Real production: a Pakistani number — requires KYC documents (GST + address
     proof + photo ID). Takes 1–7 business days.
4. **Note your credentials** — Console → Account Info → Account SID + Auth Token.

### Phase 2 — Configure Twilio inside EstateFlow (15 min)

1. Sign in to your deployed app as admin.
2. Go to `/settings`.
3. Paste:
   - Account SID + Auth Token (use the **Test** button — it pings Twilio's
     `accounts.fetch()` to verify the credentials before you save).
   - Voice + SMS sender number (E.164: `+1XXXXXXXXXX`).
   - WhatsApp sender — use the sandbox `whatsapp:+14155238886` for
     testing, then swap for your approved sender.
4. **Turn off Dry-run mode** (only after Test passes).
5. Save.

### Phase 3 — Configure Twilio voice callbacks (10 min)

Bridge calls need Twilio to call your app back when the agent answers.

1. In Twilio Console → Phone Numbers → click your number → **Voice
   Configuration**.
2. Set **A call comes in** → Webhook → POST → `https://<your-app>/api/twilio/voice`
3. Set **Call status changes** → Webhook → POST →
   `https://<your-app>/api/twilio/status`

(These same URLs are set programmatically by `callService.bridgeCall()` — these
console settings are belt-and-suspenders.)

### Phase 4 — WhatsApp Business setup (5–14 days)

Two routes:

**A) Sandbox (immediate, for testing only):**
- Twilio Console → Messaging → Try it out → Send a WhatsApp Message.
- Your friends type the join code from their WhatsApp to Twilio's sandbox
  number. They can now receive messages. Limit: ~25 testers.

**B) Production sender (real):**
1. Verify your business on Facebook Business Manager.
2. Submit a WhatsApp Sender request in Twilio Console.
3. **Submit message templates** for approval — your CRM's 6 follow-up
   templates from [lib/constants.ts](lib/constants.ts) need to be submitted
   verbatim with `{{leadName}}` etc. as variables.
4. Wait 1–7 days for approval.

### Phase 5 — Lead source webhook configuration (1–3 days)

You have the webhook endpoint `https://<your-app>/api/webhooks/leads`. Your
lead sources need to be told to POST there. Steps differ per source:

- **Zameen.com / Graana / OLX Pakistan**: most enterprise dashboards have a
  "lead delivery webhook" config. Paste your URL and webhook secret.
- **Facebook lead ads**: use Zapier or Make.com to POST from Facebook Leads
  → your webhook URL.
- **Custom website forms**: have your developer POST directly:

```bash
BODY='{"fullName":"Test Lead","phone":"+923001100099","source":"website","organizationSlug":"your-slug"}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$LEAD_WEBHOOK_SECRET" | sed 's/^.* //')
curl -X POST https://your-app/api/webhooks/leads \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIG" \
  -d "$BODY"
```

The `X-Webhook-Signature` header is computed as
`sha256=<hex(hmac_sha256(raw_body, LEAD_WEBHOOK_SECRET))>`. Most lead
providers support HMAC signing natively — just give them the URL and the
secret from `/settings`.

### Phase 6 — PTA SMS sender registration (Pakistani regulator, required for SMS)

If you're sending SMS to Pakistani numbers (any +92 number), PTA
requires you to register your sender and message templates with a licensed
SMS aggregator before they'll deliver.

1. Pick a Pakistani SMS aggregator (Jazz, Telenor, Zong, Ufone — any one).
2. Register your business (SECP NTN, GST sales tax registration, etc.).
3. Register your sender ID (6 alphanumeric chars).
4. Register your SMS templates with their exact wording.
5. Give the PTA entity ID + template IDs to Twilio.

Timeline: ~1 week. **WhatsApp doesn't need PTA** — only SMS does. If you're
WhatsApp-first, you can skip this.

### Phase 7 — Final checks before going live (30 min)

- [ ] `/settings` shows the "Live" badge (not Dry run).
- [ ] **Test bridge call**: create a lead with your own phone number → click
  Call. Your phone should ring with Twilio's announcement. Pressing any key
  should dial the lead leg.
- [ ] **Test WhatsApp**: send a template to a sandbox-joined tester. They
  should see the rendered message.
- [ ] **Test lead webhook**: send the sample `curl` above with a real
  `organizationSlug`. Confirm the lead appears in `/leads` and the assigned
  agent gets a notification.
- [ ] **Test public share page**: share a property to a lead → open the
  link in incognito → it should render with photos.
- [ ] **Check costs**: Twilio Console → Usage. Stop if anything looks off.

### Phase 8 — Custom domain (optional, 30 min)

1. Buy a domain (Namecheap, GoDaddy, etc.) — `crm.yourcompany.com` style.
2. Vercel → Project → Settings → Domains → Add.
3. Update DNS records as Vercel instructs.
4. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars to the new domain.
5. Redeploy. Update Twilio's voice callback URLs to the new domain.

---

## Cost cheatsheet

| Item | Free tier | Light prod | Heavy prod |
|---|---|---|---|
| Vercel | Up to 100 GB-hours/mo, plenty | $20/mo Pro | $40/mo Pro |
| Supabase | 500 MB DB, 1 GB storage | $25/mo Pro | $25–60/mo |
| Twilio voice (Pakistan inbound) | — | Rs 0.40/min | Rs 0.40/min |
| Twilio voice (Pakistan outbound) | — | Rs 0.55–0.75/min | same |
| Twilio WhatsApp | — | Rs 0.50–0.80/conv | same |
| Twilio SMS | — | Rs 0.20/sms | same |
| OpenAI (gpt-4o-mini) | — | ~$3–10/mo for 20 captions/day | $30/mo |

**For a 5-agent team doing 50 calls/day + 100 WhatsApps/day:**
roughly Rs 3,500–7,000/month total infrastructure cost.

---

## What you can demo TODAY in dry-run

You can run a full live demo right now, before touching Twilio or OpenAI.
Every UI flow works because dry-run is wired through every external service:

1. Sign up → land on dashboard
2. Manually create a lead → it appears in the list and on the dashboard
3. Click the lead → click Call → "Bridge call simulated (dry run)" toast +
   activity log entry
4. Click WhatsApp → pick "Property Review Check" template → "Sent (dry run)"
5. Click Send Property → pick property + lead → share link returned, "Sent"
6. Public share page works (open in incognito)
7. Schedule a follow-up → it appears under `/followups`
8. Reports tabs all render
9. Attendance: click Check in (will request real GPS — works on mobile)
10. Notifications page: live realtime, mark read, mark all read

The activity log + database state are 100% real. The only thing that's
simulated is the network call to Twilio/Resend/OpenAI. For 90% of demos,
people don't notice or care.

---

## When you do flip to live mode

Order of operations:

1. Buy Twilio number → wait for KYC if Pakistani → get SID + token.
2. Open `/settings` in your deployed app.
3. Paste Twilio creds → click **Test** → green ✓ check.
4. Leave Dry-run **ON** and click Save.
5. Send yourself a test call from your own lead detail page (still dry-run —
   confirms the lead flow is healthy).
6. Flip Dry-run **OFF** → Save.
7. Repeat the call test. Your phone should actually ring.
8. If something's wrong → flip Dry-run back on. Activity log shows what
   happened.

There's no "danger zone" — every flip is reversible from the UI in 5 seconds.

---

## Reach out

If anything in this guide is unclear or you hit a wall:

- Twilio docs: <https://www.twilio.com/docs/voice/quickstart>
- WhatsApp Business onboarding: <https://www.twilio.com/docs/whatsapp/api>
- Supabase deploy guide: <https://supabase.com/docs/guides/getting-started/quickstarts/nextjs>
- The `/api/diagnose` endpoint in your own app tells you what's broken on the
  database side. The Test Twilio button in `/settings` does the same for Twilio.

You're 90% of the way there. The remaining 10% is mostly paperwork (KYC, PTA SMS registration,
WhatsApp template approval) — not code.
