import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Southern Cross Adventure Tours – Admin",
  description: "AI-powered tour management demo",
};

const navLinks = [
  { href: "/",           label: "🏠 Home" },
  { href: "/dashboard",  label: "📊 Dashboard" },
  { href: "/bookings",   label: "📅 Bookings" },
  { href: "/guides",     label: "👤 Guides" },
  { href: "/chat",       label: "🤖 AI Agent" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="bg-sky-700 text-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🚙</span>
              <span className="font-bold text-lg">Southern Cross Adventure Tours</span>
              <span className="ml-2 text-xs bg-sky-500 px-2 py-0.5 rounded-full">DEMO</span>
            </div>
            <nav className="flex gap-4">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm hover:text-sky-200 transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
          {children}
        </main>
        <footer className="bg-sky-900 text-sky-300 text-center text-xs py-3">
          Southern Cross Adventure Tours – AI Demo · Sydney · Melbourne · Gold Coast
        </footer>
      </body>
    </html>
  );
}
