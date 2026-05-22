-- ============================================================
-- EstateFlow CRM seed data
-- Organization: Sapphire Estates (Pvt) Ltd
-- All users share password: Password123!
-- All monetary amounts are stored as bigint in Pakistani Rupees (PKR).
-- Pakistani numbering: 1 Lakh = 100,000   1 Crore = 10,000,000
-- ============================================================

-- ============================================================
-- Organization
-- ============================================================
INSERT INTO organizations (id, name, slug, plan)
VALUES ('11111111-1111-1111-1111-111111111111',
        'Sapphire Estates (Pvt) Ltd',
        'sapphire-estates',
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
   'authenticated', 'authenticated', 'ahmed@sapphireestates.pk',
   crypt('Password123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222202',
   'authenticated', 'authenticated', 'ayesha@sapphireestates.pk',
   crypt('Password123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222203',
   'authenticated', 'authenticated', 'bilal@sapphireestates.pk',
   crypt('Password123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222204',
   'authenticated', 'authenticated', 'sana@sapphireestates.pk',
   crypt('Password123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),

  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222205',
   'authenticated', 'authenticated', 'imran@sapphireestates.pk',
   crypt('Password123!', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

INSERT INTO profiles (id, organization_id, full_name, phone, role, is_active, is_available) VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111',
   'Ahmed Sheikh',  '+923001000001', 'admin',          true, true),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111',
   'Ayesha Khan',   '+923001000002', 'sales_manager',  true, true),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111',
   'Bilal Hussain', '+923001000003', 'sales_agent',    true, true),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111111',
   'Sana Malik',    '+923001000004', 'sales_agent',    true, true),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111111',
   'Imran Iqbal',   '+923001000005', 'field_executive', true, true);

-- ============================================================
-- Integration settings (default to dry-run)
-- ============================================================
INSERT INTO integration_settings (organization_id, lead_assignment_mode, dry_run_mode)
VALUES ('11111111-1111-1111-1111-111111111111', 'round_robin', true);

-- ============================================================
-- Leads (20 rows)
-- Budgets stored as bigint PKR (e.g. 5000000 = 50 Lakh)
-- Sources reflect Pakistani lead portals + organic channels.
-- ============================================================
INSERT INTO leads (
  id, organization_id, full_name, phone, email, source, property_type,
  budget_min, budget_max, preferred_location, status, temperature,
  assigned_agent_id, notes, is_hot
) VALUES
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111111',
   'Hassan Raza', '+923001100001', 'hassan.raza@example.pk',
   'zameen', 'apartment',  15000000, 25000000, 'DHA Phase 6, Karachi',
   'new', 'warm', '22222222-2222-2222-2222-222222222203',
   'Looking for 3-bed in DHA Karachi. Family of four.', false),

  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111111',
   'Fatima Tariq',  '+923001100002', 'fatima.tariq@example.pk',
   'graana', 'apartment', 18000000, 28000000, 'Bahria Town, Lahore',
   'contacted', 'hot', '22222222-2222-2222-2222-222222222204',
   'Wants Bahria Town Lahore, ready to visit this weekend.', true),

  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111111',
   'Bilal Akhtar',   '+923001100003', 'bilal.akhtar@example.pk',
   'olx', 'villa', 60000000, 90000000, 'F-7, Islamabad',
   'interested', 'hot', '22222222-2222-2222-2222-222222222203',
   'F-7 Islamabad preference, must have private lawn.', true),

  ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111111',
   'Sara Zahid',  '+923001100004', 'sara.zahid@example.pk',
   'facebook', 'apartment', 12000000, 18000000, 'Gulberg, Lahore',
   'site_visit_scheduled', 'hot', '22222222-2222-2222-2222-222222222204',
   'Site visit booked for Saturday 11 AM at Gulberg.', true),

  ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111111',
   'Muhammad Asad',  '+923001100005', 'm.asad@example.pk',
   'instagram', 'apartment', 16000000, 22000000, 'Clifton, Karachi',
   'negotiation', 'hot', '22222222-2222-2222-2222-222222222203',
   'Negotiating on parking + maintenance fee.', true),

  ('33333333-3333-3333-3333-333333333306', '11111111-1111-1111-1111-111111111111',
   'Maryam Hassan', '+923001100006', 'maryam.h@example.pk',
   'website', 'plot', 8000000, 14000000, 'Bahria Enclave, Islamabad',
   'won', 'warm', '22222222-2222-2222-2222-222222222204',
   'Token amount received. Transfer scheduled next month.', false),

  ('33333333-3333-3333-3333-333333333307', '11111111-1111-1111-1111-111111111111',
   'Usman Khan',  '+923001100007', 'usman.khan@example.pk',
   'referral', 'apartment', 14000000, 20000000, 'DHA Phase 5, Karachi',
   'contacted', 'warm', '22222222-2222-2222-2222-222222222203',
   'Referred by Hassan Raza. Prefers DHA Phase 5 Karachi.', false),

  ('33333333-3333-3333-3333-333333333308', '11111111-1111-1111-1111-111111111111',
   'Hina Ali',   '+923001100008', 'hina.ali@example.pk',
   'zameen', 'commercial', 30000000, 50000000, 'I-8 Markaz, Islamabad',
   'new', 'cold', '22222222-2222-2222-2222-222222222204',
   'Looking for office space in I-8 Markaz for tech startup.', false),

  ('33333333-3333-3333-3333-333333333309', '11111111-1111-1111-1111-111111111111',
   'Saad Bashir',  '+923001100009', 'saad.bashir@example.pk',
   'graana', 'rental', 80000, 130000, 'Johar Town, Lahore',
   'interested', 'warm', '22222222-2222-2222-2222-222222222203',
   'Monthly rent budget. 2-bed furnished preferred.', false),

  ('33333333-3333-3333-3333-333333333310', '11111111-1111-1111-1111-111111111111',
   'Nida Shahid',   '+923001100010', 'nida.shahid@example.pk',
   'olx', 'villa', 70000000, 110000000, 'Bahria Town Phase 8, Rawalpindi',
   'lost', 'cold', '22222222-2222-2222-2222-222222222204',
   'Went with competitor due to faster handover commitment.', false),

  ('33333333-3333-3333-3333-333333333311', '11111111-1111-1111-1111-111111111111',
   'Faisal Ahmed', '+923001100011', 'faisal.ahmed@example.pk',
   'facebook', 'apartment', 13000000, 17000000, 'Wapda Town, Faisalabad',
   'not_responding', 'cold', '22222222-2222-2222-2222-222222222203',
   'Called 3 times — no response in 10 days.', false),

  ('33333333-3333-3333-3333-333333333312', '11111111-1111-1111-1111-111111111111',
   'Aisha Rehman', '+923001100012', 'aisha.r@example.pk',
   'instagram', 'apartment', 20000000, 30000000, 'Clifton Block 4, Karachi',
   'site_visit_scheduled', 'hot', '22222222-2222-2222-2222-222222222204',
   'Clifton visit confirmed. Bringing husband and parents.', true),

  ('33333333-3333-3333-3333-333333333313', '11111111-1111-1111-1111-111111111111',
   'Kashif Pervaiz',  '+923001100013', 'kashif.p@example.pk',
   'website', 'plot', 6000000, 10000000, 'Bahria Town Karachi, Precinct 27',
   'new', 'cold', '22222222-2222-2222-2222-222222222203',
   'Investor profile. Considering Bahria Karachi precincts.', false),

  ('33333333-3333-3333-3333-333333333314', '11111111-1111-1111-1111-111111111111',
   'Madiha Iftikhar', '+923001100014', 'madiha.i@example.pk',
   'referral', 'apartment', 16000000, 22000000, 'DHA Phase 8, Lahore',
   'contacted', 'warm', '22222222-2222-2222-2222-222222222204',
   'Referred by HR partner. Overseas Pakistani returning.', false),

  ('33333333-3333-3333-3333-333333333315', '11111111-1111-1111-1111-111111111111',
   'Tariq Mahmood', '+923001100015', 'tariq.m@example.pk',
   'zameen', 'apartment', 10000000, 14000000, 'Model Town, Lahore',
   'interested', 'warm', '22222222-2222-2222-2222-222222222203',
   'First-time home buyer. Needs help with bank financing.', false),

  ('33333333-3333-3333-3333-333333333316', '11111111-1111-1111-1111-111111111111',
   'Hira Jamil',    '+923001100016', 'hira.jamil@example.pk',
   'graana', 'villa', 80000000, 120000000, 'DHA Phase 6, Lahore',
   'negotiation', 'hot', '22222222-2222-2222-2222-222222222204',
   'Pre-approved bank loan. Finalising between two houses.', true),

  ('33333333-3333-3333-3333-333333333317', '11111111-1111-1111-1111-111111111111',
   'Owais Cheema', '+923001100017', 'owais.cheema@example.pk',
   'pakistanproperty', 'apartment', 15000000, 21000000, 'DHA Phase 7, Karachi',
   'new', 'warm', '22222222-2222-2222-2222-222222222203',
   'Wants east-facing apartment, sea view if possible.', false),

  ('33333333-3333-3333-3333-333333333318', '11111111-1111-1111-1111-111111111111',
   'Sidra Anjum',  '+923001100018', 'sidra.anjum@example.pk',
   'facebook', 'commercial', 25000000, 45000000, 'Blue Area, Islamabad',
   'call_pending', 'cold', NULL,
   'Lead came in late at night — auto-call deferred.', false),

  ('33333333-3333-3333-3333-333333333319', '11111111-1111-1111-1111-111111111111',
   'Junaid Saleem', '+923001100019', 'junaid.s@example.pk',
   'instagram', 'apartment', 22000000, 32000000, 'Clifton Block 5, Karachi',
   'won', 'warm', '22222222-2222-2222-2222-222222222204',
   'Closed last week. 4-bed Clifton. Referral asked.', false),

  ('33333333-3333-3333-3333-333333333320', '11111111-1111-1111-1111-111111111111',
   'Mehwish Saqib', '+923001100020', 'mehwish.s@example.pk',
   'website', 'rental', 60000, 100000, 'Gulberg III, Lahore',
   'new', 'cold', '22222222-2222-2222-2222-222222222203',
   'Bachelorette pad, fully furnished, Gulberg / Cantt.', false);

