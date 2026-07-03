"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Member } from "@/lib/types";

const PALETTE = ["#e63946", "#457b9d", "#2a9d8f", "#e9c46a", "#8e44ad", "#f18f01", "#264653"];

function colorFor(leader: string, leaders: string[]) {
  const idx = leaders.indexOf(leader);
  return PALETTE[idx % PALETTE.length] ?? "#999999";
}

// Creates a Google-Maps-style teardrop pin using an inline SVG as a Leaflet DivIcon.
function makePinIcon(color: string): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path
        d="M12 0C5.373 0 0 5.373 0 12c0 8.284 12 24 12 24S24 20.284 24 12C24 5.373 18.627 0 12 0z"
        fill="${color}"
        stroke="white"
        stroke-width="1.5"
      />
      <circle cx="12" cy="12" r="5" fill="white" opacity="0.85" />
    </svg>`;

  return L.divIcon({
    html: svg,
    iconSize: [24, 36],
    iconAnchor: [12, 36], // tip of the pin sits on the coordinate
    popupAnchor: [0, -36],
    className: "", // clear Leaflet's default white box background
  });
}

export default function LeafletMap({ members }: { members: Member[] }) {
  const leaders = Array.from(new Set(members.map((m) => m.zone_leader).filter(Boolean))).sort();

  // Count members per zone leader
  const leaderCounts = new Map<string, number>();
  for (const m of members) {
    if (!m.zone_leader) continue;
    leaderCounts.set(m.zone_leader, (leaderCounts.get(m.zone_leader) ?? 0) + 1);
  }

  const notAssignedCount = members.filter((m) => !m.zone_leader?.trim()).length;

  const avgLat = members.reduce((s, m) => s + (m.latitude ?? 0), 0) / members.length;
  const avgLng = members.reduce((s, m) => s + (m.longitude ?? 0), 0) / members.length;

  // Pre-build one icon per leader so we don't recreate on every render
  const icons: Record<string, L.DivIcon> = {};
  for (const l of leaders) {
    icons[l] = makePinIcon(colorFor(l, leaders));
  }
  const fallbackIcon = makePinIcon("#999999");

  // Fix Leaflet's broken default icon paths in Next.js (still needed even
  // when using divIcon, since Leaflet tries to load these on initialisation)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
  }, []);

  return (
    <div>
      {/* Legend with member counts */}
      <div className="flex flex-wrap gap-4 mb-3">
        {leaders.map((l) => (
          <span key={l} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: colorFor(l, leaders) }} />
            {l} <span className="text-gray-400">({leaderCounts.get(l) ?? 0})</span>
          </span>
        ))}
        {notAssignedCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="inline-block w-3 h-3 rounded-full bg-gray-300" />
            Not assigned <span className="text-gray-400">({notAssignedCount})</span>
          </span>
        )}
      </div>

      <div className="rounded-md overflow-hidden border border-gray-200" style={{ height: 420 }}>
        <MapContainer
          center={[avgLat, avgLng]}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {members.map((m) => (
            <Marker
              key={m.id}
              position={[m.latitude!, m.longitude!]}
              icon={icons[m.zone_leader] ?? fallbackIcon}
            >
              <Popup>
                <strong>{m.first_name} {m.surname}</strong>
                {m.branch && <><br />{m.branch}</>}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
