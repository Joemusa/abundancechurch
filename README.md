# Church Executive Dashboard (Next.js + Supabase) — Multi-Tenant SaaS

This app now supports **many churches sharing one deployment**, each fully
isolated from the others: their own members, attendance, WhatsApp number,
and billing. New churches sign up themselves at `/signup` and get a 14-day
free trial automatically.

## What changed in the SaaS conversion

- **Multi-tenancy**: every table now has a `church_id`. Postgres Row Level
  Security automatically filters every query to the logged-in user's own
  church - the dashboard UI code itself barely changed, since RLS does the
  isolation transparently.
- **Self-serve signup** (`/signup`): collects church name + owner details,
  creates a `churches` row, an owner `profiles` row, and a Supabase Auth
  user, then logs them straight into their new (empty) dashboard.
- **Per-church WhatsApp**: each church connects its own Meta WhatsApp
  Business number from **Settings** (owner-only) inside the app, instead of
  one shared number in environment variables. WhatsApp Business numbers are
  one-per-organization on Meta's side, so this isn't optional - it's how
  WhatsApp actually works.
- **Per-church check-in QR**: each church's door check-in page now lives at
  `/checkin/[their-slug]` instead of one shared `/checkin` page.
- **Billing via Payfast**: a 14-day trial, then a flat monthly subscription
  collected through Payfast's recurring billing. Only the church owner sees
  billing controls.

## 1. Migrate your existing Supabase database

If you already have data in the single-tenant version of this app, run
`supabase/migration-saas.sql` **once** in your Supabase SQL Editor. It adds
the new tenancy tables, assigns all your existing data to a new "My Church"
record, and rewrites every security policy to be tenant-scoped. Full
details and a rollback-safe explanation are in the comments at the top of
that file.

After it runs:
1. Rename your church:
   `update churches set name = 'Your Real Name', slug = 'your-slug' where slug = 'my-church';`
