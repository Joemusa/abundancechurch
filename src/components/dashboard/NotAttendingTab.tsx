"use client";

import { useMemo, useState } from "react";
import type { Member, Attendance } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";

export default function NotAttendingTab({
  members,
  allAttendance,
  totalMembers,
}: {
  members: Member[];
  allAttendance: Attendance[];
  totalMembers: number;
}) {
  const [minAbsences, setMinAbsences] = useState<number>(0);

  // All unique service dates sorted descending
  const serviceDates = useMemo(() => {
    return Array.from(
      new Set(allAttendance.map((a) => a.attendance_date).filter(Boolean))
    ).sort((a, b) => b!.localeCompare(a!)) as string[];
  }, [allAttendance]);

  // Attendance lookup: Set of "memberId|date"
  const attendedSet = useMemo(() => {
    return new Set(allAttendance.map((a) => `${a.member_id}|${a.attendance_date}`));
  }, [allAttendance]);

  // Last seen date per member
  const lastSeenMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of allAttendance) {
      if (!a.member_id || !a.attendance_date) continue;
      const existing = map.get(a.member_id);
      if (!existing || a.attendance_date > existing) {
        map.set(a.member_id, a.attendance_date);
      }
    }
    return map;
  }, [allAttendance]);

  // Count how many service dates each member missed
  function absencesFor(memberId: string | null): number {
    if (!memberId) return serviceDates.length;
    return serviceDates.filter((d) => !attendedSet.has(`${memberId}|${d}`)).length;
  }

  // Consecutive absences check (last 2 services)
  const last2 = serviceDates.slice(0, 2);
  function isAbsent2Consecutive(memberId: string | null): boolean {
    if (!memberId || last2.length < 2) return false;
    return last2.every((d) => !attendedSet.has(`${memberId}|${d}`));
  }

  // Apply filter
  const filtered = useMemo(() => {
    if (minAbsences === 0) return members;
    return members.filter((m) => absencesFor(m.member_id) >= minAbsences);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, minAbsences, attendedSet, serviceDates]);

  // Max absences for range options
  const maxAbsences = serviceDates.length;

  function exportCsv() {
    downloadCsv(
      "members_not_attending.csv",
      ["First name", "Surname", "Branch", "Zone leader", "Cellphone", "Last seen", "Sundays absent"],
      filtered.map((m) => [
        m.first_name, m.surname, m.branch, m.zone_leader, m.cellphone,
        lastSeenMap.get(m.member_id ?? "") ?? "Never",
        String(absencesFor(m.member_id)),
      ])
    );
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-gray-600 whitespace-nowrap">Filter by Sundays absent:</label>
        <select
          value={minAbsences}
          onChange={(e) => setMinAbsences(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
        >
          <option value={0}>All ({members.length})</option>
          {Array.from({ length: maxAbsences }, (_, i) => i + 1).map((n) => {
            const count = members.filter((m) => absencesFor(m.member_id) >= n).length;
            if (count === 0) return null;
            return (
              <option key={n} value={n}>
                {n}+ Sunday{n !== 1 ? "s" : ""} absent ({count})
              </option>
            );
          })}
        </select>
        {minAbsences > 0 && (
          <button
            onClick={() => setMinAbsences(0)}
            className="text-xs text-teal-700 underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex justify-between items-center mb-2">
        <div>
          <p className="text-sm text-gray-500">
            {filtered.length} member{filtered.length !== 1 ? "s" : ""} not attending
            {minAbsences > 0 && ` (absent ${minAbsences}+ Sundays)`}
          </p>
          {last2.length >= 2 && (
            <p className="text-xs text-amber-600 mt-0.5">
              ⚠ Amber rows = absent from last 2 services ({last2[1]} and {last2[0]})
            </p>
          )}
        </div>
        <button
          onClick={exportCsv}
          className="text-sm border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Branch</th>
              <th className="py-2 pr-4">Zone leader</th>
              <th className="py-2 pr-4">Last seen</th>
              <th className="py-2 pr-4">Sundays absent</th>
              <th className="py-2 pr-4">Cellphone</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const absent2 = isAbsent2Consecutive(m.member_id);
              const lastSeen = lastSeenMap.get(m.member_id ?? "") ?? null;
              const absences = absencesFor(m.member_id);
              return (
                <tr
                  key={m.id}
                  className={`border-b ${
                    absent2 ? "bg-amber-50 border-amber-100" : "border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <td className="py-2 pr-4">
                    {m.first_name} {m.surname}
                    {absent2 && (
                      <span className="ml-2 text-[10px] text-amber-600 font-medium">2+ absences</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">{m.branch}</td>
                  <td className="py-2 pr-4">{m.zone_leader}</td>
                  <td className="py-2 pr-4 text-gray-400">{lastSeen ?? "Never attended"}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      absences >= 4 ? "bg-red-50 text-red-700"
                      : absences >= 2 ? "bg-amber-50 text-amber-700"
                      : "bg-gray-100 text-gray-600"
                    }`}>
                      {absences}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{m.cellphone}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 py-6 text-center">
            No members match this filter.
          </p>
        )}
      </div>
    </div>
  );
}