-- Stamp last_assigned_at so round-robin keeps cycling correctly
UPDATE profiles SET last_assigned_at = now() - interval '2 hours'
  WHERE id = '22222222-2222-2222-2222-222222222203';
UPDATE profiles SET last_assigned_at = now() - interval '1 hour'
  WHERE id = '22222222-2222-2222-2222-222222222204';

-- ============================================================
-- Properties (10 rows)
-- Prices in PKR. Locations + developers reflect Pakistani market.
-- ============================================================
INSERT INTO properties (
  id, organization_id, title, location, address, property_type,
  price, size_sqft, bedrooms, bathrooms, floor, furnishing, status,
  description, amenities, developer_name, created_by
) VALUES
  ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111111',
   'Emaar Crescent Bay — 3-Bed', 'Clifton, Karachi', 'Crescent Bay, Block 4, Clifton, Karachi',
   'apartment', 28500000, 1850, 3, 3, 14, 'semi_furnished', 'available',
   'Premium 3-bed with sea-facing balcony, top-floor amenities.',
   ARRAY['Swimming Pool','Gym','Clubhouse','24x7 Security','Power Backup','Sea View'],
   'Emaar Pakistan', '22222222-2222-2222-2222-222222222201'),

  ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111111',
   'DHA Karachi Phase 6 — 2-Bed Apartment', 'DHA Phase 6, Karachi', 'Khayaban-e-Bahria, Phase 6, DHA, Karachi',
   'apartment',  18500000, 1280, 2, 2,  8, 'unfurnished', 'available',
   'Bright 2-bed apartment with covered parking and modern kitchen.',
   ARRAY['Gym','Clubhouse','Lift','Power Backup','Reserved Parking'],
   'DHA Karachi', '22222222-2222-2222-2222-222222222201'),

  ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111111',
   'The Centaurus Residences — 4-Bed Duplex', 'F-8, Islamabad', 'The Centaurus, F-8 Markaz, Islamabad',
   'apartment', 65000000, 3100, 4, 4, 22, 'fully_furnished', 'hold',
   'Top-floor duplex with terrace garden and private elevator.',
   ARRAY['Private Elevator','Terrace Garden','Pool','Concierge','Smart Home'],
   'Centaurus Group', '22222222-2222-2222-2222-222222222201'),

  ('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111111',
   'Bahria Town Lahore — 1 Kanal House', 'Bahria Town, Lahore', 'Sector E, Bahria Town, Lahore',
   'villa',     55000000, 4500, 5, 5, 0, 'semi_furnished', 'available',
   'Independent 1-kanal house with lawn and servant quarters.',
   ARRAY['Private Lawn','Servant Quarters','Solar Panels','Boring','Two-Car Garage'],
   'Bahria Town', '22222222-2222-2222-2222-222222222202'),

  ('44444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111111',
   'DHA Lahore Phase 6 — 2 Kanal House', 'DHA Phase 6, Lahore', 'CCA Block, DHA Phase 6, Lahore',
   'villa',     110000000, 9000, 6, 7, 0, 'fully_furnished', 'sold',
   'Luxury 2-kanal house, fully furnished. Sold in March 2026.',
   ARRAY['Pool','Home Theatre','Smart Home','Gym Room','Imported Kitchen'],
   'DHA Lahore', '22222222-2222-2222-2222-222222222202'),

  ('44444444-4444-4444-4444-444444444406', '11111111-1111-1111-1111-111111111111',
   'Bahria Enclave Sector C — 10 Marla Plot', 'Bahria Enclave, Islamabad', 'Sector C, Bahria Enclave, Islamabad',
   'plot',       11500000, 2250, NULL, NULL, NULL, 'unfurnished', 'available',
   'Corner plot in well-developed sector, ready for construction.',
   ARRAY['Park Facing','Wide Road','Sewer Connection','Power Connection','Gated Community'],
   'Bahria Town', '22222222-2222-2222-2222-222222222202'),

  ('44444444-4444-4444-4444-444444444407', '11111111-1111-1111-1111-111111111111',
   'Bahria Town Karachi — 500 sqyd Plot', 'Bahria Town, Karachi', 'Precinct 27, Bahria Town, Karachi',
   'plot',      18000000, 4500, NULL, NULL, NULL, 'unfurnished', 'available',
   'Large residential plot with park view, gated precinct.',
   ARRAY['Park Facing','Gated Community','24x7 Security'],
   'Bahria Town', '22222222-2222-2222-2222-222222222202'),

  ('44444444-4444-4444-4444-444444444408', '11111111-1111-1111-1111-111111111111',
   'Eighteen Islamabad — 3-Bed Sky Villa', 'Eighteen, Islamabad', 'Eighteen Smart City, Kahuta Road, Islamabad',
   'apartment', 48500000, 1750, 3, 3, 18, 'semi_furnished', 'available',
   'Sky villa in Pakistan''s premium smart city with full amenities.',
   ARRAY['Mountain View','Swimming Pool','Gym','Spa','Concierge','Valet Parking'],
   'Eighteen Islamabad', '22222222-2222-2222-2222-222222222201'),

  ('44444444-4444-4444-4444-444444444409', '11111111-1111-1111-1111-111111111111',
   'Capital Smart City — 2-Bed', 'Capital Smart City, Islamabad', 'Overseas Block, Capital Smart City, Islamabad',
   'apartment', 22500000, 1100, 2, 2, 11, 'unfurnished', 'hold',
   'Compact 2-bed perfect for working couples or small families.',
   ARRAY['Gym','Clubhouse','Park','Lift','Smart Meters'],
   'Capital Smart City', '22222222-2222-2222-2222-222222222201'),

  ('44444444-4444-4444-4444-444444444410', '11111111-1111-1111-1111-111111111111',
   'Park View City — Office Floor', 'Park View City, Lahore', 'Commercial Block, Park View City, Lahore',
   'commercial', 34500000, 2400, NULL, 2, 7, 'fully_furnished', 'available',
   'Plug-and-play office with 35 workstations, conference rooms, pantry.',
   ARRAY['35 Workstations','3 Cabins','2 Conference Rooms','Server Room','Reserved Parking'],
   'Vision Group', '22222222-2222-2222-2222-222222222201');

