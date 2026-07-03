import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-only client using the secret key - bypasses Row Level Security.
// Never import this from a Client Component or anything bundled for the browser.
// Used only inside Route Handlers (app/api/**) after we've already verified
// the caller is an authenticated user.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
