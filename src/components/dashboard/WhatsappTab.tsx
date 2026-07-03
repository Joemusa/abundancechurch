"use client";

import { useState, useEffect } from "react";
import type { Member } from "@/lib/types";

const RECIPIENT_TYPES = [
  "Zone leaders only",
  "Members under zone leader",
  "Specific member",
  "Pastors only",
  "Members only",
] as const;

type RecipientType = (typeof RECIPIENT_TYPES)[number];
type SendResult = { name: string; status: string };

const TEMPLATE_SID_STORAGE_KEY = "church-dashboard:whatsapp-content-sid";

export default function WhatsappTab({ members, isAdmin }: { members: Member[]; isAdmin: boolean }) {
  const [recipientType, setRecipientType] = useState<RecipientType>("Zone leaders only");
  const [selectedLeader, setSelectedLeader] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [message, setMessage] = useState("");
  const [useTemplate, setUseTemplate] = useState(true);
  const [contentSid, setContentSid] = useState("");
  const [sending, setSending] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [results, setResults] = useState<SendResult[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(TEMPLATE_SID_STORAGE_KEY);
    if (saved) setContentSid(saved);
  }, []);

  function handleContentSidChange(value: string) {
    setContentSid(value);
    if (value.trim()) {
      localStorage.setItem(TEMPLATE_SID_STORAGE_KEY, value.trim());
    } else {
      localStorage.removeItem(TEMPLATE_SID_STORAGE_KEY);
    }
  }

  const leaders = Array.from(new Set(members.map((m) => m.zone_leader).filter(Boolean))).sort();

  // Filtered member list for the specific member search
  const filteredMembers = memberSearch.trim().length > 0
    ? members.filter((m) =>
        `${m.first_name} ${m.surname}`.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : members;

  let recipients: Member[] = [];
  if (recipientType === "Zone leaders only") {
    recipients = members.filter((m) => m.status.toLowerCase() === "zone leader");
  } else if (recipientType === "Pastors only") {
    recipients = members.filter((m) => m.status.toLowerCase() === "pastor");
  } else if (recipientType === "Members only") {
    recipients = members.filter((m) => m.status.toLowerCase() === "member");
  } else if (recipientType === "Members under zone leader") {
    recipients = selectedLeader ? members.filter((m) => m.zone_leader === selectedLeader) : [];
  } else if (recipientType === "Specific member") {
    const found = members.find((m) => m.id === selectedMemberId);
    recipients = found ? [found] : [];
  }

  async function handleSend() {
    if (!recipients.length || !message.trim()) return;
    if (useTemplate && !contentSid.trim()) return;

    setSending(true);
    setSummary(null);
    setResults([]);

    const res = await fetch("/api/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientIds: recipients.map((r) => r.id),
        message,
        useTemplate,
        contentSid: useTemplate ? contentSid : undefined,
      }),
    });

    const data = await res.json();
    setSending(false);

    if (data.error) {
      setSummary(`Error: ${data.error}`);
      return;
    }

    setResults(data.results);
    const sent = data.results.filter((r: SendResult) => r.status === "Sent").length;
    const failed = data.results.length - sent;
    setSummary(failed ? `${sent} sent, ${failed} failed.` : `All ${sent} messages sent.`);
  }

  return (
    <div className="max-w-lg">
      {/* Recipient type */}
      <label className="block text-sm text-gray-600 mb-1">Recipient type</label>
      <select
        value={recipientType}
        onChange={(e) => {
          setRecipientType(e.target.value as RecipientType);
          setSelectedLeader("");
          setSelectedMemberId("");
          setMemberSearch("");
        }}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3"
      >
        {RECIPIENT_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {/* Zone leader sub-selector */}
      {recipientType === "Members under zone leader" && (
        <select
          value={selectedLeader}
          onChange={(e) => setSelectedLeader(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3"
        >
          <option value="">Select a zone leader...</option>
          {leaders.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      )}

      {/* Specific member selector */}
      {recipientType === "Specific member" && (
        <div className="mb-3">
          <input
            placeholder="Search member by name..."
            value={memberSearch}
            onChange={(e) => { setMemberSearch(e.target.value); setSelectedMemberId(""); }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-2"
            autoFocus
          />
          {/* Show results only when searching */}
          {memberSearch.trim().length > 0 && (
            <div className="border border-gray-200 rounded-md overflow-hidden max-h-48 overflow-y-auto">
              {filteredMembers.length === 0 ? (
                <p className="text-sm text-gray-400 px-3 py-2">No members found</p>
              ) : (
                filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMemberId(m.id);
                      setMemberSearch(`${m.first_name} ${m.surname}`);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 ${
                      selectedMemberId === m.id ? "bg-teal-50 text-teal-700" : ""
                    }`}
                  >
                    <span className="font-medium">{m.first_name} {m.surname}</span>
                    {m.branch && <span className="text-gray-400 text-xs ml-2">· {m.branch}</span>}
                    {m.zone_leader && <span className="text-gray-400 text-xs ml-1">· {m.zone_leader}</span>}
                  </button>
                ))
              )}
            </div>
          )}
          {selectedMemberId && (
            <p className="text-xs text-teal-700 mt-1">
              ✓ {memberSearch} selected
            </p>
          )}
        </div>
      )}

      <p className="text-sm text-gray-500 mb-3">{recipients.length} recipient(s) selected</p>

      {/* Message */}
      <label className="block text-sm text-gray-600 mb-1">Message</label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3"
        placeholder="Type your announcement here..."
      />

      {/* Template toggle */}
      <label className="flex items-center gap-2 text-sm mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={useTemplate}
          onChange={(e) => setUseTemplate(e.target.checked)}
        />
        Send as a Twilio Content Template (required outside 24-hour window)
      </label>

      {useTemplate && isAdmin && (
        <div className="mb-3">
          <label className="block text-sm text-gray-600 mb-1">Content Template SID</label>
          <input
            placeholder="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            value={contentSid}
            onChange={(e) => handleContentSidChange(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      )}

      {!useTemplate && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-700 mb-3">
          Session messages only work if the recipient messaged your WhatsApp
          number in the last 24 hours. For most church announcements, use the
          template option instead.
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={sending || !recipients.length || !message.trim()}
        className="w-full bg-teal-700 text-white rounded-md py-2 text-sm font-medium hover:bg-teal-800 disabled:opacity-50"
      >
        {sending ? "Sending..." : "Send WhatsApp"}
      </button>

      {summary && <p className="text-sm text-gray-700 font-medium mt-4">{summary}</p>}

      {results.length > 0 && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="py-2 pr-4">Recipient</th>
                <th className="py-2 pr-4">Result</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{r.name}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === "Sent"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
