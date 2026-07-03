"use client";

import type { Attendance } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";

export default function AttendanceTab({ attendance }: { attendance: Attendance[] }) {
  function exportCsv() {
    downloadCsv(
      "attendance.csv",
      ["Date", "Service", "Member ID", "Name", "Status"],
      attendance.map((a) => [a.attendance_date ?? "", a.service, a.member_id ?? "", a.name, a.status])
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-gray-500">Attendance records</p>
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
              <th className="py-2 pr-4">Service</th>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((a) => (
              <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-4">{a.attendance_date}</td>
                <td className="py-2 pr-4">{a.service}</td>
                <td className="py-2 pr-4">{a.name}</td>
                <td className="py-2 pr-4">{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {attendance.length === 0 && (
          <p className="text-sm text-gray-400 py-6 text-center">
            No attendance records in the selected date range.
          </p>
        )}
      </div>
    </div>
  );
}
