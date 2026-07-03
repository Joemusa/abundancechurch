// Twilio WhatsApp integration.
//
// HOW TEMPLATES WORK WITH TWILIO (important):
// The same 24-hour rule applies via Twilio as it does via Meta directly —
// Twilio is just a layer on top of WhatsApp Business API. To send proactive
// messages to members outside a 24-hour window (which covers most church
// announcements), you need a pre-approved Content Template.
//
// RECOMMENDED TEMPLATE SETUP:
// Create ONE generic template in the Twilio console under
// Messaging > Content Templates that looks like this:
//
//   Friendly name: church_message
//   Content type: WhatsApp - Text
//   Body: {{1}}
//
// That's it — the entire message body is the single variable. This means any
// text you want to send can go into {{1}}, and you still comply with Meta's
// requirement for a pre-approved template structure.
//
// PHONE NUMBER FORMAT:
// Twilio WhatsApp requires "whatsapp:+27821234567" format. Your database
// stores E.164 ("+27821234567"). The helpers here prepend "whatsapp:"
// automatically — you don't need to change how numbers are stored.

const TWILIO_VERSION = "2010-04-01";

type SendResult = { ok: boolean; detail: string };

type Credentials = {
  accountSid: string;
  authToken: string;
  fromNumber: string; // e.g. "whatsapp:+14155238886" (your Twilio WhatsApp sender)
};

function toWhatsAppNumber(e164: string): string {
  return e164.startsWith("whatsapp:") ? e164 : `whatsapp:${e164}`;
}

async function post(
  to: string,
  body: string,
  creds: Credentials
): Promise<SendResult> {
  const url = `https://api.twilio.com/${TWILIO_VERSION}/Accounts/${creds.accountSid}/Messages.json`;

  const params = new URLSearchParams({
    From: toWhatsAppNumber(creds.fromNumber),
    To: toWhatsAppNumber(to),
    Body: body,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, detail: "Sent" };

    return {
      ok: false,
      detail: `Failed (${res.status}): ${(data as {message?: string}).message ?? JSON.stringify(data)}`,
    };
  } catch (err) {
    return { ok: false, detail: `Network error: ${(err as Error).message}` };
  }
}

// Session message — only works within 24 h of the recipient's last message.
export function sendText(to: string, message: string, creds: Credentials) {
  return post(to, message, creds);
}

// Template message — works outside the 24-hour window. Pass the full
// message text as bodyText; it goes into {{1}} of your generic template.
// contentSid is the Twilio Content Template SID (starts with "HX...") for
// your "church_message" template from the Twilio console.
export async function sendTemplate(
  to: string,
  bodyText: string,
  contentSid: string,
  creds: Credentials
): Promise<SendResult> {
  const url = `https://api.twilio.com/${TWILIO_VERSION}/Accounts/${creds.accountSid}/Messages.json`;

  const params = new URLSearchParams({
    From: toWhatsAppNumber(creds.fromNumber),
    To: toWhatsAppNumber(to),
    ContentSid: contentSid,
    ContentVariables: JSON.stringify({ "1": bodyText }),
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, detail: "Sent" };

    return {
      ok: false,
      detail: `Failed (${res.status}): ${(data as {message?: string}).message ?? JSON.stringify(data)}`,
    };
  } catch (err) {
    return { ok: false, detail: `Network error: ${(err as Error).message}` };
  }
}
