-- ============================================================
-- EstateFlow CRM seed data
-- Organization: Prestige Realty Pvt Ltd
-- All users share password: Password123!
-- All monetary amounts are stored as bigint in Indian Rupees (INR).
-- ============================================================

-- ============================================================
-- Organization
-- ============================================================
INSERT INTO organizations (id, name, slug, plan)
VALUES ('11111111-1111-1111-1111-111111111111',
        'Prestige Realty Pvt Ltd',
        'prestige-realty',
        'pro');

-- ============================================================
-- Auth users (Supabase auth.users) + profiles
-- Password for everyone: Password123!
-- ============================================================
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222201',
   'authenticated', 'authenticated', 'vikram@prestigerealty.com',
   crypt('Password123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222202',
   'authenticated', 'authenticated', 'priya@prestigerealty.com',
   crypt('Password123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222203',
   'authenticated', 'authenticated', 'arjun@prestigerealty.com',
   crypt('Password123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222204',
   'authenticated', 'authenticated', 'sneha@prestigerealty.com',
   crypt('Password123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222205',
   'authenticated', 'authenticated', 'rajesh@prestigerealty.com',
   crypt('Password123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

INSERT INTO profiles (id, organization_id, full_name, phone, role, is_active, is_available) VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111',
   'Vikram Mehta',  '+919811000001', 'admin',          true, true),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111',
   'Priya Nair',    '+919811000002', 'sales_manager',  true, true),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111',
   'Arjun Sharma',  '+919811000003', 'sales_agent',    true, true),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111111',
   'Sneha Reddy',   '+919811000004', 'sales_agent',    true, true),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111111',
   'Rajesh Kumar',  '+919811000005', 'field_executive', true, true);

-- ============================================================
-- Integration settings (default to dry-run)
-- ============================================================
INSERT INTO integration_settings (organization_id, lead_assignment_mode, dry_run_mode)
VALUES ('11111111-1111-1111-1111-111111111111', 'round_robin', true);

