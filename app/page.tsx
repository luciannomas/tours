"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
  totalTours: number;
  totalRevenue: number;
  topGuide: { name: string; count: number } | null;
  channelBreakdown: { channel: string; percent: number }[];
}

const CITY_TOURS = [
  {
    city: "🌉 Sydney",
    color: "from-sky-500 to-sky-700",
    tours: [
      { name: "Sydney Icons Drive", duration: "1h", price: "$180" },
      { name: "Sydney Sunset Harbour Tour", duration: "1h30", price: "$320" },
      { name: "Grand Sydney Discovery", duration: "3h", price: "$420" },
    ],
  },
  {
    city: "☕ Melbourne",
    color: "from-violet-500 to-violet-700",
    tours: [
      { name: "Melbourne Cultural Highlights", duration: "2h", price: "$290" },
    ],
  },
  {
    city: "🏄 Gold Coast",
    color: "from-amber-500 to-amber-600",
    tours: [
      { name: "Coastal Scenic Experience", duration: "3h", price: "$480" },
    ],
  },
];

const FEATURES = [
  { icon: "🤖", title: "AI Agent", desc: "Auto-replies to FAQs, reschedules and cancellations via chat" },
  { icon: "📡", title: "Multi-channel", desc: "Bookings from Airbnb, Viator, Web & Email in one place" },
  { icon: "📆", title: "Smart Assignment", desc: "Guides auto-assigned by priority, city and availability" },
  { icon: "🔔", title: "Auto Reminders", desc: "Day-of and post-tour messages sent automatically" },
  { icon: "📊", title: "Live Dashboard", desc: "Monthly revenue, channel breakdown and guide performance" },
  { icon: "📋", title: "Google Sheets Sync", desc: "Master sheet + per-guide sheet updated in real time" },
];

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const now = new Date();

  useEffect(() => {
    fetch(`/api/dashboard?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => null);
  }, []);

  return (
    <div className="space-y-8">

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-sky-600 to-sky-900 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[120px] opacity-10 pointer-events-none select-none">🚙</div>
        <div className="relative z-10">
          <div className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full w-fit mb-3 tracking-wide">
            AI-Powered Management System · Australia
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight">
            Southern Cross<br />Adventure Tours
          </h1>
          <p className="text-sky-200 max-w-md mb-6 text-sm">
            Automated bookings, AI guide assignment and multi-channel messaging — all in one demo platform.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard"
              className="bg-white text-sky-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-sky-50 transition-colors text-sm shadow">
              📊 Dashboard
            </Link>
            <Link href="/bookings"
              className="bg-white/10 border border-white/30 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-white/20 transition-colors text-sm">
              📅 Bookings
            </Link>
            <Link href="/guides"
              className="bg-white/10 border border-white/30 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-white/20 transition-colors text-sm">
              👤 Guides
            </Link>
          </div>
        </div>
      </div>

      {/* Live KPIs */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Tours this month", value: String(stats.totalTours), icon: "🗺️", color: "text-sky-600" },
            { label: "Revenue (AUD)", value: `$${stats.totalRevenue.toLocaleString()}`, icon: "💰", color: "text-emerald-600" },
            { label: "Top guide", value: stats.topGuide?.name.split(" ")[0] ?? "—", icon: "🏆", color: "text-amber-600", sub: stats.topGuide ? `${stats.topGuide.count} tours` : "" },
            { label: "Active channels", value: String(stats.channelBreakdown.length), icon: "📡", color: "text-violet-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:shadow-sm transition-shadow">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              {"sub" in s && s.sub && <div className="text-xs text-slate-400">{s.sub}</div>}
              <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Features */}
      <div>
        <h2 className="text-base font-bold text-slate-700 mb-3">Platform Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3 items-start hover:shadow-sm transition-shadow">
              <span className="text-2xl shrink-0">{f.icon}</span>
              <div>
                <div className="font-semibold text-slate-700 text-sm">{f.title}</div>
                <div className="text-xs text-slate-400 mt-0.5 leading-snug">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tours by city */}
      <div>
        <h2 className="text-base font-bold text-slate-700 mb-3">Available Tours</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CITY_TOURS.map((c) => (
            <div key={c.city} className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
              <div className={`bg-gradient-to-r ${c.color} px-4 py-3 text-white font-semibold text-sm`}>
                {c.city}
              </div>
              <div className="p-4 space-y-2">
                {c.tours.map((t) => (
                  <div key={t.name} className="flex justify-between items-center text-sm py-1.5 border-b border-slate-50 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium text-slate-700 text-xs">{t.name}</div>
                      <div className="text-xs text-slate-400">{t.duration}</div>
                    </div>
                    <span className="text-sky-600 font-bold text-sm">{t.price}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking channels */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="font-semibold text-slate-700 mb-3 text-sm">Booking Channels (Simulated)</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { name: "Airbnb Host API", color: "bg-rose-50 border-rose-200 text-rose-700", icon: "🏠" },
            { name: "Viator Partner API", color: "bg-blue-50 border-blue-200 text-blue-700", icon: "🧭" },
            { name: "Web – WordPress", color: "bg-emerald-50 border-emerald-200 text-emerald-700", icon: "🌐" },
            { name: "Email – Gmail IMAP", color: "bg-amber-50 border-amber-200 text-amber-700", icon: "📧" },
          ].map((ch) => (
            <div key={ch.name} className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-xs font-medium ${ch.color}`}>
              <span>{ch.icon}</span> {ch.name}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
