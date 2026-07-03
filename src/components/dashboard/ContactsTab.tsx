"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { IntentionalContact } from "@/lib/types";

export default function ContactsTab({
  contacts,
  branches,
  onAdded,
}: {
  contacts: IntentionalContact[];
  branches: string[]; // distinct branch names, for the form dropdown
  onAdded: () => void;
}) {
  const supabase = createClient();

  const [showForm, setShowForm] = useState(false);
  const [zoneLeader, setZoneLeader] = useState("");
  const [branch, setBranch] = useState(branches[0] ?? "");
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [personVisited, setPersonVisited] = useState("");
  const [reason, setReason] = useState("");
  const [address, setAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!zoneLeader || !personVisited) return;

    setSaving(true);
    await supabase.from("intentional_contacts").insert({
      zone_leader: zoneLeader,
      branch,
      visit_date: visitDate,
      person_visited: personVisited,
      reason_for_visit: reason,
      address,
      contact_number: contactNumber,
    });
    setSaving(false);
    setZoneLeader("");
    setPersonVisited("");
    setReason("");
    setAddress("");
    setContactNumber("");
    setShowForm(false);
    onAdded();
  }

  return (
    <div>
      <button
        onClick={() => setShowForm((s) => !s)}
        className="text-sm border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50 mb-4"
      >
        {showForm ? "Hide form" : "+ Add intentional visit"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="max-w-lg space-y-3 mb-6 border border-gray-200 rounded-md p-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {branches.length === 0 && <option value="">No branches found</option>}
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <input
            placeholder="Zone leader"
            value={zoneLeader}
            onChange={(e) => setZoneLeader(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            placeholder="Person visited"
            value={personVisited}
            onChange={(e) => setPersonVisited(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Reason for visit"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            placeholder="Contact number"
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-teal-700 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Submit visit"}
          </button>
        </form>
      )}

      <p className="text-sm text-gray-500 mb-2">{contacts.length} recorded visits</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-200">
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Branch</th>
            <th className="py-2 pr-4">Zone leader</th>
            <th className="py-2 pr-4">Person visited</th>
            <th className="py-2 pr-4">Reason</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((c) => (
            <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2 pr-4">{c.visit_date}</td>
              <td className="py-2 pr-4">{c.branch || "—"}</td>
              <td className="py-2 pr-4">{c.zone_leader}</td>
              <td className="py-2 pr-4">{c.person_visited}</td>
              <td className="py-2 pr-4">{c.reason_for_visit}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {contacts.length === 0 && (
        <p className="text-sm text-gray-400 py-6 text-center">
          No visits recorded for the current filters.
        </p>
      )}
    </div>
  );
}