-- ============================================================
-- Leads (20 rows)
-- Budgets stored as bigint INR (e.g. 5000000 = 50 L)
-- Two sales agents alternate assignments to demonstrate round-robin state.
-- ============================================================
INSERT INTO leads (
  id, organization_id, full_name, phone, email, source, property_type,
  budget_min, budget_max, preferred_location, status, temperature,
  assigned_agent_id, notes, is_hot
) VALUES
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111',
   'Rahul Sharma', '+919811100001', 'rahul.sharma@example.com',
   '36acre', 'apartment',  7500000, 12000000, 'Gurgaon',
   'new', 'warm', '22222222-2222-2222-2222-222222222203',
   'Looking for 3BHK near Golf Course Road. Family of four.', false),

  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111',
   'Anita Patel',  '+919811100002', 'anita.patel@example.com',
   'magicbricks', 'apartment', 10000000, 15000000, 'Mumbai',
   'contacted', 'hot', '22222222-2222-2222-2222-222222222204',
   'Wants Powai area, ready to visit this weekend.', true),

  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111111',
   'Kiran Bose',   '+919811100003', 'kiran.bose@example.com',
   'housing', 'villa', 20000000, 35000000, 'Bengaluru',
   'interested', 'hot', '22222222-2222-2222-2222-222222222203',
   'Whitefield preference, must have private garden.', true),

  ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111111',
   'Suresh Iyer',  '+919811100004', 'suresh.iyer@example.com',
   'facebook', 'apartment', 6000000, 9000000, 'Noida',
   'site_visit_scheduled', 'hot', '22222222-2222-2222-2222-222222222204',
   'Site visit booked for Saturday 11 AM at Sector 150.', true),

  ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111111',
   'Deepa Menon',  '+919811100005', 'deepa.menon@example.com',
   'instagram', 'apartment', 8000000, 11000000, 'Bengaluru',
   'negotiation', 'hot', '22222222-2222-2222-2222-222222222203',
   'Negotiating on parking + amenities club fee.', true),

  ('33333333-3333-3333-3333-333333333306', '11111111-1111-1111-1111-111111111111',
   'Mohit Aggarwal', '+919811100006', 'mohit.agg@example.com',
   'website', 'plot', 5000000, 8000000, 'Noida',
   'won', 'warm', '22222222-2222-2222-2222-222222222204',
   'Token amount received. Registration scheduled next month.', false),

  ('33333333-3333-3333-3333-333333333307', '11111111-1111-1111-1111-111111111111',
   'Nisha Gupta',  '+919811100007', 'nisha.gupta@example.com',
   'referral', 'apartment', 9000000, 13000000, 'Gurgaon',
   'contacted', 'warm', '22222222-2222-2222-2222-222222222203',
   'Referred by Rahul Sharma. Prefers DLF Phase 5.', false),

  ('33333333-3333-3333-3333-333333333308', '11111111-1111-1111-1111-111111111111',
   'Arun Joshi',   '+919811100008', 'arun.joshi@example.com',
   '36acre', 'commercial', 15000000, 25000000, 'Hyderabad',
   'new', 'cold', '22222222-2222-2222-2222-222222222204',
   'Looking for office space in HITEC City for SaaS startup.', false),

  ('33333333-3333-3333-3333-333333333309', '11111111-1111-1111-1111-111111111111',
   'Pooja Verma',  '+919811100009', 'pooja.verma@example.com',
   'magicbricks', 'rental', 50000, 80000, 'Pune',
   'interested', 'warm', '22222222-2222-2222-2222-222222222203',
   'Monthly rent budget. 2BHK furnished preferred.', false),

  ('33333333-3333-3333-3333-333333333310', '11111111-1111-1111-1111-111111111111',
   'Sanjay Rao',   '+919811100010', 'sanjay.rao@example.com',
   'housing', 'villa', 25000000, 40000000, 'Bengaluru',
   'lost', 'cold', '22222222-2222-2222-2222-222222222204',
   'Went with competitor due to better financing options.', false),

  ('33333333-3333-3333-3333-333333333311', '11111111-1111-1111-1111-111111111111',
   'Lakshmi Nair', '+919811100011', 'lakshmi.nair@example.com',
   'facebook', 'apartment', 7000000, 10000000, 'Pune',
   'not_responding', 'cold', '22222222-2222-2222-2222-222222222203',
   'Called 3 times — no response in 10 days.', false),

  ('33333333-3333-3333-3333-333333333312', '11111111-1111-1111-1111-111111111111',
   'Vivek Malhotra', '+919811100012', 'vivek.m@example.com',
   'instagram', 'apartment', 11000000, 16000000, 'Mumbai',
   'site_visit_scheduled', 'hot', '22222222-2222-2222-2222-222222222204',
   'Powai visit confirmed. Bringing wife and parents.', true),

  ('33333333-3333-3333-3333-333333333313', '11111111-1111-1111-1111-111111111111',
   'Renu Kapoor',  '+919811100013', 'renu.k@example.com',
   'website', 'plot', 4000000, 6000000, 'Noida',
   'new', 'cold', '22222222-2222-2222-2222-222222222203',
   'Investor profile. Considering Yamuna Expressway too.', false),

  ('33333333-3333-3333-3333-333333333314', '11111111-1111-1111-1111-111111111111',
   'Ashok Tiwari', '+919811100014', 'ashok.tiwari@example.com',
   'referral', 'apartment', 8500000, 12500000, 'Gurgaon',
   'contacted', 'warm', '22222222-2222-2222-2222-222222222204',
   'Referred by HR partner. NRI returning to India.', false),

  ('33333333-3333-3333-3333-333333333315', '11111111-1111-1111-1111-111111111111',
   'Meena Pillai', '+919811100015', 'meena.pillai@example.com',
   '36acre', 'apartment', 6000000, 9000000, 'Pune',
   'interested', 'warm', '22222222-2222-2222-2222-222222222203',
   'First-time home buyer. Needs help with loan paperwork.', false),

  ('33333333-3333-3333-3333-333333333316', '11111111-1111-1111-1111-111111111111',
   'Rohan Das',    '+919811100016', 'rohan.das@example.com',
   'magicbricks', 'villa', 30000000, 50000000, 'Bengaluru',
   'negotiation', 'hot', '22222222-2222-2222-2222-222222222204',
   'Pre-approved home loan. Finalising between two villas.', true),

  ('33333333-3333-3333-3333-333333333317', '11111111-1111-1111-1111-111111111111',
   'Kavita Singh', '+919811100017', 'kavita.singh@example.com',
   'housing', 'apartment', 9500000, 14000000, 'Gurgaon',
   'new', 'warm', '22222222-2222-2222-2222-222222222203',
   'Wants east-facing apartment, vaastu compliant.', false),

  ('33333333-3333-3333-3333-333333333318', '11111111-1111-1111-1111-111111111111',
   'Manoj Kumar',  '+919811100018', 'manoj.kumar@example.com',
   'facebook', 'commercial', 10000000, 18000000, 'Hyderabad',
   'call_pending', 'cold', NULL,
   'Lead came in late at night — auto-call deferred.', false),

  ('33333333-3333-3333-3333-333333333319', '11111111-1111-1111-1111-111111111111',
   'Divya Krishnamurthy', '+919811100019', 'divya.k@example.com',
   'instagram', 'apartment', 12000000, 18000000, 'Mumbai',
   'won', 'warm', '22222222-2222-2222-2222-222222222204',
   'Closed last week. 4BHK Powai. Referral asked.', false),

  ('33333333-3333-3333-3333-333333333320', '11111111-1111-1111-1111-111111111111',
   'Sachin Bhatt', '+919811100020', 'sachin.bhatt@example.com',
   'website', 'rental', 35000, 60000, 'Bengaluru',
   'new', 'cold', '22222222-2222-2222-2222-222222222203',
   'Bachelor pad, fully furnished, Whitefield/Indiranagar.', false);