-- ============================================================
-- Calls (5 rows, all dry-run)
-- ============================================================
INSERT INTO calls (
  organization_id, lead_id, agent_id, status, outcome,
  duration_seconds, is_dry_run, notes, started_at, ended_at
) VALUES
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333302',
   '22222222-2222-2222-2222-222222222204', 'completed', 'connected',
   285, true, 'Dry run — Fatima confirmed interest, site visit booked.',
   now() - interval '1 day',  now() - interval '1 day' + interval '5 minutes'),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333303',
   '22222222-2222-2222-2222-222222222203', 'completed', 'interested',
   412, true, 'Bilal wants F-7 house with lawn — followup scheduled.',
   now() - interval '2 days',  now() - interval '2 days' + interval '7 minutes'),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333304',
   '22222222-2222-2222-2222-222222222204', 'completed', 'callback_requested',
   95, true, 'Asked to call back after Friday Jummah.',
   now() - interval '3 days', now() - interval '3 days' + interval '95 seconds'),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333311',
   '22222222-2222-2222-2222-222222222203', 'no_answer', 'not_answered',
   0,   true, 'Third attempt — still no answer.',
   now() - interval '4 days', NULL),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333305',
   '22222222-2222-2222-2222-222222222203', 'completed', 'connected',
   620, true, 'Asad negotiating maintenance fee. Sent revised quote.',
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
   now() + interval '2 hours', 'Send DHA Karachi shortlist.', 'ft1'),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333302',
   '22222222-2222-2222-2222-222222222204', 'site_visit', 'pending',
   now() + interval '2 days', 'Bahria Lahore visit — pick up at Liberty Roundabout.', NULL),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333303',
   '22222222-2222-2222-2222-222222222203', 'call', 'pending',
   now() + interval '1 day', 'Discuss budget bump to 9 Crore range.', NULL),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333304',
   '22222222-2222-2222-2222-222222222204', 'call', 'pending',
   now() + interval '3 hours', 'Callback as requested after Jummah.', NULL),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333305',
   '22222222-2222-2222-2222-222222222203', 'whatsapp', 'pending',
   now() + interval '6 hours', 'Send revised quote with parking discount.', 'ft3'),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333307',
   '22222222-2222-2222-2222-222222222203', 'whatsapp', 'completed',
   now() - interval '1 day', 'Sent welcome pack — Usman responded positively.', 'ft5'),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333309',
   '22222222-2222-2222-2222-222222222203', 'whatsapp', 'pending',
   now() + interval '4 hours', 'Share 2-bed furnished rentals in Johar Town.', 'ft3'),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333311',
   '22222222-2222-2222-2222-222222222203', 'whatsapp', 'missed',
   now() - interval '5 days', 'No response from Faisal — re-engagement needed.', 'ft5'),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333312',
   '22222222-2222-2222-2222-222222222204', 'site_visit', 'pending',
   now() + interval '3 days', 'Clifton visit, group of 4 — book larger demo flat.', NULL),

  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333315',
   '22222222-2222-2222-2222-222222222203', 'email', 'pending',
   now() + interval '1 day', 'Send bank financing checklist + lender shortlist.', NULL);

