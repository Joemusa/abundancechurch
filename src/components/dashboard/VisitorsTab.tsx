"use client";

import { useMemo } from "react";
import type { Attendance, Member } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";

export default function VisitorsTab({
  visitors,
  members,
}: {
  visitors: Attendance[];
  members: Member[]; // used to look up branch + gender for each visitor
}) {
  const memberMap = useMemo(() => {
    const map = new Map<string, Member>();
    for (const m of members) {
      if (m.member_id) map.set(m.member_id, m);
    }
    return map;
  }, [members]);

  function exportCsv() {
    downloadCsv(
      "new_visitors.csv",
      ["Date", "Name", "Branch", "Gender", "Status"],
      visitors.map((v) => {
        const mem = v.member_id ? memberMap.get(v.member_id) : null;
        return [v.attendance_date ?? "", v.name, mem?.branch ?? "—", mem?.gender ?? "—", v.status];
      })
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-gray-500">Visitor records</p>
        <button
          onClick={exportCsv}
          className="text-sm border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50"
        >
          Export CSV
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-200">
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Branch</th>
            <th className="py-2 pr-4">Gender</th>
            <th className="py-2 pr-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {visitors.map((v) => {
            const mem = v.member_id ? memberMap.get(v.member_id) : null;
            return (
              <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-4">{v.attendance_date}</td>
                <td className="py-2 pr-4">{v.name}</td>
                <td className="py-2 pr-4">{mem?.branch ?? "—"}</td>
                <td className="py-2 pr-4">{mem?.gender ?? "—"}</td>
                <td className="py-2 pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    v.status === "First Visit"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-teal-50 text-teal-700"
                  }`}>
                    {v.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