-- Stamp last_assigned_at so round-robin keeps cycling correctly
UPDATE profiles SET last_assigned_at = now() - interval '2 hours'
  WHERE id = '22222222-2222-2222-2222-222222222203';
UPDATE profiles SET last_assigned_at = now() - interval '1 hour'
  WHERE id = '22222222-2222-2222-2222-222222222204';

-- ============================================================
-- Properties (10 rows)
-- ============================================================
INSERT INTO properties (
  id, organization_id, title, location, address, property_type,
  price, size_sqft, bedrooms, bathrooms, floor, furnishing, status,
  description, amenities, developer_name, created_by
) VALUES
  ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111111',
   'Prestige Heights — 3BHK', 'Gurgaon', 'Sector 54, Golf Course Road, Gurgaon',
   'apartment', 12500000, 1850, 3, 3, 14, 'semi_furnished', 'available',
   'Premium 3BHK with private balcony overlooking the golf course.',
   ARRAY['Swimming Pool','Gym','Clubhouse','24x7 Security','Power Backup','Kids Play Area'],
   'Prestige Group', '22222222-2222-2222-2222-222222222201'),

  ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111111',
   'Golf Course Residency — 2BHK', 'Gurgaon', 'Golf Course Road, Gurgaon',
   'apartment',  9800000, 1280, 2, 2,  8, 'unfurnished', 'available',
   'Bright 2BHK with covered parking and modern modular kitchen.',
   ARRAY['Gym','Clubhouse','Lift','Power Backup'],
   'DLF Limited', '22222222-2222-2222-2222-222222222201'),

  ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111111',
   'Sector 54 Skyline — 4BHK Duplex', 'Gurgaon', 'Sector 54, Gurgaon',
   'apartment', 22000000, 3100, 4, 4, 22, 'fully_furnished', 'hold',
   'Top-floor duplex with terrace garden and private elevator.',
   ARRAY['Private Elevator','Terrace Garden','Swimming Pool','Concierge','EV Charging'],
   'Prestige Group', '22222222-2222-2222-2222-222222222201'),

  ('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111111',
   'Whitefield Greens Villa', 'Bengaluru', 'Whitefield, Bengaluru',
   'villa',     32500000, 3800, 4, 5, 0, 'semi_furnished', 'available',
   'Independent villa with private garden and servant quarters.',
   ARRAY['Private Garden','Servant Quarters','Solar Panels','Borewell','Two Car Parking'],
   'Sobha Limited', '22222222-2222-2222-2222-222222222202'),

  ('44444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111111',
   'Whitefield Crown Villa', 'Bengaluru', 'Whitefield, Bengaluru',
   'villa',     41000000, 4200, 5, 5, 0, 'fully_furnished', 'sold',
   'Luxury villa, fully furnished. Sold in March 2026.',
   ARRAY['Pool','Home Theatre','Smart Home','Gym Room'],
   'Prestige Group', '22222222-2222-2222-2222-222222222202'),

  ('44444444-4444-4444-4444-444444444406', '11111111-1111-1111-1111-111111111111',
   'Noida Sector 150 Plot — 200 sqyd', 'Noida', 'Sector 150, Noida',
   'plot',       6500000, 1800, NULL, NULL, NULL, 'unfurnished', 'available',
   'Corner plot in well-developed sector, ready for construction.',
   ARRAY['Park Facing','Wide Road','Sewer Connection','Power Connection'],
   'ATS Group', '22222222-2222-2222-2222-222222222202'),

  ('44444444-4444-4444-4444-444444444407', '11111111-1111-1111-1111-111111111111',
   'Noida Sector 150 Plot — 350 sqyd', 'Noida', 'Sector 150, Noida',
   'plot',      11800000, 3150, NULL, NULL, NULL, 'unfurnished', 'available',
   'Large residential plot with park view, gated colony.',
   ARRAY['Park Facing','Gated Community','24x7 Security'],
   'ATS Group', '22222222-2222-2222-2222-222222222202'),

  ('44444444-4444-4444-4444-444444444408', '11111111-1111-1111-1111-111111111111',
   'Powai Lake View — 3BHK', 'Mumbai', 'Powai, Mumbai',
   'apartment', 28500000, 1750, 3, 3, 18, 'semi_furnished', 'available',
   'Lake-facing 3BHK in premium tower with full amenities.',
   ARRAY['Lake View','Swimming Pool','Gym','Spa','Concierge','Valet Parking'],
   'Hiranandani', '22222222-2222-2222-2222-222222222201'),

  ('44444444-4444-4444-4444-444444444409', '11111111-1111-1111-1111-111111111111',
   'Powai Greens — 2BHK', 'Mumbai', 'Powai, Mumbai',
   'apartment', 18500000, 1100, 2, 2, 11, 'unfurnished', 'hold',
   'Compact 2BHK perfect for working couples or small families.',
   ARRAY['Gym','Clubhouse','Garden','Lift'],
   'Hiranandani', '22222222-2222-2222-2222-222222222201'),

  ('44444444-4444-4444-4444-444444444410', '11111111-1111-1111-1111-111111111111',
   'HITEC City Office Space', 'Hyderabad', 'HITEC City, Hyderabad',
   'commercial', 19500000, 2400, NULL, 2, 7, 'fully_furnished', 'available',
   'Plug-and-play office with 35 workstations, conference rooms, pantry.',
   ARRAY['35 Workstations','3 Cabins','2 Conference Rooms','Server Room','Reserved Parking'],
   'My Home Group', '22222222-2222-2222-2222-222222222201');

