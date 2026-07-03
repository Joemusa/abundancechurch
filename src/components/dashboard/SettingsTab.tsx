"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";

type Service = { id: string; name: string };

export default function SettingsTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    const res = await fetch("/api/services");
    const data = await res.json();
    setServices(data.services ?? []);
  }, []);

  useEffect(() => { loadServices(); }, [loadServices]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newService.trim()) return;
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newService.trim() }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) {
      setMsg(data.error.includes("unique") ? "That service already exists." : data.error);
    } else {
      setNewService("");
      loadServices();
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove "${name}" from the services list?`)) return;
    await fetch("/api/services", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadServices();
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-base font-medium text-gray-900 mb-1">Check-in services</h2>
      <p className="text-sm text-gray-500 mb-6">
        These are the services members can select when they scan the check-in QR code.
        Add or remove as your schedule changes — takes effect immediately, no redeployment needed.
      </p>

      {/* Add service form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-2">
        <input
          value={newService}
          onChange={(e) => setNewService(e.target.value)}
          placeholder="e.g. Friday Prayer Night"
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={saving || !newService.trim()}
          className="bg-teal-700 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-800 disabled:opacity-50 whitespace-nowrap"
        >
          {saving ? "Adding..." : "+ Add"}
        </button>
      </form>
      {msg && <p className="text-sm text-red-600 mb-3">{msg}</p>}

      {/* Services list */}
      <div className="space-y-2 mt-4">
        {services.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between border border-gray-200 rounded-md px-4 py-2.5"
          >
            <span className="text-sm text-gray-700">{s.name}</span>
            <button
              onClick={() => handleDelete(s.id, s.name)}
              className="text-gray-300 hover:text-red-500 transition-colors ml-3 flex-shrink-0"
              title="Remove service"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {services.length === 0 && (
          <p className="text-sm text-gray-400 py-4 text-center">
            No services yet — add one above.
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-6">
        {services.length} service{services.length !== 1 ? "s" : ""} configured
      </p>
    </div>
  );
}
