import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendText, sendTemplate } from "@/lib/whatsapp";
import { normalizePhone } from "@/lib/phone";

type RequestBody = {
  recipientIds: string[];
  message: string;
  useTemplate: boolean;
  contentSid?: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !fromNumber) {
    return NextResponse.json(
      { error: "Twilio credentials not configured in environment variables." },
      { status: 500 }
    );
  }

  const creds = { accountSid, authToken, fromNumber };

  const { recipientIds, message, useTemplate, contentSid: clientSid } = (await request.json()) as RequestBody;

  // Use the client-provided SID (admin override) or fall back to the
  // environment variable — non-admin users never send the SID at all
  const contentSid = clientSid?.trim() || process.env.TWILIO_CONTENT_SID || "";

  if (!message?.trim() || !recipientIds?.length) {
    return NextResponse.json({ error: "Message and recipients are required" }, { status: 400 });
  }
  if (useTemplate && !contentSid) {
    return NextResponse.json({ error: "Content Template SID is required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: members, error } = await admin
    .from("members")
    .select("id, member_id, first_name, surname, cellphone")
    .in("id", recipientIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { name: string; status: string }[] = [];

  for (const m of members ?? []) {
    const phone = normalizePhone(m.cellphone);
    const name = `${m.first_name} ${m.surname}`.trim();
    let status = "Failed: no valid phone number";

    if (phone) {
      const result = useTemplate
        ? await sendTemplate(phone, message, contentSid!, creds)
        : await sendText(phone, message, creds);
      status = result.ok ? "Sent" : result.detail;
    }

    await admin.from("whatsapp_logs").insert({
      member_id: m.member_id,
      recipient_name: name,
      phone: phone ?? "",
      status,
      message,
    });

    results.push({ name, status });
    await new Promise((r) => setTimeout(r, 300));
  }

  return NextResponse.json({ results });
}