-- ============================================================
-- Calls (5 rows, mix of completed + dry-run)
-- ============================================================
INSERT INTO calls (
  organization_id, lead_id, agent_id, status, outcome,
  duration_seconds, is_dry_run, notes, started_at, ended_at
) VALUES
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333302',
   '22222222-2222-2222-2222-222222222204', 'completed', 'connected',
   285, true, 'Dry run — Anita confirmed interest, site visit booked.',
   now() - interval '1 day',  now() - interval '1 day' + interval '5 minutes'),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333303',
   '22222222-2222-2222-2222-222222222203', 'completed', 'interested',
   412, true, 'Kiran wants Whitefield villa with garden — followup scheduled.',
   now() - interval '2 days',  now() - interval '2 days' + interval '7 minutes'),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333304',
   '22222222-2222-2222-2222-222222222204', 'completed', 'callback_requested',
   95, true, 'Asked to call back after Friday standup.',
   now() - interval '3 days', now() - interval '3 days' + interval '95 seconds'),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333311',
   '22222222-2222-2222-2222-222222222203', 'no_answer', 'not_answered',
   0,   true, 'Third attempt — still no answer.',
   now() - interval '4 days', NULL),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333305',
   '22222222-2222-2222-2222-222222222203', 'completed', 'connected',
   620, true, 'Deepa negotiating amenities club fee. Sent revised quote.',
   now() - interval '5 hours', now() - interval '5 hours' + interval '10 minutes');

