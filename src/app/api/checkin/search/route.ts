import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 2) return NextResponse.json({ results: [] });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("members")
    .select("id, member_id, first_name, surname, branch")
    .or(`first_name.ilike.%${q}%,surname.ilike.%${q}%`)
    .limit(8);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ results: data ?? [] });
}
