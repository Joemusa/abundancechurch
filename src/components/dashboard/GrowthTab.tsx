"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LabelList, Cell,
} from "recharts";
import type { Member, Attendance } from "@/lib/types";

export default function GrowthTab({
  members,
  attendance,
}: {
  members: Member[];
  attendance: Attendance[];
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build daily attendance counts
  const dailyData = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const a of attendance) {
      if (!a.attendance_date) continue;
      byDay.set(a.attendance_date, (byDay.get(a.attendance_date) ?? 0) + 1);
    }
    return Array.from(byDay, ([date, count]) => ({ date, count })).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [attendance]);

  // Build a member lookup map for quick name resolution
  const memberMap = useMemo(() => {
    const m = new Map<string, Member>();
    for (const mem of members) {
      if (mem.member_id) m.set(mem.member_id, mem);
    }
    return m;
  }, [members]);

  // Attendance rows for the selected day
  const dayRows = useMemo(() => {
    if (!selectedDate) return [];
    return attendance.filter((a) => a.attendance_date === selectedDate);
  }, [attendance, selectedDate]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleBarClick(data: any) {
    const date = data?.activePayload?.[0]?.payload?.date as string | undefined;
    if (!date) return;
    setSelectedDate((prev) => (prev === date ? null : date));
  }

  return (
    <div>
      {/* Chart */}
      <p className="text-sm text-gray-500 mb-1">Attendance per day</p>
      <p className="text-xs text-gray-400 mb-3">
        Click a bar to see who attended on that day.
      </p>

      {dailyData.length ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={dailyData}
            margin={{ top: 18, right: 8, left: 0, bottom: 0 }}
            onClick={handleBarClick}
            style={{ cursor: "pointer" }}
          >
            <XAxis dataKey="date" fontSize={11} angle={-30} textAnchor="end" height={50} />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" radius={4}>
              {dailyData.map((entry) => (
                <Cell
                  key={entry.date}
                  fill={entry.date === selectedDate ? "#0f6e56" : "#534ab7"}
                />
              ))}
              <LabelList dataKey="count" position="top" fontSize={11} fill="#374151" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-gray-400">No attendance data available</p>
      )}

      {/* Attendance table — filtered to selected day, or all if none selected */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500">
            {selectedDate
              ? `Members who attended on ${selectedDate} (${dayRows.length})`
              : "Select a bar above to filter by day"}
          </p>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-teal-700 underline"
            >
              Clear — show all days
            </button>
          )}
        </div>

        {selectedDate && dayRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Branch</th>
                  <th className="py-2 pr-4">Zone leader</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {dayRows.map((a) => {
                  const mem = a.member_id ? memberMap.get(a.member_id) : null;
                  return (
                    <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 pr-4">{a.name || (mem ? `${mem.first_name} ${mem.surname}` : "—")}</td>
                      <td className="py-2 pr-4">{mem?.branch ?? "—"}</td>
                      <td className="py-2 pr-4">{mem?.zone_leader ?? "—"}</td>
                      <td className="py-2 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          a.status === "First Visit" ? "bg-blue-50 text-blue-700"
                          : a.status === "Second Visit" ? "bg-teal-50 text-teal-700"
                          : "bg-gray-100 text-gray-600"
                        }`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedDate && dayRows.length === 0 && (
          <p className="text-sm text-gray-400">No attendance records for this day.</p>
        )}
      </div>
    </div>
  );
}
