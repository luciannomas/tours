"use client";

import { useEffect, useState } from "react";

interface Guide {
  id: string;
  name: string;
  email: string;
  city: string;
  priority: number;
  languages: string[];
  active: boolean;
  bookingCount: number;
  tourDetails: { id: string; name: string }[];
}

const CITY_EMOJI: Record<string, string> = {
  SYDNEY:     "🌉",
  MELBOURNE:  "☕",
  GOLD_COAST: "🏄",
};

export default function GuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState("");

  useEffect(() => {
    const params = cityFilter ? `?city=${cityFilter}` : "";
    fetch(`/api/guides${params}`)
      .then((r) => r.json())
      .then((d) => { setGuides(d); setLoading(false); });
  }, [cityFilter]);

  const cities = ["", "SYDNEY", "MELBOURNE", "GOLD_COAST"];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">👤 Guides</h1>

      <div className="flex gap-2 mb-5">
        {cities.map((c) => (
          <button
            key={c}
            onClick={() => { setCityFilter(c); setLoading(true); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              cityFilter === c
                ? "bg-sky-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {c ? `${CITY_EMOJI[c]} ${c.replace("_", " ")}` : "🌏 All Cities"}
          </button>
        ))}
      </div>

      {loading && <div className="text-slate-400 py-10 text-center">Loading...</div>}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((g) => (
            <div key={g.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-slate-800">{g.name}</div>
                  <div className="text-xs text-slate-400">{g.email}</div>
                </div>
                <div className="text-2xl">{CITY_EMOJI[g.city] ?? "🏙️"}</div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded">
                  {g.city.replace("_", " ")}
                </span>
                <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded">
                  Priority #{g.priority}
                </span>
                {g.languages.map((l) => (
                  <span key={l} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{l}</span>
                ))}
              </div>
              <div className="text-xs text-slate-500 mb-2">
                <strong className="text-sky-600">{g.bookingCount}</strong> total bookings
              </div>
              <div className="text-xs text-slate-400">
                Tours: {g.tourDetails?.map((t) => t.name).join(", ") || "None assigned"}
              </div>
            </div>
          ))}
          {guides.length === 0 && (
            <div className="col-span-3 text-slate-400 text-center py-10">No guides found</div>
          )}
        </div>
      )}
    </div>
  );
}
