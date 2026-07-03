-- Run once in Supabase SQL Editor.
--
-- If you got "relation intentional_contacts does not exist" when adding the
-- branch column, the table itself was never created. This script creates it
-- fresh (with branch already included) if missing, or just adds the branch
-- column if the table already exists - safe to run either way.

create table if not exists intentional_contacts (
  id uuid primary key default gen_random_uuid(),
  zone_leader text not null default '',
  branch text not null default '',
  visit_date date,
  person_visited text not null default '',
  reason_for_visit text default '',
  address text default '',
  contact_number text default '',
  created_at timestamptz default now()
);

alter table intentional_contacts add column if not exists branch text default '';

-- Matches the same RLS pattern as your other tables - any logged-in leader
-- can read/write. Safe to run even if the policy already exists.
alter table intentional_contacts enable row level security;

drop policy if exists "Authenticated read contacts" on intentional_contacts;
create policy "Authenticated read contacts" on intentional_contacts
  for select using (auth.role() = 'authenticated');

drop policy if exists "Authenticated insert contacts" on intentional_contacts;
create policy "Authenticated insert contacts" on intentional_contacts
  for insert with check (auth.role() = 'authenticated');
