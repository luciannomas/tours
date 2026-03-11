"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

interface Guide {
  id: string;
  name: string;
  email: string;
  city: string;
  priority: number;
  languages: string[];
  active: boolean;
  bookingCount: number;
  tourDetails: { id: string; name: string; price: number; duration: string }[];
}

const CITY_EMOJI: Record<string, string> = {
  SYDNEY:     "🌉",
  MELBOURNE:  "☕",
  GOLD_COAST: "🏄",
};

// ── AI Search: interpreta lenguaje natural ────────────────────────────────────
function aiSearchFilter(guides: Guide[], query: string): Guide[] {
  if (!query.trim()) return guides;
  const q = query.toLowerCase();

  const cityMap: Record<string, string> = {
    sydney: "SYDNEY", melbourne: "MELBOURNE",
    "gold coast": "GOLD_COAST", goldcoast: "GOLD_COAST",
  };
  let targetCity: string | null = null;
  for (const [k, v] of Object.entries(cityMap)) {
    if (q.includes(k)) { targetCity = v; break; }
  }

  const wantTopPriority = /top|best|first|priority 1|#1|highest/.test(q);
  const wantLowPriority = /low priority|less busy|available/.test(q);
  const wantEnglish     = /english/.test(q);
  const wantSpanish     = /spanish|espa/.test(q);

  const tourKeywords = ["icons", "sunset", "harbour", "discovery", "cultural", "coastal", "scenic"];
  const mentionedTour = tourKeywords.find((k) => q.includes(k));

  const nameParts = q.split(/\s+/).filter((w) => w.length > 2);

  return guides.filter((g) => {
    if (targetCity && g.city !== targetCity) return false;
    if (wantEnglish && !g.languages.includes("EN")) return false;
    if (wantSpanish && !g.languages.includes("ES")) return false;
    if (mentionedTour) {
      if (!g.tourDetails.some((t) => t.name.toLowerCase().includes(mentionedTour))) return false;
    }
    const nameMatch  = nameParts.some((p) => g.name.toLowerCase().includes(p));
    const emailMatch = g.email.toLowerCase().includes(q);
    const hasSpecific = targetCity || mentionedTour || wantEnglish || wantSpanish;
    if (!hasSpecific && !nameMatch && !emailMatch) return false;
    return true;
  }).sort((a, b) => {
    if (wantTopPriority) return a.priority - b.priority;
    if (wantLowPriority) return b.priority - a.priority;
    return a.priority - b.priority;
  });
}

const AI_SUGGESTIONS = [
  "Guides in Sydney",
  "Best guide for sunset tour",
  "Jack Wilson",
  "Melbourne guides",
  "Top priority Gold Coast",
  "Guides with coastal tour",
];

export default function GuidesPage() {
  const [guides,     setGuides]     = useState<Guide[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [cityFilter, setCityFilter] = useState("");
  const [search,     setSearch]     = useState("");
  const [aiHint,     setAiHint]     = useState("");

  useEffect(() => {
    fetch("/api/guides")
      .then((r) => r.json())
      .then((d) => { setGuides(d); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!search.trim()) { setAiHint(""); return; }
    const q = search.toLowerCase();
    const hints: string[] = [];
    if (/sydney/i.test(q))     hints.push("city: Sydney");
    if (/melbourne/i.test(q))  hints.push("city: Melbourne");
    if (/gold coast/i.test(q)) hints.push("city: Gold Coast");
    if (/top|best|first/i.test(q)) hints.push("sorted by priority");
    if (/sunset|harbour|icons|discovery|cultural|coastal/i.test(q)) hints.push("filtered by tour");
    if (/english/i.test(q))    hints.push("language: EN");
    setAiHint(hints.length ? `🤖 ${hints.join(" · ")}` : "🤖 searching by name...");
  }, [search]);

  const filtered = useMemo(() => {
    const base = cityFilter ? guides.filter((g) => g.city === cityFilter) : guides;
    return aiSearchFilter(base, search);
  }, [guides, cityFilter, search]);

  const cities = ["", "SYDNEY", "MELBOURNE", "GOLD_COAST"];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">👤 Guides</h1>
          <p className="text-slate-400 text-sm mt-0.5">{guides.length} total · {filtered.length} shown</p>
        </div>
      </div>

      {/* AI Search box */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🤖</span>
          <span className="text-sm font-semibold text-slate-700">AI Guide Search</span>
          <span className="text-xs bg-sky-50 text-sky-600 border border-sky-100 px-2 py-0.5 rounded-full">Smart</span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Try: "guides in Sydney", "best for sunset tour", "Jack Wilson"...'
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm pr-8 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none">
              ×
            </button>
          )}
        </div>
        {aiHint && <div className="mt-2 text-xs text-sky-600 font-medium">{aiHint}</div>}
        {!search && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {AI_SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => setSearch(s)}
                className="text-xs bg-slate-50 border border-slate-200 text-slate-500 px-2.5 py-1 rounded-full hover:bg-sky-50 hover:border-sky-200 hover:text-sky-600 transition-colors">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* City tabs */}
      <div className="flex gap-2 mb-5">
        {cities.map((c) => (
          <button key={c} onClick={() => setCityFilter(c)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              cityFilter === c
                ? "bg-sky-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}>
            {c ? `${CITY_EMOJI[c]} ${c.replace("_", " ")}` : "🌏 All Cities"}
          </button>
        ))}
      </div>

      {loading && <div className="text-slate-400 py-10 text-center animate-pulse">Loading guides...</div>}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g) => (
            <Link key={g.id} href={`/guides/${g.id}`}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-sky-200 transition-all group block">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {g.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">{g.name}</div>
                    <div className="text-xs text-slate-400">{g.email}</div>
                  </div>
                </div>
                <div className="text-2xl">{CITY_EMOJI[g.city] ?? "🏙️"}</div>
              </div>

              <div className="flex flex-wrap gap-1.5 text-xs mb-3">
                <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded">{g.city.replace("_", " ")}</span>
                <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded">Priority #{g.priority}</span>
                {g.languages.map((l) => (
                  <span key={l} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{l}</span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span><strong className="text-sky-600 text-sm">{g.bookingCount}</strong> bookings</span>
                <span className={`px-2 py-0.5 rounded-full font-medium ${g.active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                  {g.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="text-xs text-slate-400 truncate mb-3">
                {g.tourDetails?.map((t) => t.name).join(", ") || "No tours assigned"}
              </div>

              <div className="text-xs text-sky-500 font-medium group-hover:text-sky-600 transition-colors">
                View profile →
              </div>
            </Link>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-14">
              <div className="text-4xl mb-3">🔍</div>
              <div className="text-slate-500 font-medium">No guides match your search</div>
              <button onClick={() => { setSearch(""); setCityFilter(""); }}
                className="mt-3 text-sm text-sky-500 hover:text-sky-600 underline">
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
