"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ToastProvider";

interface Booking {
  id: string;
  reservationId: string;
  customerName: string;
  customerEmail: string;
  channel: string;
  city: string;
  date: string;
  time: string;
  passengers: number;
  totalPrice: number;
  status: string;
  tour: { name: string };
  guide: { name: string } | null;
  extras: { extra: { name: string; price: number } }[];
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED:   "bg-green-100 text-green-700",
  PENDING:     "bg-yellow-100 text-yellow-700",
  RESCHEDULED: "bg-blue-100 text-blue-700",
  CANCELLED:   "bg-red-100 text-red-700",
  COMPLETED:   "bg-slate-100 text-slate-600",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState({ status: "", city: "", channel: "" });
  const [selected, setSelected] = useState<Booking | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams();
    if (filter.status)  params.set("status",  filter.status);
    if (filter.city)    params.set("city",     filter.city);
    if (filter.channel) params.set("channel",  filter.channel);

    setLoading(true);
    fetch(`/api/bookings?${params}`)
      .then((r) => r.json())
      .then((d) => { setBookings(d); setLoading(false); });
  }, [filter]);

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this booking?")) return;
    await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "CANCELLED" } : b));
    if (selected?.id === id) setSelected(null);
    toast("Booking cancelled successfully", "success");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">📅 Bookings</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={filter.status} onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          {["PENDING","CONFIRMED","RESCHEDULED","CANCELLED","COMPLETED"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={filter.city} onChange={(e) => setFilter((f) => ({ ...f, city: e.target.value }))}>
          <option value="">All cities</option>
          {["SYDNEY","MELBOURNE","GOLD_COAST"].map((c) => (
            <option key={c} value={c}>{c.replace("_", " ")}</option>
          ))}
        </select>
        <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
          value={filter.channel} onChange={(e) => setFilter((f) => ({ ...f, channel: e.target.value }))}>
          <option value="">All channels</option>
          {["AIRBNB","VIATOR","WEB","EMAIL"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading && <div className="text-slate-400 py-10 text-center">Loading...</div>}

      {!loading && (
        <div className="flex gap-4">
          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm bg-white border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  {["Ref","Customer","Tour","Date","Guide","Channel","Price","Status",""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}
                    className={`border-t border-slate-100 hover:bg-slate-50 cursor-pointer ${selected?.id === b.id ? "bg-sky-50" : ""}`}
                    onClick={() => setSelected(b)}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{b.reservationId}</td>
                    <td className="px-4 py-3 font-medium">{b.customerName}</td>
                    <td className="px-4 py-3 text-slate-600">{b.tour.name}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(b.date).toLocaleDateString("en-AU")} {b.time}</td>
                    <td className="px-4 py-3 text-slate-500">{b.guide?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded">{b.channel}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-sky-700">${b.totalPrice}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] ?? ""}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {b.status !== "CANCELLED" && (
                        <button
                          className="text-red-400 hover:text-red-600 text-xs"
                          onClick={(e) => { e.stopPropagation(); handleCancel(b.id); }}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-10 text-slate-400">No bookings found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="w-72 bg-white border border-slate-200 rounded-xl p-4 shrink-0 text-sm">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-slate-700">Booking Detail</h3>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="space-y-2 text-slate-600">
                <Row label="Ref"       value={selected.reservationId} />
                <Row label="Customer"  value={selected.customerName} />
                <Row label="Email"     value={selected.customerEmail} />
                <Row label="Tour"      value={selected.tour.name} />
                <Row label="City"      value={selected.city} />
                <Row label="Date"      value={`${new Date(selected.date).toLocaleDateString("en-AU")} ${selected.time}`} />
                <Row label="Passengers" value={String(selected.passengers)} />
                <Row label="Guide"     value={selected.guide?.name ?? "Unassigned"} />
                <Row label="Channel"   value={selected.channel} />
                <Row label="Price"     value={`$${selected.totalPrice} AUD`} />
                <Row label="Status"    value={selected.status} />
                {selected.extras.length > 0 && (
                  <div>
                    <span className="font-medium text-slate-500">Extras:</span>
                    <ul className="ml-3 mt-1">
                      {selected.extras.map((e) => (
                        <li key={e.extra.name} className="text-xs text-slate-500">• {e.extra.name} (+${e.extra.price})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-50 py-1">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className="text-slate-700 text-xs font-medium text-right max-w-[160px] truncate">{value}</span>
    </div>
  );
}
