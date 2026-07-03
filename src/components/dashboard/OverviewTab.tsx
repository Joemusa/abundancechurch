"use client";

import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList,
} from "recharts";
import type { Member } from "@/lib/types";

const COLORS = ["#0f6e56", "#378ada", "#d4537e", "#ba7517"];

type PieLabelProps = {
  x?: number; y?: number;
  textAnchor?: "start" | "middle" | "end" | "inherit";
  percent?: number; name?: string | number;
};

function renderPieLabel({ x, y, textAnchor, percent, name }: PieLabelProps) {
  return (
    <text x={x} y={y} fill="#374151" fontSize={11} textAnchor={textAnchor} dominantBaseline="central">
      {`${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`}
    </text>
  );
}

const AGE_ORDER = ["Under 18", "18-25", "26-35", "36-45", "46-55", "56-65", "66+"];

function countBy(rows: Member[], key: keyof Member) {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const v = String(r[key] ?? "").trim();
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return Array.from(counts, ([name, value]) => ({ name, value }));
}

function sortAge(data: { name: string; value: number }[]) {
  return [...data].sort((a, b) => {
    const ai = AGE_ORDER.indexOf(a.name);
    const bi = AGE_ORDER.indexOf(b.name);
    // Known age bands sort by position; unknown values go to the end alphabetically
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export default function OverviewTab({ members }: { members: Member[] }) {
  const genderData = countBy(members, "gender");
  const employmentData = countBy(members, "employment_status");
  const ageData = sortAge(countBy(members, "age"));

  return (
    <div className="grid md:grid-cols-3 gap-6">
        <ChartCard title="Gender distribution">
          {genderData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name"
                  outerRadius={60} labelLine={false} label={renderPieLabel}>
                  {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </ChartCard>

        <ChartCard title="Employment status">
          {employmentData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={employmentData} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f6e56" radius={4}>
                  <LabelList dataKey="value" position="top" fontSize={11} fill="#374151" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </ChartCard>

        <ChartCard title="Age distribution">
          {ageData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ageData} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#534ab7" radius={4}>
                  <LabelList dataKey="value" position="top" fontSize={11} fill="#374151" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </ChartCard>
      </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-gray-400">No data available</p>;
}
