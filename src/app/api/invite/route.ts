import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  // Must be logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Must be the admin
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && user.email !== adminEmail) {
    return NextResponse.json({ error: "Only the admin can invite new leaders." }, { status: 403 });
  }

  const { email } = await request.json();
  if (!email?.trim()) return NextResponse.json({ error: "Email is required." }, { status: 400 });

  const admin = createAdminClient();

  // Supabase Admin API: invite user by email
  // They receive an email with a link to set their password and log in
  const { error } = await admin.auth.admin.inviteUserByEmail(email.trim(), {
    redirectTo: `${request.headers.get("origin") ?? ""}/reset-password`,
  });

  if (error) {
    // Handle already-registered gracefully
    if (error.message.includes("already registered")) {
      return NextResponse.json({ error: "That email is already registered." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
