"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "agent";
  content: string;
  type?: string;
}

const QUICK_QUESTIONS = [
  "Do you accept dogs?",
  "What happens if it rains?",
  "Where does the tour start?",
  "Can I get a refund?",
  "How many people fit per vehicle?",
  "Can I move my tour to April 20th at 10am?",
  "What is my booking status?",
];

export default function ChatPage() {
  const [messages,    setMessages]    = useState<Message[]>([
    { role: "agent", content: "Hi! I'm the Southern Cross AI assistant 🚙\nI can help you with FAQs, booking information, rescheduling, and more. How can I help you today?" },
  ]);
  const [input,       setInput]       = useState("");
  const [bookingId,   setBookingId]   = useState("");
  const [loading,     setLoading]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message:   msg,
        bookingId: bookingId || undefined,
        channel:   "WEB",
        customerEmail: "demo@customer.com",
      }),
    });

    const data = await res.json();
    setMessages((prev) => [...prev, { role: "agent", content: data.message, type: data.type }]);
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">🤖 AI Agent Chat</h1>
      <p className="text-slate-400 text-sm mb-4">Simulates multi-channel messaging – FAQ, reschedule, booking info</p>

      <div className="flex gap-4">
        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden" style={{ height: "580px" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-sky-600 text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-700 rounded-bl-sm"
                }`}>
                  {m.role === "agent" && (
                    <div className="text-xs text-slate-400 mb-1">🤖 SouthernCross Bot</div>
                  )}
                  {m.content}
                  {m.type && m.type !== "unknown" && (
                    <div className="text-xs mt-1 opacity-60">[{m.type}]</div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 rounded-2xl px-4 py-2.5 text-sm text-slate-400">
                  Typing...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 p-3 flex gap-2">
            <input
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-64 shrink-0 space-y-4">
          {/* Booking context */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="font-semibold text-slate-700 text-sm mb-2">Booking Context</h3>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
              placeholder="Booking ID (optional)"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1">
              Provide a booking ID to get specific booking info or reschedule.
            </p>
          </div>

          {/* Quick questions */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="font-semibold text-slate-700 text-sm mb-2">Quick Questions</h3>
            <div className="space-y-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  disabled={loading}
                  className="w-full text-left text-xs bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 rounded-lg px-3 py-2 text-slate-600 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