-- ============================================================
-- Activities (timeline seed entries)
-- ============================================================
INSERT INTO activities (organization_id, lead_id, user_id, type, title, description, metadata) VALUES
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333301',
   '22222222-2222-2222-2222-222222222203', 'lead_created',
   'Lead created', 'New lead from Zameen.com webhook', '{"source":"zameen"}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333301',
   '22222222-2222-2222-2222-222222222202', 'lead_assigned',
   'Assigned to Bilal Hussain', 'Round-robin assignment',
   '{"agentId":"22222222-2222-2222-2222-222222222203"}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333302',
   '22222222-2222-2222-2222-222222222204', 'call_completed',
   'Call connected with Fatima Tariq', 'Duration 4m 45s, outcome: interested',
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
-- GPS coords approximated to Karachi / Lahore / Islamabad offices.
-- ============================================================
INSERT INTO attendance (
  organization_id, user_id, date,
  check_in_time, check_out_time,
  check_in_lat, check_in_lng, check_out_lat, check_out_lng,
  status
) VALUES
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', CURRENT_DATE,
   CURRENT_DATE + time '09:12', CURRENT_DATE + time '18:24',
   24.86070000, 67.00110000, 24.86070000, 67.00110000, 'present'),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202', CURRENT_DATE,
   CURRENT_DATE + time '09:28', CURRENT_DATE + time '18:50',
   31.52040000, 74.35870000, 31.52040000, 74.35870000, 'present'),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222203', CURRENT_DATE,
   CURRENT_DATE + time '09:45', NULL,
   24.86070000, 67.00110000, NULL, NULL, 'late'),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222204', CURRENT_DATE,
   CURRENT_DATE + time '09:05', NULL,
   33.68440000, 73.04790000, NULL, NULL, 'present'),

  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222205', CURRENT_DATE,
   CURRENT_DATE + time '10:42', NULL,
   31.45040000, 73.13500000, NULL, NULL, 'late');

