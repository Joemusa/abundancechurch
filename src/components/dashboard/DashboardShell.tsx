"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  LayoutDashboard, Users, TrendingUp, CalendarCheck, UserPlus,
  UserX, HandCoins, MessageCircle, Map as MapIcon, CalendarDays,
  Footprints, LogOut, SlidersHorizontal, X, ShieldCheck, QrCode, Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Member, Attendance, Tithing, IntentionalContact, EventRecord } from "@/lib/types";
import KpiCard from "./KpiCard";
import OverviewTab from "./OverviewTab";
import MembersTab from "./MembersTab";
import GrowthTab from "./GrowthTab";
import AttendanceTab from "./AttendanceTab";
import VisitorsTab from "./VisitorsTab";
import NotAttendingTab from "./NotAttendingTab";
import TithingTab from "./TithingTab";
import WhatsappTab from "./WhatsappTab";
import MapTab from "./MapTab";
import EventsTab from "./EventsTab";
import ContactsTab from "./ContactsTab";
import AdminTab from "./AdminTab";
import CheckinQRTab from "./CheckinQRTab";
import SettingsTab from "./SettingsTab";

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "members", label: "Members", icon: Users },
  { key: "growth", label: "Growth", icon: TrendingUp },
  { key: "attendance", label: "Attendance", icon: CalendarCheck },
  { key: "visitors", label: "New visitors", icon: UserPlus },
  { key: "not-attending", label: "Not attending", icon: UserX },
  { key: "tithing", label: "Tithing", icon: HandCoins },
  { key: "whatsapp", label: "Bulk WhatsApp", icon: MessageCircle },
  { key: "map", label: "Map", icon: MapIcon },
  { key: "events", label: "Events", icon: CalendarDays },
  { key: "contacts", label: "Intentional contacts", icon: Footprints },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type Props = {
  churchName: string;
  email: string;
  isAdmin: boolean;
};

function unique(rows: Member[], key: keyof Member): string[] {
  return Array.from(
    new Set(rows.map((r) => String(r[key] ?? "")).filter((v) => v.trim()))
  ).sort();
}

function SidebarSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-md px-2 py-1.5 bg-white"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

