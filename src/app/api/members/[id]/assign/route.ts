import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { pastor, zoneLeader, ministryIds, departmentIds } = await request.json();

  const admin = createAdminClient();

  // Look up the member's text member_id, since the join tables reference
  // that rather than the uuid primary key.
  const { data: memberRow, error: fetchError } = await admin
    .from("members")
    .select("member_id")
    .eq("id", id)
    .single();

  if (fetchError || !memberRow?.member_id) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  const memberId = memberRow.member_id as string;

  // Update the simple one-per-member fields.
  const { error: updateError } = await admin
    .from("members")
    .update({ pastor: pastor?.trim() ?? "", zone_leader: zoneLeader?.trim() ?? "" })
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Replace ministry links: clear existing, then insert the selected set.
  const { error: clearMinistriesError } = await admin
    .from("member_ministries")
    .delete()
    .eq("member_id", memberId);
  if (clearMinistriesError) {
    return NextResponse.json({ error: clearMinistriesError.message }, { status: 500 });
  }
  if (Array.isArray(ministryIds) && ministryIds.length > 0) {
    const { error: insertMinistriesError } = await admin
      .from("member_ministries")
      .insert(ministryIds.map((ministryId: string) => ({ member_id: memberId, ministry_id: ministryId })));
    if (insertMinistriesError) {
      return NextResponse.json({ error: insertMinistriesError.message }, { status: 500 });
    }
  }

  // Replace service department links the same way.
  const { error: clearDeptsError } = await admin
    .from("member_service_departments")
    .delete()
    .eq("member_id", memberId);
  if (clearDeptsError) {
    return NextResponse.json({ error: clearDeptsError.message }, { status: 500 });
  }
  if (Array.isArray(departmentIds) && departmentIds.length > 0) {
    const { error: insertDeptsError } = await admin
      .from("member_service_departments")
      .insert(
        departmentIds.map((departmentId: string) => ({
          member_id: memberId,
          service_department_id: departmentId,
        }))
      );
    if (insertDeptsError) {
      return NextResponse.json({ error: insertDeptsError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
