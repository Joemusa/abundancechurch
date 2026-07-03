import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  // Auth check — must be logged in
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin check — only the configured admin email may record payments
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && user.email !== adminEmail) {
    return NextResponse.json({ error: "Only the admin can record payments." }, { status: 403 });
  }

  const { period, amount, date_received, notes } = await request.json();

  if (!period || !amount || !date_received) {
    return NextResponse.json({ error: "Period, amount and date received are required." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Upsert — if the admin re-logs the same month it just updates
  const { error } = await admin
    .from("payments")
    .upsert({ period, amount, date_received, notes: notes ?? "" }, { onConflict: "period" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && user.email !== adminEmail) {
    return NextResponse.json({ error: "Only the admin can delete payments." }, { status: 403 });
  }

  const { period } = await request.json();
  if (!period) return NextResponse.json({ error: "Period is required." }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("payments").delete().eq("period", period);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
