"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  period: { month: number; year: number };
  totalTours: number;
  totalRevenue: number;
  channelBreakdown: { channel: string; revenue: number; percent: number }[];
  extrasSold: Record<string, number>;
  topGuide: { name: string; count: number } | null;
  byCity: Record<string, number>;
}

const CHANNEL_COLORS: Record<string, string> = {
  AIRBNB: "bg-rose-400",
  VIATOR: "bg-blue-400",
  WEB:    "bg-emerald-400",
  EMAIL:  "bg-amber-400",
};

const CHANNEL_BADGE: Record<string, string> = {
  AIRBNB: "bg-rose-50 text-rose-700 border-rose-200",
  VIATOR: "bg-blue-50 text-blue-700 border-blue-200",
  WEB:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  EMAIL:  "bg-amber-50 text-amber-700 border-amber-200",
};

const CITY_EMOJI: Record<string, string> = {
  SYDNEY:     "🌉",
  MELBOURNE:  "☕",
  GOLD_COAST: "🏄",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getSimulatedRevenue(): number[] {
  return [5800,6200,7100,9800,8900,10200,11400,9600,8100,9300,10100,11200];
}

export default function DashboardPage() {
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [month,   setMonth]   = useState(new Date().getMonth() + 1);
  const [year,    setYear]    = useState(new Date().getFullYear());
  const simRevenue = getSimulatedRevenue();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [month, year]);

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-slate-400">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">📊</div>
        <div>Loading dashboard...</div>
      </div>
    </div>
  );
  if (!data) return <div className="text-center py-20 text-red-400">Error loading data</div>;

  const periodLabel = new Date(data.period.year, data.period.month - 1)
    .toLocaleString("en-AU", { month: "long", year: "numeric" });

  const avgPerTour = data.totalTours > 0 ? Math.round(data.totalRevenue / data.totalTours) : 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">📊 Dashboard</h1>
          <p className="text-slate-400 text-sm">{periodLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-400">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-sky-400">
            {[2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon="🗺️" title="Total Tours"  value={String(data.totalTours)}
          sub="this month" color="text-sky-600" bg="bg-sky-50" />
        <KpiCard icon="💰" title="Revenue"       value={`$${data.totalRevenue.toLocaleString()}`}
          sub="AUD" color="text-emerald-600" bg="bg-emerald-50" />
        <KpiCard icon="📈" title="Avg per Tour"  value={`$${avgPerTour}`}
          sub="per booking" color="text-violet-600" bg="bg-violet-50" />
        <KpiCard icon="🏆" title="Top Guide"     value={data.topGuide?.name.split(" ")[0] ?? "—"}
          sub={data.topGuide ? `${data.topGuide.count} tours` : "no data"} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Chart + Channel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Bar chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-0.5">Monthly Revenue Trend</h2>
          <p className="text-xs text-slate-400 mb-4">Simulated · {year}</p>
          <div className="flex items-end gap-1 h-28">
            {simRevenue.map((v, i) => {
              const max = Math.max(...simRevenue);
              const pct = Math.round((v / max) * 100);
              const isCurrent = i + 1 === month;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-full rounded-t transition-all ${isCurrent ? "bg-sky-500" : "bg-sky-200"}`}
                    style={{ height: `${pct}%` }} title={`$${v.toLocaleString()}`} />
                  <span className={`text-[9px] ${isCurrent ? "text-sky-600 font-bold" : "text-slate-400"}`}>
                    {MONTHS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Channel breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Revenue by Channel</h2>
          {data.channelBreakdown.length === 0 ? (
            <p className="text-slate-400 text-sm">No bookings this period</p>
          ) : (
            <div className="space-y-3">
              {data.channelBreakdown.map((c) => (
                <div key={c.channel}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${CHANNEL_BADGE[c.channel] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                      {c.channel}
                    </span>
                    <span className="font-medium text-slate-700 text-sm">{c.percent}% · ${c.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${CHANNEL_COLORS[c.channel] ?? "bg-slate-400"}`}
                      style={{ width: `${c.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* City + Extras */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Tours by City</h2>
          {Object.keys(data.byCity).length === 0 ? (
            <p className="text-slate-400 text-sm">No data</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data.byCity).map(([city, count]) => {
                const total = Object.values(data.byCity).reduce((s, v) => s + v, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={city}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{CITY_EMOJI[city] ?? "🏙️"} {city.replace("_", " ")}</span>
                      <span className="font-semibold text-slate-700">{count} <span className="text-slate-400 font-normal text-xs">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-sky-400" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Extras Sold</h2>
          {Object.keys(data.extrasSold).length === 0 ? (
            <p className="text-slate-400 text-sm">No extras sold this period</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(data.extrasSold).sort(([,a],[,b]) => b - a).map(([name, count]) => (
                <div key={name} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{name.includes("Photo") ? "📸" : name.includes("Pickup") ? "🚗" : "🍷"}</span>
                    <span className="text-sm text-slate-700">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-emerald-400" style={{ width: `${Math.min(100, count * 20)}%` }} />
                    </div>
                    <span className="font-bold text-sky-600 text-sm w-6 text-right">{count}x</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top guide banner */}
      {data.topGuide && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 flex items-center gap-4">
          <div className="text-4xl">🏆</div>
          <div>
            <div className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Top Performer · {periodLabel}</div>
            <div className="text-xl font-bold text-slate-800">{data.topGuide.name}</div>
            <div className="text-sm text-slate-500">{data.topGuide.count} tours completed this month</div>
          </div>
        </div>
      )}

    </div>
  );
}

function KpiCard({ icon, title, value, sub, color, bg }: {
  icon: string; title: string; value: string; sub: string; color: string; bg: string;
}) {
  return (
    <div className={`${bg} rounded-xl border border-slate-100 p-4 hover:shadow-sm transition-shadow`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-400">{sub}</div>
      <div className="text-xs text-slate-500 font-medium mt-0.5">{title}</div>
    </div>
  );
}
