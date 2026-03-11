"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

interface Tour {
  id: string;
  name: string;
  city: string;
  duration: string;
  price: number;
}

interface Booking {
  id: string;
  reservationId: string;
  customerName: string;
  date: string;
  time: string;
  channel: string;
  totalPrice: number;
  status: string;
  tour: Tour | null;
}

interface GuideDetail {
  id: string;
  name: string;
  email: string;
  city: string;
  priority: number;
  languages: string[];
  active: boolean;
  calendarId: string | null;
  tourDetails: Tour[];
  bookingCount: number;
  totalRevenue: number;
  upcoming: Booking[];
}

const CITY_EMOJI: Record<string, string> = {
  SYDNEY:     "🌉",
  MELBOURNE:  "☕",
  GOLD_COAST: "🏄",
};

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED:   "bg-green-100 text-green-700",
  PENDING:     "bg-yellow-100 text-yellow-700",
  RESCHEDULED: "bg-blue-100 text-blue-700",
  CANCELLED:   "bg-red-100 text-red-700",
  COMPLETED:   "bg-slate-100 text-slate-600",
};

const CHANNEL_COLORS: Record<string, string> = {
  AIRBNB: "bg-rose-50 text-rose-700",
  VIATOR: "bg-blue-50 text-blue-700",
  WEB:    "bg-emerald-50 text-emerald-700",
  EMAIL:  "bg-amber-50 text-amber-700",
};

export default function GuideProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [guide, setGuide] = useState<GuideDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/guides/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => { setGuide(d); setLoading(false); })
      .catch(() => { toast("Guide not found", "error"); router.push("/guides"); });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">👤</div>
          <div>Loading guide profile...</div>
        </div>
      </div>
    );
  }

  if (!guide) return null;

  const initials = guide.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Back */}
      <Link href="/guides" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 transition-colors">
        ← Back to Guides
      </Link>

      {/* Header card */}
      <div className="bg-gradient-to-br from-sky-600 to-sky-800 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{guide.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${guide.active ? "bg-emerald-400/30 text-emerald-100" : "bg-red-400/30 text-red-100"}`}>
                {guide.active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="text-sky-200 text-sm mt-1">{guide.email}</div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                {CITY_EMOJI[guide.city]} {guide.city.replace("_", " ")}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                ⭐ Priority #{guide.priority}
              </span>
              {guide.languages.map((l) => (
                <span key={l} className="bg-white/20 px-3 py-1 rounded-lg text-sm">🗣️ {l}</span>
              ))}
            </div>
          </div>
          {/* Stats */}
          <div className="hidden md:flex gap-4 text-center shrink-0">
            <div className="bg-white/10 rounded-xl px-5 py-3">
              <div className="text-2xl font-bold">{guide.bookingCount}</div>
              <div className="text-xs text-sky-200 mt-0.5">Total bookings</div>
            </div>
            <div className="bg-white/10 rounded-xl px-5 py-3">
              <div className="text-2xl font-bold">${guide.totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-sky-200 mt-0.5">Total revenue</div>
            </div>
          </div>
        </div>
        {/* Mobile stats */}
        <div className="flex gap-3 mt-4 md:hidden">
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center flex-1">
            <div className="text-xl font-bold">{guide.bookingCount}</div>
            <div className="text-xs text-sky-200">Bookings</div>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-2 text-center flex-1">
            <div className="text-xl font-bold">${guide.totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-sky-200">Revenue</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Tours habilitados */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-700 mb-3 text-sm">Enabled Tours</h2>
          {guide.tourDetails.length === 0 ? (
            <p className="text-slate-400 text-sm">No tours assigned</p>
          ) : (
            <div className="space-y-2">
              {guide.tourDetails.map((t) => (
                <div key={t.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-slate-700">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.duration}</div>
                  </div>
                  <span className="text-sky-600 font-bold text-sm">${t.price}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Google Calendar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-semibold text-slate-700 mb-3 text-sm">📆 Google Calendar</h2>
          {guide.calendarId ? (
            <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 font-mono break-all">
              {guide.calendarId}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-sm text-slate-400">No calendar connected</div>
              <button
                onClick={() => toast("Calendar integration coming soon!", "info")}
                className="mt-3 text-xs text-sky-600 hover:text-sky-700 underline"
              >
                + Connect Google Calendar
              </button>
            </div>
          )}
        </div>

        {/* Info extra */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-slate-700 mb-3 text-sm">Details</h2>
          <Row label="City"      value={`${CITY_EMOJI[guide.city]} ${guide.city.replace("_", " ")}`} />
          <Row label="Priority"  value={`#${guide.priority}`} />
          <Row label="Languages" value={guide.languages.join(", ")} />
          <Row label="Status"    value={guide.active ? "✅ Active" : "❌ Inactive"} />
          <Row label="Tours"     value={String(guide.tourDetails.length)} />
        </div>

      </div>

      {/* Upcoming bookings */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-700 mb-4">Upcoming Bookings</h2>
        {guide.upcoming.length === 0 ? (
          <p className="text-slate-400 text-sm">No upcoming bookings</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-100">
                  <th className="text-left py-2 pr-4">Date & Time</th>
                  <th className="text-left py-2 pr-4">Customer</th>
                  <th className="text-left py-2 pr-4">Tour</th>
                  <th className="text-left py-2 pr-4">Channel</th>
                  <th className="text-left py-2 pr-4">Price</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {guide.upcoming.map((b) => (
                  <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 pr-4 text-slate-600">
                      {new Date(b.date).toLocaleDateString("en-AU")} {b.time}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-slate-800">{b.customerName}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{b.tour?.name ?? "—"}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${CHANNEL_COLORS[b.channel] ?? "bg-slate-100 text-slate-600"}`}>
                        {b.channel}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-semibold text-sky-700">${b.totalPrice}</td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[b.status] ?? ""}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-50 py-1.5">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs font-medium text-slate-700">{value}</span>
    </div>
  );
}
