import Link from "next/link";

export default function Home() {
  const cards = [
    {
      href:  "/dashboard",
      icon:  "📊",
      title: "Dashboard",
      desc:  "Monthly revenue, tours, guide stats",
      color: "bg-blue-50 border-blue-200",
    },
    {
      href:  "/bookings",
      icon:  "📅",
      title: "Bookings",
      desc:  "All reservations, filter by channel/city/status",
      color: "bg-green-50 border-green-200",
    },
    {
      href:  "/guides",
      icon:  "👤",
      title: "Guides",
      desc:  "12 guides across Sydney, Melbourne, Gold Coast",
      color: "bg-amber-50 border-amber-200",
    },
    {
      href:  "/chat",
      icon:  "🤖",
      title: "AI Agent",
      desc:  "Chat simulation – FAQ, reschedule, booking info",
      color: "bg-purple-50 border-purple-200",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">
          🏆 AI Tour Management System
        </h1>
        <p className="text-slate-500 mt-1">
          Demo platform · Southern Cross Adventure Tours · Australia
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={`border-2 rounded-xl p-6 ${c.color} hover:shadow-md transition-shadow`}
          >
            <div className="text-4xl mb-2">{c.icon}</div>
            <h2 className="text-xl font-semibold text-slate-700">{c.title}</h2>
            <p className="text-slate-500 text-sm mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-700 mb-4">🗺️ Tours Available</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {[
            { city: "🌉 Sydney",       tours: ["Sydney Icons Drive – 1h – $180", "Sydney Sunset Harbour Tour – 1h30 – $320", "Grand Sydney Discovery – 3h – $420"] },
            { city: "☕ Melbourne",     tours: ["Melbourne Cultural Highlights – 2h – $290"] },
            { city: "🏄 Gold Coast",    tours: ["Coastal Scenic Experience – 3h – $480"] },
          ].map((c) => (
            <div key={c.city} className="bg-slate-50 rounded-lg p-4">
              <div className="font-medium text-slate-700 mb-2">{c.city}</div>
              {c.tours.map((t) => (
                <div key={t} className="text-slate-500 text-xs py-0.5">• {t}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
