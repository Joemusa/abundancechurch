"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import KpiCard from "./KpiCard";
import { CheckCircle2, XCircle, Trash2 } from "lucide-react";

type Payment = {
  id: string;
  period: string; // "YYYY-MM"
  amount: number;
  date_received: string;
  notes: string;
  created_at: string;
};

function periodLabel(period: string): string {
  const [year, month] = period.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
}

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminTab() {
  const supabase = createClient();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [period, setPeriod] = useState(currentPeriod());
  const [amount, setAmount] = useState("299.00");
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("payments")
      .select("*")
      .order("period", { ascending: false });
    setPayments(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const thisMonth = currentPeriod();
  const thisMonthPaid = payments.find((p) => p.period === thisMonth);
  const paidMonths = payments.length;
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period, amount: parseFloat(amount), date_received: dateReceived, notes }),
    });
    const data = await res.json();
    setSaving(false);

    if (data.error) {
      setMsg({ text: data.error, ok: false });
    } else {
      setMsg({ text: `Payment for ${periodLabel(period)} logged.`, ok: true });
      setNotes("");
      loadPayments();
    }
  }

  async function handleDelete(p: Payment) {
    if (!confirm(`Remove payment for ${periodLabel(p.period)}?`)) return;
    const res = await fetch("/api/payments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period: p.period }),
    });
    const data = await res.json();
    if (data.error) {
      setMsg({ text: data.error, ok: false });
    } else {
      loadPayments();
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-base font-medium text-gray-900 mb-1">Subscription management</h2>
      <p className="text-sm text-gray-500 mb-6">
        Manually record each month&apos;s subscription payment after you confirm it in your bank account.
      </p>

      {/* Status banner */}
      <div className={`flex items-center gap-3 rounded-xl px-5 py-4 mb-6 border ${
        thisMonthPaid
          ? "bg-green-50 border-green-200"
          : "bg-amber-50 border-amber-200"
      }`}>
        {thisMonthPaid ? (
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        )}
        <div>
          <p className={`text-sm font-medium ${thisMonthPaid ? "text-green-800" : "text-amber-800"}`}>
            {periodLabel(thisMonth)} — {thisMonthPaid ? "Paid" : "Not yet recorded"}
          </p>
          {thisMonthPaid && (
            <p className="text-xs text-green-600 mt-0.5">
              R{Number(thisMonthPaid.amount).toFixed(2)} received on {thisMonthPaid.date_received}
              {thisMonthPaid.notes && ` · ${thisMonthPaid.notes}`}
            </p>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <KpiCard title="Months paid" value={paidMonths} />
        <KpiCard title="Total collected" value={`R${totalPaid.toFixed(2)}`} />
        <KpiCard title="This month" value={thisMonthPaid ? "Paid ✓" : "Unpaid"} />
      </div>

      {/* Log payment form */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Log a payment</h3>
        <form onSubmit={handleLog} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Month (YYYY-MM)</label>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Amount (R)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Date received</label>
            <input
              type="date"
              value={dateReceived}
              onChange={(e) => setDateReceived(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Notes (optional — e.g. bank reference)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. EFT ref #12345"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          {msg && (
            <p className={`text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-teal-700 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Log payment"}
          </button>
        </form>
      </div>

      {/* Payment history */}
      <h3 className="text-sm font-medium text-gray-900 mb-3">Payment history</h3>
      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : payments.length === 0 ? (
        <p className="text-sm text-gray-400">No payments recorded yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-4">Month</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2 pr-4">Date received</th>
              <th className="py-2 pr-4">Notes</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-4 font-medium">{periodLabel(p.period)}</td>
                <td className="py-2 pr-4">R{Number(p.amount).toFixed(2)}</td>
                <td className="py-2 pr-4">{p.date_received}</td>
                <td className="py-2 pr-4 text-gray-400">{p.notes}</td>
                <td className="py-2">
                  <button
                    onClick={() => handleDelete(p)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    title="Remove this payment record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Invite leaders */}
      <InviteLeaders />
    </div>
  );
}

function InviteLeaders() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMsg(null);
    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setSending(false);
    if (data.error) {
      setMsg({ text: data.error, ok: false });
    } else {
      setMsg({ text: `Invite sent to ${email}. They will receive an email to set their password.`, ok: true });
      setEmail("");
    }
  }

  return (
    <div className="mt-10 pt-8 border-t border-gray-100">
      <h2 className="text-base font-medium text-gray-900 mb-1">Invite a leader</h2>
      <p className="text-sm text-gray-500 mb-5">
        Enter their email address and they will receive an invite link to set their
        own password and access the dashboard. The link expires after 24 hours.
      </p>
      <form onSubmit={handleInvite} className="flex gap-2 max-w-sm">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="leader@example.com"
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={sending || !email.trim()}
          className="bg-teal-700 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-800 disabled:opacity-50 whitespace-nowrap"
        >
          {sending ? "Sending..." : "Send invite"}
        </button>
      </form>
      {msg && (
        <p className={"text-sm mt-3 " + (msg.ok ? "text-teal-700" : "text-red-600")}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