// Small sidebar widget showing this month's payment status
function SubscriptionBadge() {
  const supabase = createClient();
  const [paid, setPaid] = useState<boolean | null>(null);

  useEffect(() => {
    const period = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    })();
    supabase.from("payments").select("id").eq("period", period).maybeSingle()
      .then(({ data }) => setPaid(Boolean(data)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (paid === null) return null;

  return (
    <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full border w-fit ${
      paid
        ? "bg-green-50 border-green-200 text-green-700"
        : "bg-amber-50 border-amber-200 text-amber-700"
    }`}>
      {paid ? "✓ This month paid" : "⚠ Payment pending"}
    </div>
  );
}

export default function DashboardShell({ churchName, email, isAdmin }: Props) {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [tithing, setTithing] = useState<Tithing[]>([]);
  const [messagesSent, setMessagesSent] = useState(0);
  const [contacts, setContacts] = useState<IntentionalContact[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [gender, setGender] = useState("");
  const [leader, setLeader] = useState("");
  const [branch, setBranch] = useState("");
  const [employment, setEmployment] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: m }, { data: a }, { data: t }, { count: wCount }, { data: e }, { data: ic }] = await Promise.all([
      supabase.from("members").select("*").order("created_at", { ascending: false }),
      supabase.from("attendance").select("*").order("attendance_date", { ascending: false }),
      supabase.from("tithing").select("*").order("tithe_date", { ascending: false }),
      supabase.from("whatsapp_logs").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*").order("event_date", { ascending: false }),
      supabase.from("intentional_contacts").select("*").order("visit_date", { ascending: false }),
    ]);
    setMembers(m ?? []);
    setAttendance(a ?? []);
    setTithing(t ?? []);
    setMessagesSent(wCount ?? 0);
    setEvents(e ?? []);
    setContacts(ic ?? []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const membersF = useMemo(
    () => members.filter(
      (m) =>
        (!gender || m.gender === gender) &&
        (!leader || m.zone_leader === leader) &&
        (!branch || m.branch === branch) &&
        (!employment || m.employment_status === employment)
    ),
    [members, gender, leader, branch, employment]
  );

  // Set of member_ids that pass the current member-level filters (branch/gender/
  // zone leader/employment) — used to cross-filter attendance records below.
  const membersFIds = useMemo(
    () => new Set(membersF.map((m) => m.member_id).filter(Boolean)),
    [membersF]
  );
  const hasMemberFilter = Boolean(gender || leader || branch || employment);

  const attendanceF = useMemo(
    () => attendance.filter((a) => {
      // Branch/gender/zone leader/employment filters apply by cross-referencing
      // each attendance record's member_id against the filtered member list -
      // attendance rows themselves don't carry branch/gender directly.
      if (hasMemberFilter) {
        if (!a.member_id || !membersFIds.has(a.member_id)) return false;
      }
      if (!startDate && !endDate) return true;
      if (!a.attendance_date) return false;
      if (startDate && a.attendance_date < startDate) return false;
      if (endDate && a.attendance_date > endDate) return false;
      return true;
    }),
    [attendance, membersFIds, hasMemberFilter, startDate, endDate]
  );

  // Same pattern as attendanceF: respects both the member-level filters
  // (branch/gender/zone leader/employment, via membersFIds) and the date
  // range (via tithe_date) - neither was previously applied to tithing.
  const tithingF = useMemo(
    () => tithing.filter((t) => {
      if (hasMemberFilter) {
        if (!t.member_id || !membersFIds.has(t.member_id)) return false;
      }
      if (!startDate && !endDate) return true;
      if (!t.tithe_date) return false;
      if (startDate && t.tithe_date < startDate) return false;
      if (endDate && t.tithe_date > endDate) return false;
      return true;
    }),
    [tithing, membersFIds, hasMemberFilter, startDate, endDate]
  );

  // Members who attended in the filtered date range - used for Overview
  // so that "Last 7 days" shows demographics of recent attendees, not all members
  const membersInPeriod = useMemo(() => {
    if (!startDate && !endDate) return membersF;
    const attendedIds = new Set(attendanceF.map((a) => a.member_id).filter(Boolean));
    return membersF.filter((m) => attendedIds.has(m.member_id));
  }, [membersF, attendanceF, startDate, endDate]);

  const attendedIds = useMemo(
    () => new Set(attendanceF.map((a) => a.member_id).filter(Boolean)),
    [attendanceF]
  );

  const membersNotAttending = useMemo(
    () => membersF.filter((m) => !attendedIds.has(m.member_id)),
    [membersF, attendedIds]
  );

  const newVisitors = useMemo(
    () => attendanceF.filter((a) => ["First Visit", "Second Visit"].includes(a.status)),
    [attendanceF]
  );

  const contactsF = useMemo(
    () => contacts.filter((c) => {
      if (branch && c.branch !== branch) return false;
      if (!startDate && !endDate) return true;
      if (!c.visit_date) return false;
      if (startDate && c.visit_date < startDate) return false;
      if (endDate && c.visit_date > endDate) return false;
      return true;
    }),
    [contacts, branch, startDate, endDate]
  );

  const eventsF = useMemo(
    () => events.filter((e) => {
      if (hasMemberFilter) {
        if (!e.member_id || !membersFIds.has(e.member_id)) return false;
      }
      if (!startDate && !endDate) return true;
      if (!e.event_date) return false;
      if (startDate && e.event_date < startDate) return false;
      if (endDate && e.event_date > endDate) return false;
      return true;
    }),
    [events, membersFIds, hasMemberFilter, startDate, endDate]
  );

  const anyFilterActive = Boolean(gender || leader || branch || employment || startDate || endDate);

  function clearAllFilters() {
    setGender(""); setLeader(""); setBranch(""); setEmployment("");
    setStartDate(""); setEndDate(""); setActivePreset(null);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return <div className="p-8 text-sm text-gray-500">Loading church data...</div>;
  }

  const sidebar = (
    <aside className="flex-shrink-0 w-56 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      {/* Logo area — dark background so white logo text is visible */}
      <div className="bg-teal-800 px-4 py-4">
        <img src="/logo.png" alt="Abundance City Church" className="w-full max-h-12 object-contain object-left" />
      </div>

      <div className="px-4 pt-5 pb-8 flex-1 flex flex-col">
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Filters</h2>

        {/* Date range presets */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Date range</label>
          <div className="flex flex-col gap-1">
            {[
              {
                label: "Last 7 days",
                start: () => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().slice(0,10); },
                hint: () => { const d = new Date(); d.setDate(d.getDate() - 6); return `${d.toLocaleDateString("en-ZA",{day:"numeric",month:"short"})} – today`; },
              },
              {
                label: "Last 30 days",
                start: () => { const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0,10); },
                hint: () => { const d = new Date(); d.setDate(d.getDate() - 29); return `${d.toLocaleDateString("en-ZA",{day:"numeric",month:"short"})} – today`; },
              },
              {
                label: "This month",
                start: () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10); },
                hint: () => { const d = new Date(); return `1 ${d.toLocaleDateString("en-ZA",{month:"short"})} – today`; },
              },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  const s = p.start();
                  const e = new Date().toISOString().slice(0, 10);
                  setStartDate(s); setEndDate(e); setActivePreset(p.label);
                }}
                className={`text-left text-xs rounded px-2 py-1.5 border ${
                  activePreset === p.label
                    ? "bg-teal-600 text-white border-teal-600 font-medium"
                    : "text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span>{p.label}</span>
                <span className={`block text-[10px] mt-0.5 ${activePreset === p.label ? "text-teal-100" : "text-gray-400"}`}>
                  {p.hint()}
                </span>
              </button>
            ))}
          </div>
          {/* Stacked to avoid horizontal overflow in the narrow sidebar */}
          <div className="flex flex-col gap-1 mt-2">
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">From</label>
              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => { setStartDate(e.target.value); setActivePreset(null); }}
                className="w-full text-xs border border-gray-200 rounded px-1.5 py-1"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-0.5">To</label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => { setEndDate(e.target.value); setActivePreset(null); }}
                className="w-full text-xs border border-gray-200 rounded px-1.5 py-1"
              />
            </div>
          </div>
        </div>

        <SidebarSelect label="Gender" value={gender} onChange={setGender} options={unique(members, "gender")} />
        <SidebarSelect label="Zone leader" value={leader} onChange={setLeader} options={unique(members, "zone_leader")} />
        <SidebarSelect label="Employment" value={employment} onChange={setEmployment} options={unique(members, "employment_status")} />

        {anyFilterActive && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-teal-700 underline mt-1"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Nav bottom */}
      <div className="mt-auto pt-6 border-t border-gray-100 space-y-2">
        {isAdmin && (
          <SubscriptionBadge />
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
        <p className="text-[10px] text-gray-400 pt-1 break-all">{email}</p>
      </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <div className="hidden md:block">{sidebar}</div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full overflow-y-auto z-50">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-gray-500 hover:text-gray-900"
              onClick={() => setSidebarOpen(true)}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-medium text-gray-900">{churchName}</h1>
          </div>
          {anyFilterActive && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>

        <div className="px-4 py-5">
          {/* Branch selector — prominent, all-branches view is the default */}
          {unique(members, "branch").length > 0 && (
            <div className="mb-5">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-gray-400 mr-1">Branch:</span>
                <button
                  onClick={() => setBranch("")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    branch === ""
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  All branches
                </button>
                {unique(members, "branch").map((b) => (
                  <button
                    key={b}
                    onClick={() => setBranch(b)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      branch === b
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              {branch && (
                <p className="text-xs text-gray-400 mt-1.5">
                  Showing data for <span className="font-medium text-gray-600">{branch}</span> only.{" "}
                  <button onClick={() => setBranch("")} className="text-teal-700 underline">See all branches</button>
                </p>
              )}
            </div>
          )}

          {/* Per-tab KPIs — change based on active tab */}
          {(() => {
            const DAY = 24 * 60 * 60 * 1000;
            const growth = members.filter(
              (m) => m.registered_at && Date.now() - new Date(m.registered_at).getTime() <= 30 * DAY
            ).length;
            const attendingIds = new Set(attendanceF.map((a) => a.member_id).filter(Boolean));
            const attendingCount = membersF.filter((m) => attendingIds.has(m.member_id)).length;
            const firstTimeVisitors = attendanceF.filter((a) => a.status === "First Visit").length;
            const newVisitorsCount = attendanceF.filter((a) => a.status === "Second Visit").length;
            const firstVisitIds = new Set(
              attendanceF.filter((a) => a.status === "First Visit").map((a) => a.member_id).filter(Boolean)
            );
            const presentIds = new Set(attendanceF.filter((a) => a.status === "Present").map((a) => a.member_id));
            const converted = [...firstVisitIds].filter((id) => presentIds.has(id)).length;
            const convRate = firstVisitIds.size > 0 ? `${Math.round((converted / firstVisitIds.size) * 100)}%` : "—";
            const male = membersF.filter((m) => m.gender === "Male").length;
            const female = membersF.filter((m) => m.gender === "Female").length;
            const uniqueTithers = new Set(tithingF.map((t) => t.member_id).filter(Boolean)).size;
            const tithingPct = membersF.length > 0 ? `${Math.round((uniqueTithers / membersF.length) * 100)}%` : "—";
            const notAttPct = membersF.length > 0 ? `${Math.round((membersNotAttending.length / membersF.length) * 100)}%` : "—";

            const kpis: Record<string, { title: string; value: string | number }[]> = {
              overview: [
                { title: "Total members", value: membersF.length },
                { title: "Attending members", value: attendingCount },
                { title: "Not attending", value: membersNotAttending.length },
                { title: "New visitors", value: newVisitorsCount },
                { title: "First time visitors", value: firstTimeVisitors },
                { title: "Growth (last 30d)", value: `+${growth}` },
                { title: "Visitor → Member", value: convRate },
              ],
              members: [
                { title: "Total members", value: membersF.length },
                { title: "Male", value: male },
                { title: "Female", value: female },
              ],
              growth: [
                { title: "Total members", value: membersF.length },
                { title: "Attendance", value: attendanceF.length },
                { title: "Visitors (returned)", value: newVisitorsCount },
                { title: "Growth (last 30d)", value: `+${growth}` },
              ],
              attendance: [
                { title: "Total members", value: membersF.length },
                { title: "Attendance", value: attendanceF.length },
                { title: "New visitors", value: newVisitorsCount },
                { title: "First time visitors", value: firstTimeVisitors },
              ],
              visitors: [
                { title: "Visitors", value: newVisitorsCount },
                { title: "First time visitors", value: firstTimeVisitors },
              ],
              "not-attending": [
                { title: "Total members", value: membersF.length },
                { title: "Not attending", value: membersNotAttending.length },
                { title: "% Not attending", value: notAttPct },
              ],
              tithing: [
                { title: "Total members", value: membersF.length },
                { title: "Tithing members", value: uniqueTithers },
                { title: "% Tithing", value: tithingPct },
              ],
              whatsapp: [
                { title: "Messages sent", value: messagesSent },
              ],
              map: [
                { title: "Total members", value: membersF.length },
                { title: "Members not assigned", value: membersF.filter((m) => !m.zone_leader?.trim()).length },
              ],
              events: [
                { title: "Events recorded", value: eventsF.length },
                { title: "Messages sent", value: messagesSent },
              ],
              contacts: (() => {
                const total = contactsF.length;
                const dates = contactsF
                  .map((c) => (c.visit_date ? new Date(c.visit_date).getTime() : null))
                  .filter(Boolean) as number[];
                if (total === 0 || dates.length === 0) {
                  return [
                    { title: "Total visits", value: total },
                    { title: "Weekly average", value: 0 },
                    { title: "Monthly average", value: 0 },
                  ];
                }
                const earliest = Math.min(...dates);
                const spanMs = Date.now() - earliest;
                const spanWeeks = Math.max(spanMs / (7 * 24 * 60 * 60 * 1000), 1);
                const spanMonths = Math.max(spanMs / (30.44 * 24 * 60 * 60 * 1000), 1);
                return [
                  { title: "Total visits", value: total },
                  { title: "Weekly average", value: parseFloat((total / spanWeeks).toFixed(1)) },
                  { title: "Monthly average", value: parseFloat((total / spanMonths).toFixed(1)) },
                ];
              })(),
              admin: [],
            };

            const current = kpis[activeTab] ?? kpis.overview;
            if (current.length === 0) return null;

            return (
              <div className={`grid gap-3 mb-6`} style={{ gridTemplateColumns: `repeat(${current.length}, minmax(0, 1fr))` }}>
                {current.map((k) => (
                  <KpiCard key={k.title} title={k.title} value={k.value} />
                ))}
              </div>
            );
          })()}

          {/* Tab navigation */}
          <div className="flex gap-2 overflow-x-auto mb-5 pb-1">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-md text-sm border transition-colors ${
                  activeTab === key
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
            {/* Check-in QR — all logged-in leaders can print QR codes */}
            <button
              onClick={() => setActiveTab("checkin-qr" as TabKey)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-md text-sm border transition-colors ${
                activeTab === ("checkin-qr" as TabKey)
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <QrCode className="w-4 h-4" /> Check-in QR
            </button>
            {/* Settings — all leaders can manage services */}
            <button
              onClick={() => setActiveTab("settings" as TabKey)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-md text-sm border transition-colors ${
                activeTab === ("settings" as TabKey)
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
            {/* Admin — subscription management, admin only */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin" as TabKey)}
                className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-md text-sm border transition-colors ${
                  activeTab === ("admin" as TabKey)
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> Admin
              </button>
            )}
          </div>

          {/* Tab content */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            {activeTab === "overview" && (
              <>
                {(startDate || endDate) && (
                  <p className="text-xs text-gray-400 mb-4">
                    Showing demographics of members who attended in the selected period.
                  </p>
                )}
                <OverviewTab members={membersInPeriod} />
              </>
            )}
            {activeTab === "members" && (
              <MembersTab members={membersF} onDeleted={loadData} />
            )}
            {activeTab === "growth" && <GrowthTab members={membersF} attendance={attendanceF} />}
            {activeTab === "attendance" && (
              <AttendanceTab attendance={attendanceF} />
            )}
            {activeTab === "visitors" && <VisitorsTab visitors={newVisitors} members={members} />}
            {activeTab === "not-attending" && (
              <NotAttendingTab
                members={membersNotAttending}
                allAttendance={attendance}
                totalMembers={membersF.length}
              />
            )}
            {activeTab === "tithing" && (
              <TithingTab tithing={tithingF} members={membersF} />
            )}
            {activeTab === "whatsapp" && <WhatsappTab members={membersF} isAdmin={isAdmin} />}
            {activeTab === "map" && <MapTab members={membersF} onGeocoded={loadData} />}
            {activeTab === "events" && (
              <EventsTab members={membersF} events={eventsF} onAdded={loadData} />
            )}
            {activeTab === "contacts" && (
              <ContactsTab contacts={contactsF} branches={unique(members, "branch")} onAdded={loadData} />
            )}
            {activeTab === ("checkin-qr" as TabKey) && (
              <CheckinQRTab
                branches={unique(members, "branch")}
                baseUrl={typeof window !== "undefined" ? window.location.origin : ""}
              />
            )}
            {activeTab === ("settings" as TabKey) && <SettingsTab />}
            {activeTab === ("admin" as TabKey) && isAdmin && <AdminTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
