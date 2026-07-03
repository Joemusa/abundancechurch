import type { Member } from "@/lib/types";

type Props = {
  members: Member[];
  gender: string;
  setGender: (v: string) => void;
  leader: string;
  setLeader: (v: string) => void;
  branch: string;
  setBranch: (v: string) => void;
  employment: string;
  setEmployment: (v: string) => void;
};

function unique(rows: Member[], key: keyof Member): string[] {
  return Array.from(
    new Set(rows.map((r) => String(r[key] ?? "")).filter((v) => v.trim()))
  ).sort();
}

export default function FilterBar({
  members,
  gender,
  setGender,
  leader,
  setLeader,
  branch,
  setBranch,
  employment,
  setEmployment,
}: Props) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <Select label="Gender" value={gender} onChange={setGender} options={unique(members, "gender")} />
      <Select
        label="Zone leader"
        value={leader}
        onChange={setLeader}
        options={unique(members, "zone_leader")}
      />
      <Select label="Branch" value={branch} onChange={setBranch} options={unique(members, "branch")} />
      <Select
        label="Employment"
        value={employment}
        onChange={setEmployment}
        options={unique(members, "employment_status")}
      />
    </div>
  );
}

function Select({
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
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
