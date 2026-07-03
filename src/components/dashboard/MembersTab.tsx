"use client";

import { useState } from "react";
import type { Member } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";
import { Trash2 } from "lucide-react";

export default function MembersTab({
  members,
  onDeleted,
}: {
  members: Member[];
  onDeleted: () => void;
}) {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = members.filter((m) =>
    `${m.first_name} ${m.surname} ${m.branch} ${m.zone_leader} ${m.status} ${m.gender}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  async function handleDelete(m: Member) {
    if (!confirm(`Delete ${m.first_name} ${m.surname}? This cannot be undone.`)) return;
    setDeleting(m.id);
    const res = await fetch(`/api/members/${m.id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) {
      onDeleted();
    } else {
      const data = await res.json().catch(() => ({}));
      alert((data as { error?: string }).error ?? "Delete failed.");
    }
  }

  function exportCsv() {
    downloadCsv(
      "members.csv",
      ["First name", "Surname", "Gender", "Branch", "Zone leader", "Status", "Cellphone"],
      filtered.map((m) => [m.first_name, m.surname, m.gender, m.branch, m.zone_leader, m.status, m.cellphone])
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3">
        <input
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-full max-w-sm"
        />
        <button
          onClick={exportCsv}
          className="text-sm border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50 whitespace-nowrap"
        >
          Export CSV
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-2">
        Showing {filtered.length} of {members.length} members
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Gender</th>
              <th className="py-2 pr-4">Branch</th>
              <th className="py-2 pr-4">Zone leader</th>
              <th className="py-2 pr-4">Employment</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Cellphone</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-4">{m.first_name} {m.surname}</td>
                <td className="py-2 pr-4">{m.gender}</td>
                <td className="py-2 pr-4">{m.branch}</td>
                <td className="py-2 pr-4">{m.zone_leader}</td>
                <td className="py-2 pr-4">
                  <span>{m.employment_status}</span>
                  {m.job_title && <span className="block text-xs text-gray-400">{m.job_title}</span>}
                  {m.study_field && <span className="block text-xs text-gray-400">{m.study_field}</span>}
                  {m.school_grade && <span className="block text-xs text-gray-400">Grade {m.school_grade}</span>}
                </td>
                <td className="py-2 pr-4">{m.status}</td>
                <td className="py-2 pr-4">{m.cellphone}</td>
                <td className="py-2">
                  <button
                    onClick={() => handleDelete(m)}
                    disabled={deleting === m.id}
                    className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
                    title="Delete member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