-- ============================================================
-- Followups (10 rows)
-- ============================================================
INSERT INTO followups (
  organization_id, lead_id, agent_id, type, status,
  scheduled_at, notes, template_used
) VALUES
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333301',
   '22222222-2222-2222-2222-222222222203', 'whatsapp', 'pending',
   now() + interval '2 hours', 'Send Golf Course Road shortlist.', 'ft1'),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333302',
   '22222222-2222-2222-2222-222222222204', 'site_visit', 'pending',
   now() + interval '2 days', 'Powai site visit — pick up at Powai metro.', NULL),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333303',
   '22222222-2222-2222-2222-222222222203', 'call', 'pending',
   now() + interval '1 day', 'Discuss budget bump to 3.5 Cr range.', NULL),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333304',
   '22222222-2222-2222-2222-222222222204', 'call', 'pending',
   now() + interval '3 hours', 'Callback as requested before Friday standup.', NULL),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333305',
   '22222222-2222-2222-2222-222222222203', 'whatsapp', 'pending',
   now() + interval '6 hours', 'Send revised quote with parking discount.', 'ft3'),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333307',
   '22222222-2222-2222-2222-222222222203', 'whatsapp', 'completed',
   now() - interval '1 day', 'Sent welcome pack — Nisha responded positively.', 'ft5'),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333309',
   '22222222-2222-2222-2222-222222222203', 'whatsapp', 'pending',
   now() + interval '4 hours', 'Share 2BHK furnished rentals in Pune.', 'ft3'),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333311',
   '22222222-2222-2222-2222-222222222203', 'whatsapp', 'missed',
   now() - interval '5 days', 'No response from Lakshmi — re-engagement needed.', 'ft5'),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333312',
   '22222222-2222-2222-2222-222222222204', 'site_visit', 'pending',
   now() + interval '3 days', 'Powai visit, group of 4 — book larger demo flat.', NULL),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333315',
   '22222222-2222-2222-2222-222222222203', 'email', 'pending',
   now() + interval '1 day', 'Send home loan checklist + lender shortlist.', NULL);

-- ============================================================
-- Activities (timeline seed entries)
-- ============================================================
INSERT INTO activities (organization_id, lead_id, user_id, type, title, description, metadata) VALUES
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333301',
   '22222222-2222-2222-2222-222222222203', 'lead_created',
   'Lead created', 'New lead from 36acre webhook', '{"source":"36acre"}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333301',
   '22222222-2222-2222-2222-222222222202', 'lead_assigned',
   'Assigned to Arjun Sharma', 'Round-robin assignment',
   '{"agentId":"22222222-2222-2222-2222-222222222203"}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333302',
   '22222222-2222-2222-2222-222222222204', 'call_completed',
   'Call connected with Anita Patel', 'Duration 4m 45s, outcome: interested',
   '{"durationSeconds":285}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333305',
   '22222222-2222-2222-2222-222222222203', 'status_changed',
   'Status changed to Negotiation', 'Was Interested', '{"from":"interested","to":"negotiation"}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333306',
   '22222222-2222-2222-2222-222222222204', 'status_changed',
   'Status changed to Won', 'Token amount received',
   '{"from":"negotiation","to":"won"}'::jsonb);

