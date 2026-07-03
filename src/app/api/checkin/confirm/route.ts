import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { memberId, name, service } = await request.json();
  if (!memberId || !service) return NextResponse.json({ error: "Missing member or service" }, { status: 400 });

  const admin = createAdminClient();
  const { data: prior } = await admin.from("attendance").select("status").eq("member_id", memberId);
  const count = prior?.length ?? 0;
  let status = "Present";
  if (count === 0) status = "First Visit";
  else if (count === 1 && prior![0].status === "First Visit") status = "Second Visit";

  await admin.from("attendance").insert({
    member_id: memberId, name, service, status,
    attendance_date: new Date().toISOString().slice(0, 10),
  });
  return NextResponse.json({ status });
}