-- ============================================================
-- Social posts (5 rows)
-- ============================================================
INSERT INTO social_posts (
  organization_id, created_by, assigned_to, platform, caption, status, scheduled_at, notes
) VALUES
  ('11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222201',
   'instagram_post',
   'New launch: Emaar Crescent Bay in Clifton, Karachi. Premium 3-beds from Rs 2.85 Cr. DM to book a visit. #Karachi #LuxuryLiving',
   'scheduled', now() + interval '2 days',
   'Pair with carousel of 5 facade and amenities shots.'),

  ('11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222201',
   'instagram_reel',
   'Walkthrough of DHA Lahore Phase 6 — 2 kanal house, sold for Rs 11 Cr. Link in bio for similar.',
   'draft', NULL,
   'Need editor to add background score + price chip overlay.'),

  ('11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222201',
   'facebook_post',
   'Why Bahria Enclave is Islamabad''s smartest investment for 2026 — Margalla views, modern infra, gated security.',
   'idea', NULL,
   'Long-form post with stats. Pull 5-year price trend chart.'),

  ('11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222202', '22222222-2222-2222-2222-222222222201',
   'linkedin_post',
   'Closed: 4-bed Clifton apartment for Junaid S. Congratulations on the new home. Always rewarding to be part of this journey.',
   'published', now() - interval '3 days',
   'Tag client (with permission). Use brand template.'),

  ('11111111-1111-1111-1111-111111111111',
   '22222222-2222-2222-2222-222222222201', '22222222-2222-2222-2222-222222222201',
   'instagram_story',
   'Site visit reel — Bahria Karachi precincts. Swipe up to book yours.',
   'scheduled', now() + interval '6 hours',
   '15-second story, vertical, BTS shot from drone.');

-- ============================================================
-- Notifications (sample unread items)
-- ============================================================
INSERT INTO notifications (organization_id, user_id, type, title, body, metadata) VALUES
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222203',
   'new_lead', 'New Lead Assigned', 'Owais Cheema from Pakistan Property has been assigned to you',
   '{"leadId":"33333333-3333-3333-3333-333333333317"}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222204',
   'followup_due', 'Follow-up Due Soon', 'Follow up with Sara Zahid in 30 minutes',
   '{"leadId":"33333333-3333-3333-3333-333333333304"}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222202',
   'missed_call', 'Missed Auto-Call',
   'Faisal Ahmed''s call was not answered',
   '{"leadId":"33333333-3333-3333-3333-333333333311"}'::jsonb);
