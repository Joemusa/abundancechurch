-- Run once in Supabase SQL Editor.
-- Adds: a Pastor field per member (same pattern as the existing zone_leader
-- field), plus Ministries and Service Departments as proper entities - each
-- with their own leader - since a member can belong to more than one of
-- each. Two join tables link members to as many ministries/departments as
-- needed.

-- ----------------------------------------------------------------
-- Pastor field (mirrors zone_leader: a single value per member)
-- ----------------------------------------------------------------

alter table members add column if not exists pastor text default '';
create index if not exists idx_members_pastor on members(pastor);

-- ----------------------------------------------------------------
-- Ministries (e.g. "Youth Ministry", "Women's Ministry") - each with its
-- own leader. A member can belong to more than one.
-- ----------------------------------------------------------------

create table if not exists ministries (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  leader text default '',
  created_at timestamptz default now()
);

create table if not exists member_ministries (
  member_id text references members(member_id) on delete cascade,
  ministry_id uuid references ministries(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (member_id, ministry_id)
);

-- ----------------------------------------------------------------
-- Service Departments (e.g. "Ushering", "Sound & Media") - each with its
-- own leader. A member can belong to more than one.
-- ----------------------------------------------------------------

create table if not exists service_departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  leader text default '',
  created_at timestamptz default now()
);

create table if not exists member_service_departments (
  member_id text references members(member_id) on delete cascade,
  service_department_id uuid references service_departments(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (member_id, service_department_id)
);

-- ----------------------------------------------------------------
-- Row Level Security - same pattern as the existing services table:
-- any authenticated leader can read; writes go through API routes using
-- the service-role key (which bypasses RLS), so insert/delete policies
-- here are a safety net rather than the primary write path.
-- ----------------------------------------------------------------

alter table ministries enable row level security;
alter table member_ministries enable row level security;
alter table service_departments enable row level security;
alter table member_service_departments enable row level security;

create policy "Authenticated read ministries" on ministries
  for select using (auth.role() = 'authenticated');
create policy "Authenticated insert ministries" on ministries
  for insert with check (auth.role() = 'authenticated');
create policy "Authenticated delete ministries" on ministries
  for delete using (auth.role() = 'authenticated');

create policy "Authenticated read member_ministries" on member_ministries
  for select using (auth.role() = 'authenticated');
create policy "Authenticated insert member_ministries" on member_ministries
  for insert with check (auth.role() = 'authenticated');
create policy "Authenticated delete member_ministries" on member_ministries
  for delete using (auth.role() = 'authenticated');

create policy "Authenticated read service_departments" on service_departments
  for select using (auth.role() = 'authenticated');
create policy "Authenticated insert service_departments" on service_departments
  for insert with check (auth.role() = 'authenticated');
create policy "Authenticated delete service_departments" on service_departments
  for delete using (auth.role() = 'authenticated');

create policy "Authenticated read member_service_departments" on member_service_departments
  for select using (auth.role() = 'authenticated');
create policy "Authenticated insert member_service_departments" on member_service_departments
  for insert with check (auth.role() = 'authenticated');
create policy "Authenticated delete member_service_departments" on member_service_departments
  for delete using (auth.role() = 'authenticated');
