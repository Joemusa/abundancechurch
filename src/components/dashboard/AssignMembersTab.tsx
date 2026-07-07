"use client";

import { useState, useMemo } from "react";
import { AlertCircle, CheckCircle2, Search, Plus } from "lucide-react";
import type {
  Member, Ministry, ServiceDepartment, MemberMinistry, MemberServiceDepartment,
} from "@/lib/types";

type Props = {
  pendingMembers: Member[];
  allMembers: Member[];
  ministries: Ministry[];
  serviceDepartments: ServiceDepartment[];
  memberMinistries: MemberMinistry[];
  memberServiceDepartments: MemberServiceDepartment[];
  pastorOptions: string[];
  zoneLeaderOptions: string[];
  onChanged: () => void;
};

function MissingBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
      <AlertCircle className="w-2.5 h-2.5" /> {label}
    </span>
  );
}

export default function AssignMembersTab({
  pendingMembers,
  allMembers,
  ministries,
  serviceDepartments,
  memberMinistries,
  memberServiceDepartments,
  pastorOptions,
  zoneLeaderOptions,
  onChanged,
}: Props) {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [pastor, setPastor] = useState("");
  const [zoneLeader, setZoneLeader] = useState("");
  const [ministryIds, setMinistryIds] = useState<Set<string>>(new Set());
  const [departmentIds, setDepartmentIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [newMinistryName, setNewMinistryName] = useState("");
  const [newMinistryLeader, setNewMinistryLeader] = useState("");
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptLeader, setNewDeptLeader] = useState("");
  const [addingMinistry, setAddingMinistry] = useState(false);
  const [addingDept, setAddingDept] = useState(false);

  const listSource = showAll ? allMembers : pendingMembers;
  const filtered = useMemo(
    () =>
      listSource.filter((m) =>
        `${m.first_name} ${m.surname} ${m.branch}`.toLowerCase().includes(search.toLowerCase())
      ),
    [listSource, search]
  );

  const selected = allMembers.find((m) => m.id === selectedId) ?? null;

  function missingPieces(m: Member): string[] {
    const missing: string[] = [];
    if (!m.pastor?.trim()) missing.push("Pastor");
    if (!m.zone_leader?.trim()) missing.push("Zonal Leader");
    if (!m.member_id || !memberMinistries.some((mm) => mm.member_id === m.member_id)) {
      missing.push("Ministry");
    }
    if (!m.member_id || !memberServiceDepartments.some((md) => md.member_id === m.member_id)) {
      missing.push("Department");
    }
    return missing;
  }

  function openMember(m: Member) {
    setSelectedId(m.id);
    setPastor(m.pastor ?? "");
    setZoneLeader(m.zone_leader ?? "");
    setMinistryIds(
      new Set(
        memberMinistries.filter((mm) => mm.member_id === m.member_id).map((mm) => mm.ministry_id)
      )
    );
    setDepartmentIds(
      new Set(
        memberServiceDepartments
          .filter((md) => md.member_id === m.member_id)
          .map((md) => md.service_department_id)
      )
    );
    setMsg(null);
  }

  function toggleMinistry(id: string) {
    setMinistryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleDept(id: string) {
    setDepartmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/members/${selected.id}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pastor,
        zoneLeader,
        ministryIds: Array.from(ministryIds),
        departmentIds: Array.from(departmentIds),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) {
      setMsg(data.error);
      return;
    }
    setMsg("Saved.");
    onChanged();
  }

  async function handleAddMinistry(e: React.FormEvent) {
    e.preventDefault();
    if (!newMinistryName.trim()) return;
    setAddingMinistry(true);
    const res = await fetch("/api/ministries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newMinistryName.trim(), leader: newMinistryLeader.trim() }),
    });
    const data = await res.json();
    setAddingMinistry(false);
    if (!data.error) {
      setNewMinistryName("");
      setNewMinistryLeader("");
      onChanged();
    }
  }

  async function handleAddDept(e: React.FormEvent) {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setAddingDept(true);
    const res = await fetch("/api/service-departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDeptName.trim(), leader: newDeptLeader.trim() }),
    });
    const data = await res.json();
    setAddingDept(false);
    if (!data.error) {
      setNewDeptName("");
      setNewDeptLeader("");
      onChanged();
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: member list */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-3">
          <h2 className="text-base font-medium text-gray-900">
            {showAll ? "All members" : "Pending assignment"}
          </h2>
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs text-teal-700 hover:underline whitespace-nowrap"
          >
            {showAll ? "Show pending only" : "Show all members"}
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or branch..."
            className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2 max-h-[520px] overflow-y-auto">
          {filtered.map((m) => {
            const missing = missingPieces(m);
            return (
              <button
                key={m.id}
                onClick={() => openMember(m)}
                className={`w-full text-left border rounded-md px-3 py-2.5 transition-colors ${
                  selectedId === m.id
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-800">
                    {m.first_name} {m.surname}
                  </span>
                  {missing.length === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  ) : null}
                </div>
                <p className="text-xs text-gray-400 mb-1.5">{m.branch || "No branch"}</p>
                {missing.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {missing.map((label) => (
                      <MissingBadge key={label} label={label} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 py-8 text-center">
              {showAll ? "No members match your search." : "Nobody is pending assignment 🎉"}
            </p>
          )}
        </div>
      </div>

      {/* Right: assignment form */}
      <div>
        {!selected ? (
          <div className="border border-dashed border-gray-300 rounded-lg h-full min-h-[300px] flex items-center justify-center text-sm text-gray-400 px-6 text-center">
            Select a member from the list to assign their Pastor, Zonal Leader, Ministries, and
            Service Departments.
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-base font-medium text-gray-900 mb-1">
              {selected.first_name} {selected.surname}
            </h3>
            <p className="text-xs text-gray-400 mb-4">{selected.branch || "No branch"}</p>

            <label className="block text-xs font-medium text-gray-600 mb-1">Pastor</label>
            <input
              value={pastor}
              onChange={(e) => setPastor(e.target.value)}
              list="pastor-options"
              placeholder="e.g. Pastor Sipho Dlamini"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3"
            />
            <datalist id="pastor-options">
              {pastorOptions.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>

            <label className="block text-xs font-medium text-gray-600 mb-1">Zonal Leader</label>
            <input
              value={zoneLeader}
              onChange={(e) => setZoneLeader(e.target.value)}
              list="zone-leader-options"
              placeholder="e.g. Elder Peter Nkosi"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-4"
            />
            <datalist id="zone-leader-options">
              {zoneLeaderOptions.map((z) => (
                <option key={z} value={z} />
              ))}
            </datalist>

            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Ministries (select all that apply)
            </label>
            <div className="border border-gray-200 rounded-md p-2 mb-1 max-h-36 overflow-y-auto space-y-1">
              {ministries.map((min) => (
                <label key={min.id} className="flex items-center gap-2 text-sm px-1.5 py-1 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={ministryIds.has(min.id)}
                    onChange={() => toggleMinistry(min.id)}
                  />
                  <span>
                    {min.name}
                    {min.leader && <span className="text-gray-400"> — {min.leader}</span>}
                  </span>
                </label>
              ))}
              {ministries.length === 0 && (
                <p className="text-xs text-gray-400 px-1.5 py-1">No ministries added yet.</p>
              )}
            </div>
            <form onSubmit={handleAddMinistry} className="flex gap-1.5 mb-4">
              <input
                value={newMinistryName}
                onChange={(e) => setNewMinistryName(e.target.value)}
                placeholder="New ministry name"
                className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-xs"
              />
              <input
                value={newMinistryLeader}
                onChange={(e) => setNewMinistryLeader(e.target.value)}
                placeholder="Leader (optional)"
                className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-xs"
              />
              <button
                type="submit"
                disabled={addingMinistry || !newMinistryName.trim()}
                className="text-teal-700 border border-teal-200 rounded-md px-2 disabled:opacity-40"
                title="Add ministry"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>

            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Service Departments (select all that apply)
            </label>
            <div className="border border-gray-200 rounded-md p-2 mb-1 max-h-36 overflow-y-auto space-y-1">
              {serviceDepartments.map((dept) => (
                <label key={dept.id} className="flex items-center gap-2 text-sm px-1.5 py-1 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={departmentIds.has(dept.id)}
                    onChange={() => toggleDept(dept.id)}
                  />
                  <span>
                    {dept.name}
                    {dept.leader && <span className="text-gray-400"> — {dept.leader}</span>}
                  </span>
                </label>
              ))}
              {serviceDepartments.length === 0 && (
                <p className="text-xs text-gray-400 px-1.5 py-1">No service departments added yet.</p>
              )}
            </div>
            <form onSubmit={handleAddDept} className="flex gap-1.5 mb-5">
              <input
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="New department name"
                className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-xs"
              />
              <input
                value={newDeptLeader}
                onChange={(e) => setNewDeptLeader(e.target.value)}
                placeholder="Leader (optional)"
                className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-xs"
              />
              <button
                type="submit"
                disabled={addingDept || !newDeptName.trim()}
                className="text-teal-700 border border-teal-200 rounded-md px-2 disabled:opacity-40"
                title="Add department"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>

            {msg && (
              <p className={`text-sm mb-3 ${msg === "Saved." ? "text-green-600" : "text-red-600"}`}>
                {msg}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-teal-700 text-white rounded-md py-2.5 text-sm font-medium hover:bg-teal-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save assignment"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
