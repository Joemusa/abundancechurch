-- Run once in Supabase SQL Editor.

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Seed with the current default services
insert into services (name, sort_order) values
  ('Sunday Morning', 1),
  ('Sunday Evening', 2),
  ('Wednesday Bible Study', 3)
on conflict (name) do nothing;

-- Any authenticated user can read; admin controls writes via API route
alter table services enable row level security;

create policy "Authenticated read services" on services
  for select using (auth.role() = 'authenticated');

create policy "Authenticated insert services" on services
  for insert with check (auth.role() = 'authenticated');

create policy "Authenticated delete services" on services
  for delete using (auth.role() = 'authenticated');
