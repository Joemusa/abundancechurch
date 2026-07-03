"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { Member } from "@/lib/types";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

export default function MapTab({
  members,
  onGeocoded,
}: {
  members: Member[];
  onGeocoded: () => void;
}) {
  const [geocoding, setGeocoding] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const missing = members.filter(
    (m) => m.address?.trim() && (m.latitude === null || m.latitude === undefined)
  );
  const located = members.filter(
    (m) => m.latitude !== null && m.latitude !== undefined && m.longitude !== null
  );

  async function handleGeocode() {
    setGeocoding(true);
    setResult(null);
    const res = await fetch("/api/geocode", { method: "POST" });
    const data = await res.json();
    setGeocoding(false);

    if (data.error) {
      setResult(`Error: ${data.error}`);
      return;
    }

    setResult(
      `Geocoded ${data.updated} address(es).` +
        (data.failures?.length ? ` Could not geocode: ${data.failures.slice(0, 5).join(", ")}` : "")
    );
    onGeocoded();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">
          {missing.length} member(s) with an address but no coordinates yet
        </p>
        <button
          onClick={handleGeocode}
          disabled={geocoding}
          className="text-sm border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50"
        >
          {geocoding ? "Geocoding..." : "Geocode missing addresses"}
        </button>
      </div>

      {result && <p className="text-sm text-gray-600 mb-3">{result}</p>}

      {located.length ? (
        <LeafletMap members={located} />
      ) : (
        <p className="text-sm text-gray-400">
          No members have coordinates yet. Click &quot;Geocode missing addresses&quot; above.
        </p>
      )}
    </div>
  );
}