2. Your existing Supabase Auth login has no `profiles` row yet (the
   migration can't know which login is "you"). Link it manually:
   ```sql
   insert into profiles (id, church_id, full_name, role)
   select id, (select id from churches where slug = 'your-slug'), 'Your Name', 'owner'
   from auth.users where email = 'your-existing-login-email@example.com';
   ```

Starting fresh with no existing data? Just run `supabase/schema.sql`
followed immediately by `supabase/migration-saas.sql` - the migration
works the same way on an empty database, you'll just have an empty legacy
church you can ignore or delete.

## 2. Environment variables

See `.env.local.example` for the full list. Two things changed from the
single-tenant version:
- `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` are **gone** - those
  are now per-church, entered through the in-app Settings page.
- New `PAYFAST_*` variables - these are **your** (the platform owner's)
  Payfast merchant credentials, used to bill every church's subscription.
  Individual churches never see or need their own Payfast account.

## 3. Set up Payfast

1. Create a Payfast merchant account at [payfast.io](https://payfast.io) if
   you don't have one, and a free [Sandbox](https://sandbox.payfast.co.za)
   account for testing.
2. Under **Settings > Security**, set a **passphrase** - recurring billing
   requires one, and signature validation will fail without it.
3. Under **Settings > Recurring Billing**, make sure **Subscriptions** is
   enabled.
4. Put your Merchant ID, Merchant Key, and passphrase into `PAYFAST_*` env
   vars, with `PAYFAST_SANDBOX=true` while testing.

**Test thoroughly in Sandbox before going live.** Payfast's own
documentation calls signature mismatches the most common integration
problem - small things like field order or encoding can break it. Before
flipping `PAYFAST_SANDBOX=false`:
- Sign up as a test church, go to Billing, click Subscribe, and confirm you
  land on Payfast's sandbox payment page without an error.
- Complete a test payment using Payfast's sandbox test card details (shown
  on their sandbox checkout page).
- Confirm the church's `subscription_status` actually flips to `active` in
  Supabase afterwards - this confirms the ITN webhook
  (`/api/payfast/notify`) is reachable and validating correctly. If it
  doesn't update, check your Vercel function logs for what the webhook
  rejected.

## 4. Each church connects their own WhatsApp number

After signing up, the church owner goes to **Settings** inside the
dashboard and enters their own Meta WhatsApp Cloud API Phone Number ID and
permanent access token (same Meta setup process as the single-tenant
version - see the WhatsApp section further down). Bulk WhatsApp sending is
disabled until this is connected.

## 5. Deploy

Same as before - push to GitHub, import into Vercel, set the environment
variables, deploy. No changes to the deployment process itself.

---

## Single-tenant feature history

The sections below describe features from before the SaaS conversion -
still accurate, just written from a single-church point of view.

## Chart data labels & visitor-to-member conversion

Every chart (gender pie, employment bars, age bars, daily attendance bars)
now shows its values directly on the chart, not just on hover.

The Attendance tab also has a new "Visitor → Member" KPI: of everyone whose
first-ever attendance record is a "First Visit," it shows what percentage
went on to attend a third time or more (i.e. graduated from visitor status
into regular "Present" attendance). It respects the date filter above, so
narrowing the date range narrows which visitors are counted too.

## Date range filter

The dashboard has a "From / To" date filter (with quick presets for Last 7
days, Last 30 days, and This month) sitting above the other filters. It
narrows attendance records to the selected range, and everything derived
from attendance updates with it: the Attendance tab, the Growth tab's daily
chart and attending-members count, the New Visitors tab, the Not Attending
tab, and the "Attendance records" KPI at the top. Leaving both dates empty
shows all-time data, same as before.

Tithing and Events keep their own dates and aren't affected by this filter,
since tithing history and (often future-dated) events don't make sense to
hide based on an attendance window - let me know if you'd like that changed.

## Door check-in via QR code

There's a public, no-login page at `/checkin/[church-slug]` for each church
(e.g. `https://your-app.vercel.app/checkin/grace-chapel`) built for exactly
this: print or display a QR code pointing to that URL at the entrance, and
anyone who scans it with their own phone can pick a service, search and tap
their own name, and be marked present instantly. People not yet in the
system can register themselves as a first-time visitor right there, which
automatically creates their member record and logs a "First Visit" - their
next check-in automatically becomes "Second Visit", matching the same
labels used elsewhere in the dashboard.

Each church's exact check-in URL (with their own slug already filled in) is
shown on their Settings page, and there's a quick link to open it from the
dashboard header too. Paste that URL into any free QR code generator and
print or display the result. The list of services people choose between
lives in `src/lib/services.ts` and is currently shared across all churches
- edit that array to match a real schedule and redeploy, or extend it to a
per-church setting later if different churches need different services.

This page is intentionally public (no Supabase Auth required), since regular
members don't have accounts - only leaders do. It only ever exposes a
person's first name, surname, and branch during search, never cellphone or
address, and every query is scoped to the one church the slug resolves to.

## What changed vs the Streamlit/Sheets version

- Google Sheets replaced with Supabase Postgres tables (real relational data,
  proper indexes, no API rate limits from reading a spreadsheet on every click).
- Login is now Supabase Auth with a separate account per leader instead of one
  shared admin/admin password.
- The WhatsApp "write a flag to columns R/S" hack is replaced by a real
  `whatsapp_logs` table, and messages are actually sent via the Meta WhatsApp
  Cloud API from a secure server-side route (the access token never reaches
  the browser).
- Geocoding calls Google's Geocoding API from a secure server-side route too,
  and results are saved once per address into `latitude`/`longitude` columns
  instead of being randomly re-jittered on every page load.
- The map is a real interactive Leaflet map (OpenStreetMap tiles, no extra
  API key needed for the map itself - only the Geocoding API key for
  converting addresses to coordinates).
- "Growth rate" is a real calculation (new registrations in the last 30 days
  vs. the 30 days before), not a placeholder number.

## Importing existing member data

If a church is migrating from spreadsheets, they can bulk-import via
Supabase directly: **Table Editor > members > Insert > Import data from
CSV** (also works for `attendance` and `tithing`). Supabase lets you map
CSV columns to database columns during import, so headers don't need to
match exactly. Import members first, since attendance/tithing reference
them. Each imported row needs that church's `church_id` filled in - easiest
done by importing while logged in as that church's owner via the
in-app forms, or by setting `church_id` manually in the CSV/import mapping.

## Google Geocoding setup

In Google Cloud Console, enable the "Geocoding API" on a project (a new one
is fine, doesn't need to be related to anything else), then create an API
key under Credentials and restrict it to that API. This is shared across
all churches on the platform - put it in `GOOGLE_MAPS_API_KEY`.

## Meta WhatsApp setup details

(Referenced from "Each church connects their own WhatsApp number" above -
every church goes through this same process for their own number.)

Create a Meta Business app with the WhatsApp product added, get a permanent
access token from a System User (Business Settings > System Users - not the
24-hour temporary token from the Quickstart page), and note the Phone
Number ID from WhatsApp Manager > API Setup. Also create at least one
approved Message Template (WhatsApp Manager > Message Templates) with a
single body variable - WhatsApp requires an approved template for
proactive bulk messages sent outside a 24-hour customer-service window,
which covers basically all church announcements.

## Local development

```
npm install
npm run dev
```

Uses the same environment variables as production (`.env.local`), pointed
at either your real Supabase project or a separate dev one.

## Deploy to Vercel

Push to GitHub, import the repo into Vercel, add every variable from
`.env.local.example` under Project Settings > Environment Variables, and
deploy. Any time you push a new commit, Vercel redeploys automatically.

## Notes

- Phone numbers are normalized assuming South African numbers (leading `0`
  becomes `+27`). Change `DEFAULT_COUNTRY_CODE` in `src/lib/phone.ts` if
  you're not in SA.
- Filters (gender, zone leader, branch, employment) are single-select for
  simplicity. If you want multi-select filtering later, that's a contained
  change to `FilterBar.tsx` and the filter logic in `DashboardShell.tsx`.
- Every table is scoped to a `church_id`, enforced by Row Level Security -
  a leader at one church can never see another church's data, even though
  they're all sharing the same database and deployment.
- Within a single church, any leader can see everything that church has (no
  finer-grained per-leader restriction). Only the `owner` role can change
  Settings (WhatsApp connection) and Billing.
