import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { geocodeAddress } from "@/lib/geocode";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: members, error } = await admin
    .from("members")
    .select("id, address")
    .is("latitude", null)
    .neq("address", "");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let updated = 0;
  const failures: string[] = [];

  for (const m of members ?? []) {
    const coords = await geocodeAddress(m.address);
    if (coords) {
      await admin
        .from("members")
        .update({ latitude: coords.lat, longitude: coords.lng })
        .eq("id", m.id);
      updated++;
    } else {
      failures.push(m.address);
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  return NextResponse.json({ updated, failures });
}
