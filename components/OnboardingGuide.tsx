"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "scat_onboarding_done";

interface Step {
  icon: string;
  title: string;
  description: string;
  detail: string;
  href?: string;
  linkLabel?: string;
  color: string;
}

const STEPS: Step[] = [
  {
    icon: "🚙",
    title: "Welcome to Southern Cross Adventure Tours",
    description: "AI-powered management system demo",
    detail:
      "This platform shows how an AI agent can fully automate tour operations — bookings, guide assignment, messaging and analytics — across multiple channels.\n\nAll data is fictional and resets on each deploy. Explore freely!",
    color: "from-sky-500 to-sky-700",
  },
  {
    icon: "📊",
    title: "Dashboard",
    description: "Monthly revenue, tours and guide performance",
    detail:
      "The dashboard shows real-time stats: total tours, revenue in AUD, breakdown by channel (Airbnb, Viator, Web, Email) and extras sold. Use the month/year selector to explore different periods.",
    href: "/dashboard",
    linkLabel: "Open Dashboard",
    color: "from-emerald-500 to-emerald-700",
  },
  {
    icon: "📅",
    title: "Bookings",
    description: "All reservations in one place",
    detail:
      "Bookings arrive from Airbnb, Viator, WordPress and Email — simulated via webhooks. You can filter by status, city or channel, view full details and cancel reservations. A toast notification confirms each action.",
    href: "/bookings",
    linkLabel: "View Bookings",
    color: "from-violet-500 to-violet-700",
  },
  {
    icon: "👤",
    title: "Guides",
    description: "12 guides with AI-powered search",
    detail:
      "Search guides using natural language: try \"guides in Sydney\", \"best for sunset tour\" or a guide's name. Each guide has a full profile with upcoming bookings, total revenue and enabled tours.",
    href: "/guides",
    linkLabel: "Search Guides",
    color: "from-amber-500 to-amber-600",
  },
  {
    icon: "🤖",
    title: "AI Agent Chat",
    description: "Simulate customer conversations",
    detail:
      "The AI agent handles FAQs (pets, weather, meeting point, refunds), detects reschedule requests and responds automatically. Use the quick question buttons to see it in action — no LLM required, fully keyword-based.",
    href: "/chat",
    linkLabel: "Try the AI Agent",
    color: "from-rose-500 to-rose-700",
  },
];

export function OnboardingGuide() {
  const [visible, setVisible] = useState(false);
  const [step,    setStep]    = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else dismiss();
  }

  function prev() {
    if (step > 0) setStep(step - 1);
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={dismiss} />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">

        {/* Colored top */}
        <div className={`bg-gradient-to-br ${current.color} px-6 pt-6 pb-8 text-white`}>
          <div className="flex justify-between items-start mb-4">
            <div className="text-4xl">{current.icon}</div>
            <button onClick={dismiss}
              className="text-white/60 hover:text-white text-xl leading-none transition-colors"
              title="Skip intro">
              ✕
            </button>
          </div>
          <h2 className="text-xl font-bold leading-tight">{current.title}</h2>
          <p className="text-white/80 text-sm mt-1">{current.description}</p>
        </div>

        {/* Body */}
        <div className="px-6 pt-5 pb-4">
          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
            {current.detail}
          </p>

          {current.href && (
            <Link href={current.href} onClick={dismiss}
              className={`inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-white bg-gradient-to-r ${current.color} px-4 py-2 rounded-lg hover:opacity-90 transition-opacity`}>
              {current.linkLabel} →
            </Link>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between gap-3">
          {/* Dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-sky-500 w-4" : "bg-slate-200 hover:bg-slate-300"}`} />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 ml-auto">
            {!isFirst && (
              <button onClick={prev}
                className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                ← Back
              </button>
            )}
            {isFirst && (
              <button onClick={dismiss}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors">
                Skip intro
              </button>
            )}
            <button onClick={next}
              className="px-5 py-2 text-sm font-semibold bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
              {isLast ? "Get started" : "Next →"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Button to re-open the guide (for the footer or home)
export function OnboardingReopenButton() {
  function reopen() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
  return (
    <button onClick={reopen}
      className="text-xs text-sky-400 hover:text-sky-200 underline transition-colors">
      View intro guide
    </button>
  );
}