-- ============================================================
-- Attendance (5 rows for today)
-- ============================================================
INSERT INTO attendance (
  organization_id, user_id, date,
  check_in_time, check_out_time,
  check_in_lat, check_in_lng, check_out_lat, check_out_lng,
  status
) VALUES
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', CURRENT_DATE,
   CURRENT_DATE + time '09:12', CURRENT_DATE + time '18:24',
   28.45926100, 77.07268900, 28.45926100, 77.07268900, 'present'),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202', CURRENT_DATE,
   CURRENT_DATE + time '09:28', CURRENT_DATE + time '18:50',
   28.45926100, 77.07268900, 28.45926100, 77.07268900, 'present'),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222203', CURRENT_DATE,
   CURRENT_DATE + time '09:45', NULL,
   28.45926100, 77.07268900, NULL, NULL, 'late'),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222204', CURRENT_DATE,
   CURRENT_DATE + time '09:05', NULL,
   19.11982000, 72.90581000, NULL, NULL, 'present'),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222205', CURRENT_DATE,
   CURRENT_DATE + time '10:42', NULL,
   28.50000000, 77.40000000, NULL, NULL, 'late');

-- ============================================================
-- Social posts (5 rows)
-- ============================================================
INSERT INTO social_posts (
  organization_id, created_by, assigned_to, platform, caption, status, scheduled_at, notes
) VALUES
  ('11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222201',
   'instagram_post',
   'New launch: Prestige Heights on Golf Course Road. Premium 3BHKs from ₹1.25 Cr. DM to book a visit. #Gurgaon #LuxuryLiving',
   'scheduled', now() + interval '2 days',
   'Pair with carousel of 5 facade and amenities shots.'),

  ('11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222201',
   'instagram_reel',
   'Walkthrough of Whitefield Greens Villa — private garden, 5BHK, ₹4.1 Cr. Link in bio.',
   'draft', NULL,
   'Need editor to add background score + price chip overlay.'),

  ('11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222201',
   'facebook_post',
   'Why Powai is Mumbai''s smartest investment for 2026 — lake views, IIT proximity, premium schools.',
   'idea', NULL,
   'Long-form post with stats. Pull 5-year price trend chart.'),

  ('11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222202', '22222222-2222-2222-2222-222222222201',
   'linkedin_post',
   'Closed: 4BHK Powai for Divya K. Congratulations on the new home. Always rewarding to be part of this journey.',
   'published', now() - interval '3 days',
   'Tag client (with permission). Use brand template.'),

  ('11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222201',
   'instagram_story',
   'Site visit reel — Sector 150 plots. Swipe up to book yours.',
   'scheduled', now() + interval '6 hours',
   '15-second story, vertical, BTS shot from drone.');

-- ============================================================
-- Notifications (sample unread items)
-- ============================================================
INSERT INTO notifications (organization_id, user_id, type, title, body, metadata) VALUES
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222203',
   'new_lead', 'New Lead Assigned', 'Kavita Singh from housing has been assigned to you',
   '{"leadId":"33333333-3333-3333-3333-333333333317"}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222204',
   'followup_due', 'Follow-up Due Soon', 'Follow up with Suresh Iyer in 30 minutes',
   '{"leadId":"33333333-3333-3333-3333-333333333304"}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202',
   'missed_call', 'Missed Auto-Call',
   'Lakshmi Nair''s call was not answered',
   '{"leadId":"33333333-3333-3333-3333-333333333311"}'::jsonb);
