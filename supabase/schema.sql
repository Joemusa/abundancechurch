-- Run this entire file in Supabase: Dashboard > SQL Editor > New query.
-- Safe to run once on a fresh project. Re-running will error on "already
-- exists" - that's fine, it means it's already set up.

-- ----------------------------------------------------------------
-- TABLES
-- ----------------------------------------------------------------

create table members (
  id uuid primary key default gen_random_uuid(),
  member_id text unique,              -- original MemberID from the Google Sheet, kept so CSV re-imports/updates match
  first_name text default '',
  surname text default '',
  cellphone text default '',
  gender text default '',
  age text default '',
  province text default '',
  region text default '',
  branch text default '',
  employment_status text default '',
  zone_leader text default '',
  status text default '',
  address text default '',
  latitude double precision,
  longitude double precision,
  registered_at timestamptz,
  created_at timestamptz default now()
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  member_id text references members(member_id) on delete set null,
  attendance_date date,
  service text default '',
  name text default '',
  status text default '',
  created_at timestamptz default now()
);

create table tithing (
  id uuid primary key default gen_random_uuid(),
  member_id text references members(member_id) on delete set null,
  tithe_date date,
  name text default '',
  surname text default '',
  cellphone text default '',
  created_at timestamptz default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  member_id text references members(member_id) on delete set null,
  member_name text default '',
  cellphone text default '',
  event_type text default '',
  event_date date,
  status text default '',
  notes text default '',
  created_at timestamptz default now()
);

create table intentional_contacts (
  id uuid primary key default gen_random_uuid(),
  zone_leader text default '',
  visit_date date,
  person_visited text default '',
  reason_for_visit text default '',
  address text default '',
  contact_number text default '',
  created_at timestamptz default now()
);

create table whatsapp_logs (
  id uuid primary key default gen_random_uuid(),
  member_id text references members(member_id) on delete set null,
  recipient_name text default '',
  phone text default '',
  status text default '',
  message text default '',
  sent_at timestamptz default now()
);

-- ----------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------

create index idx_attendance_member_id on attendance(member_id);
create index idx_attendance_date on attendance(attendance_date);
create index idx_tithing_member_id on tithing(member_id);
create index idx_events_member_id on events(member_id);
create index idx_whatsapp_logs_member_id on whatsapp_logs(member_id);
create index idx_members_zone_leader on members(zone_leader);

-- ----------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Any logged-in leader can read everything and add events/visits.
-- Updates to members (geocoding) and writes to whatsapp_logs only happen
-- through the server-side API routes using the secret key, which bypasses
-- RLS entirely - so no insert/update policy is needed for those here.
-- ----------------------------------------------------------------

alter table members enable row level security;
alter table attendance enable row level security;
alter table tithing enable row level security;
alter table events enable row level security;
alter table intentional_contacts enable row level security;
alter table whatsapp_logs enable row level security;

create policy "Authenticated read members" on members
  for select using (auth.role() = 'authenticated');

create policy "Authenticated read attendance" on attendance
  for select using (auth.role() = 'authenticated');

create policy "Authenticated read tithing" on tithing
  for select using (auth.role() = 'authenticated');

create policy "Authenticated read events" on events
  for select using (auth.role() = 'authenticated');

create policy "Authenticated insert events" on events
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated read contacts" on intentional_contacts
  for select using (auth.role() = 'authenticated');

create policy "Authenticated insert contacts" on intentional_contacts
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated read whatsapp logs" on whatsapp_logs
  for select using (auth.role() = 'authenticated');
