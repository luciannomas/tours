import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { ToastProvider } from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "Southern Cross Adventure Tours – Admin",
  description: "AI-powered tour management demo",
};

const navLinks = [
  { href: "/",          label: "🏠 Home" },
  { href: "/dashboard", label: "📊 Dashboard" },
  { href: "/bookings",  label: "📅 Bookings" },
  { href: "/guides",    label: "👤 Guides" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <ToastProvider>
          <header className="bg-gradient-to-r from-sky-700 to-sky-800 text-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                <span className="text-2xl">🚙</span>
                <div>
                  <div className="font-bold text-lg leading-tight">Southern Cross Adventure Tours</div>
                  <div className="text-xs text-sky-300">AI Management System</div>
                </div>
                <span className="ml-2 text-xs bg-sky-500/70 px-2 py-0.5 rounded-full">DEMO</span>
              </Link>
              <nav className="flex gap-1">
                {navLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-sm px-3 py-1.5 rounded-lg hover:bg-sky-600 transition-colors"
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
        </ToastProvider>
      </body>
    </html>
  );
}
