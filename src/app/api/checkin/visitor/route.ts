import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const {
    firstName, surname, cellphone, service,
    gender, age, branch, employment_status, address,
    job_title, study_field, school_grade,
  } = await request.json();

  if (!firstName?.trim() || !surname?.trim() || !service)
    return NextResponse.json({ error: "Name and service are required" }, { status: 400 });

  const admin = createAdminClient();
  const memberCode = `VIS-${Date.now()}`;

  const { error } = await admin.from("members").insert({
    member_id: memberCode,
    first_name: firstName.trim(),
    surname: surname.trim(),
    cellphone: cellphone ?? "",
    gender: gender ?? "",
    age: age ?? "",
    branch: branch ?? "",
    employment_status: employment_status ?? "",
    job_title: job_title ?? "",
    study_field: study_field ?? "",
    school_grade: school_grade ?? "",
    address: address ?? "",
    status: "Visitor",
    registered_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("attendance").insert({
    member_id: memberCode,
    name: `${firstName} ${surname}`.trim(),
    service,
    status: "First Visit",
    attendance_date: new Date().toISOString().slice(0, 10),
  });

  return NextResponse.json({ status: "First Visit" });
}
