"use client";

type Props = {
  startDate: string;
  endDate: string;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;
};

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

const TODAY = new Date().toISOString().slice(0, 10);

const PRESETS = [
  { label: "Last 7 days", start: () => isoDaysAgo(6), end: () => TODAY },
  { label: "Last 30 days", start: () => isoDaysAgo(29), end: () => TODAY },
  { label: "This month", start: () => startOfMonth(), end: () => TODAY },
];

export default function DateRangeFilter({ startDate, endDate, setStartDate, setEndDate }: Props) {
  const active = Boolean(startDate || endDate);

  function applyPreset(start: string, end: string) {
    setStartDate(start);
    setEndDate(end);
  }

  function clear() {
    setStartDate("");
    setEndDate("");
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5"
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.start(), p.end())}
              className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5 text-gray-600 hover:bg-gray-50"
            >
              {p.label}
            </button>
          ))}
          {active && (
            <button
              onClick={clear}
              className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5 text-teal-700 hover:bg-teal-50"
            >
              Clear (all time)
            </button>
          )}
        </div>
      </div>

      {active && (
        <p className="text-xs text-gray-400 mt-2">
          Filtering attendance, growth, new visitors and not-attending by this date range.
        </p>
      )}
    </div>
  );
}
