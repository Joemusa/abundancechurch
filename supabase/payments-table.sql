-- Run in Supabase SQL Editor.
-- Tracks monthly subscription payments recorded manually by the admin.

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  period text not null,          -- "YYYY-MM" e.g. "2026-06"
  amount numeric(10, 2) not null,
  date_received date not null,
  notes text default '',
  created_at timestamptz default now()
);

-- Prevent duplicate entries for the same month
create unique index if not exists payments_period_unique on payments(period);

-- Allow any authenticated user to read (all leaders can see the status)
alter table payments enable row level security;

create policy "Authenticated read payments" on payments
  for select using (auth.role() = 'authenticated');

-- Only the admin should insert/update — enforced in the UI via ADMIN_EMAIL
-- env var; using the service-role key in the API route also bypasses RLS.
