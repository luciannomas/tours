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
  dailyChart: { date: string; revenue: number }[];
}

const CHANNEL_COLORS: Record<string, string> = {
  AIRBNB: "bg-rose-400",
  VIATOR: "bg-blue-400",
  WEB:    "bg-emerald-400",
  EMAIL:  "bg-amber-400",
};

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();

  useEffect(() => {
    fetch(`/api/dashboard?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-20 text-slate-400">Loading dashboard...</div>;
  if (!data)   return <div className="text-center py-20 text-red-400">Error loading data</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">📊 Dashboard</h1>
      <p className="text-slate-400 text-sm mb-6">
        {new Date(data.period.year, data.period.month - 1).toLocaleString("en-AU", { month: "long", year: "numeric" })}
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard title="Total Tours"    value={String(data.totalTours)}   icon="🗺️" />
        <KpiCard title="Revenue"        value={`$${data.totalRevenue.toLocaleString()} AUD`} icon="💰" />
        <KpiCard title="Top Guide"      value={data.topGuide?.name ?? "—"} icon="🏆" sub={data.topGuide ? `${data.topGuide.count} tours` : ""} />
        <KpiCard title="Channels"       value={String(data.channelBreakdown.length)} icon="📡" />
      </div>

      {/* Channel Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Revenue by Channel</h2>
          <div className="space-y-3">
            {data.channelBreakdown.map((c) => (
              <div key={c.channel}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{c.channel}</span>
                  <span className="font-medium">{c.percent}% · ${c.revenue.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${CHANNEL_COLORS[c.channel] ?? "bg-slate-400"}`}
                    style={{ width: `${c.percent}%` }}
                  />
                </div>
              </div>
            ))}
            {data.channelBreakdown.length === 0 && (
              <p className="text-slate-400 text-sm">No bookings this period</p>
            )}
          </div>
        </div>

        {/* By City */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-700 mb-4">Tours by City</h2>
          <div className="space-y-2">
            {Object.entries(data.byCity).map(([city, count]) => (
              <div key={city} className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600 capitalize">{city.replace("_", " ")}</span>
                <span className="font-semibold text-sky-600">{count}</span>
              </div>
            ))}
            {Object.keys(data.byCity).length === 0 && (
              <p className="text-slate-400 text-sm">No data</p>
            )}
          </div>
        </div>
      </div>

      {/* Extras */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-700 mb-4">Extras Sold</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(data.extrasSold).map(([name, count]) => (
            <div key={name} className="bg-sky-50 border border-sky-200 rounded-lg px-4 py-2 text-sm">
              <span className="text-slate-700">{name}</span>
              <span className="ml-2 font-bold text-sky-600">{count}x</span>
            </div>
          ))}
          {Object.keys(data.extrasSold).length === 0 && (
            <p className="text-slate-400 text-sm">No extras sold this period</p>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, sub }: { title: string; value: string; icon: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold text-slate-800">{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
      <div className="text-xs text-slate-500 mt-0.5">{title}</div>
    </div>
  );
}
