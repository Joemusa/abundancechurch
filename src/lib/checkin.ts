import { createAdminClient } from "@/lib/supabase/admin";

// Looks up a church by its public slug (used by the unauthenticated QR
// check-in routes, which can't rely on RLS/auth.uid() since there's no
// logged-in user). Returns null if the slug doesn't match a church.
export async function resolveChurchBySlug(slug: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("churches").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

// Records an attendance row for a member, automatically labeling it
// "First Visit" or "Second Visit" based on their attendance history -
// mirrors the old spreadsheet's New Visitors logic.
export async function recordAttendance(
  churchId: string,
  memberCode: string,
  name: string,
  service: string
): Promise<string> {
  const admin = createAdminClient();

  const { data: prior } = await admin
    .from("attendance")
    .select("status")
    .eq("church_id", churchId)
    .eq("member_id", memberCode);

  const count = prior?.length ?? 0;
  let status = "Present";
  if (count === 0) {
    status = "First Visit";
  } else if (count === 1 && prior![0].status === "First Visit") {
    status = "Second Visit";
  }

  await admin.from("attendance").insert({
    church_id: churchId,
    member_id: memberCode,
    name,
    service,
    status,
    attendance_date: new Date().toISOString().slice(0, 10),
  });

  return status;
}
