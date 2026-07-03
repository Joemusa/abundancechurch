"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Member, EventRecord } from "@/lib/types";

const EVENT_TYPES = ["Wedding", "Funeral", "Birthday", "Anniversary"];

export default function EventsTab({
  members,
  events,
  onAdded,
}: {
  members: Member[];
  events: EventRecord[]; // already filtered by branch/gender/zone/employment AND date range upstream
  onAdded: () => void;
}) {
  const supabase = createClient();

  const [showForm, setShowForm] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("Planned");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const member = members.find((m) => m.id === memberId);
    if (!member) { setMessage("Select a member first."); return; }

    setSaving(true);
    const { error } = await supabase.from("events").insert({
      member_id: member.member_id,
      member_name: `${member.first_name} ${member.surname}`.trim(),
      cellphone: member.cellphone,
      event_type: eventType,
      event_date: eventDate,
      status,
      notes,
    });
    setSaving(false);

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage("Event saved.");
      setNotes(""); setMemberId("");
      setShowForm(false);
      onAdded();
    }
  }

  return (
    <div>
      {/* Add event toggle */}
      <button
        onClick={() => { setShowForm((s) => !s); setMessage(null); }}
        className="text-sm border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50 mb-4"
      >
        {showForm ? "Cancel" : "+ Add event"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="max-w-lg space-y-3 mb-6 border border-gray-200 rounded-md p-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Event type</label>
            <select value={eventType} onChange={(e) => setEventType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Member</label>
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)} required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="">Select a member...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.first_name} {m.surname}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option>Planned</option>
                <option>Completed</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={saving}
            className="bg-teal-700 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-800 disabled:opacity-50">
            {saving ? "Saving..." : "Save event"}
          </button>
          {message && <p className="text-sm text-gray-600">{message}</p>}
        </form>
      )}

      {/* Events list */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Member</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Notes</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-4">{ev.event_date ?? "—"}</td>
                <td className="py-2 pr-4">{ev.member_name}</td>
                <td className="py-2 pr-4">{ev.event_type}</td>
                <td className="py-2 pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    ev.status === "Completed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {ev.status}
                  </span>
                </td>
                <td className="py-2 pr-4 text-gray-400">{ev.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && (
          <p className="text-sm text-gray-400 py-6 text-center">
            No events match the current filters.
          </p>
        )}
      </div>
    </div>
  );
}
