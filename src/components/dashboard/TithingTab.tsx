"use client";

import { useMemo } from "react";
import type { Tithing, Member } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";

export default function TithingTab({
  tithing,
  members,
}: {
  tithing: Tithing[]; // already filtered by branch/gender/zone/employment AND date range upstream
  members: Member[]; // used only to look up branch/zone leader for display - already filtered too
}) {
  // Build a quick lookup: member_id → Member
  const memberMap = useMemo(() => {
    const m = new Map<string, Member>();
    for (const mem of members) {
      if (mem.member_id) m.set(mem.member_id, mem);
    }
    return m;
  }, [members]);

  const uniqueMemberCount = useMemo(
    () => new Set(tithing.map((t) => t.member_id).filter(Boolean)).size,
    [tithing]
  );

  function exportCsv() {
    downloadCsv(
      "tithing_members.csv",
      ["Date", "Name", "Surname", "Branch", "Zone leader", "Cellphone"],
      tithing.map((t) => {
        const mem = t.member_id ? memberMap.get(t.member_id) : null;
        return [
          t.tithe_date ?? "",
          t.name,
          t.surname,
          mem?.branch ?? "—",
          mem?.zone_leader ?? "—",
          t.cellphone,
        ];
      })
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-gray-500">
          {tithing.length} tithing record{tithing.length === 1 ? "" : "s"}
          {uniqueMemberCount > 0 && ` from ${uniqueMemberCount} member${uniqueMemberCount === 1 ? "" : "s"}`}
        </p>
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
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Branch</th>
              <th className="py-2 pr-4">Zone leader</th>
              <th className="py-2 pr-4">Cellphone</th>
            </tr>
          </thead>
          <tbody>
            {tithing.map((t) => {
              const mem = t.member_id ? memberMap.get(t.member_id) : null;
              return (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 pr-4">{t.tithe_date}</td>
                  <td className="py-2 pr-4">{t.name} {t.surname}</td>
                  <td className="py-2 pr-4">{mem?.branch ?? "—"}</td>
                  <td className="py-2 pr-4">{mem?.zone_leader ?? "—"}</td>
                  <td className="py-2 pr-4">{t.cellphone}</td>
                </tr>
              );
            })}
            {tithing.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-gray-400">
                  No tithing records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
