/**
 * In-Memory Store with auto-seed
 * ================================
 * No database needed. Data lives in module-level variables.
 * On Vercel: resets to seed on each cold start (perfect for demo).
 * On local dev: persists until you restart the server.
 */

import { v4 as uuidv4 } from "uuid";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type City    = "SYDNEY" | "MELBOURNE" | "GOLD_COAST";
export type Channel = "AIRBNB" | "VIATOR" | "WEB" | "EMAIL";
export type Status  = "PENDING" | "CONFIRMED" | "RESCHEDULED" | "CANCELLED" | "COMPLETED";
export type MsgChannel = "WHATSAPP" | "INSTAGRAM" | "EMAIL" | "AIRBNB_CHAT" | "WEB";

export interface Tour {
  id: string; name: string; city: City;
  duration: string; price: number; description: string; active: boolean;
}
export interface Extra {
  id: string; name: string; price: number; active: boolean;
}
export interface Guide {
  id: string; name: string; email: string; city: City;
  languages: string[]; priority: number; calendarId: string | null;
  active: boolean; tourIds: string[];
}
export interface Booking {
  id: string; reservationId: string;
  customerName: string; customerEmail: string; customerCountry: string;
  channel: Channel; tourId: string; guideId: string | null; city: City;
  date: string; time: string; passengers: number; totalPrice: number;
  status: Status; extrasIds: string[]; notes: string;
  createdAt: string; updatedAt: string;
}
export interface Message {
  id: string; bookingId: string | null; channel: MsgChannel;
  direction: "inbound" | "outbound"; content: string;
  sender: string; receiver: string; createdAt: string;
}
export interface Reminder {
  id: string; bookingId: string; type: "day_of" | "post_tour";
  sentAt: string | null; scheduled: string; content: string; channel: string;
}
export interface FaqEntry {
  id: string; question: string; answer: string; tags: string[];
}

// ─── SEED DATA ────────────────────────────────────────────────────────────────

function buildSeed() {
  const tours: Tour[] = [
    { id: "t1", name: "Sydney Icons Drive",                 city: "SYDNEY",     duration: "1h",   price: 180, description: "Discover Sydney's iconic landmarks in a private vehicle.", active: true },
    { id: "t2", name: "Sydney Sunset Harbour Tour",         city: "SYDNEY",     duration: "1h30", price: 320, description: "Watch the sunset over Sydney Harbour in style.",           active: true },
    { id: "t3", name: "Grand Sydney Discovery",             city: "SYDNEY",     duration: "3h",   price: 420, description: "The ultimate Sydney experience covering all highlights.",   active: true },
    { id: "t4", name: "Melbourne Cultural Highlights Tour", city: "MELBOURNE",  duration: "2h",   price: 290, description: "Explore Melbourne's arts, culture and coffee scene.",       active: true },
    { id: "t5", name: "Coastal Scenic Experience",          city: "GOLD_COAST", duration: "3h",   price: 480, description: "Stunning coastal drive along the Gold Coast.",              active: true },
  ];

  const extras: Extra[] = [
    { id: "e1", name: "Hotel Pickup",             price: 60,  active: true },
    { id: "e2", name: "Professional Photoshoot",  price: 250, active: true },
    { id: "e3", name: "Local Wine & Snacks Pack", price: 45,  active: true },
  ];

  const guides: Guide[] = [
    { id: "g1",  name: "Jack Wilson",     email: "jack@southerncross-demo.com",     city: "SYDNEY",     languages: ["EN"], priority: 1, calendarId: null, active: true, tourIds: ["t1","t2","t3"] },
    { id: "g2",  name: "Emily Carter",    email: "emily@southerncross-demo.com",    city: "SYDNEY",     languages: ["EN"], priority: 2, calendarId: null, active: true, tourIds: ["t1","t2","t3"] },
    { id: "g3",  name: "Liam Thompson",   email: "liam@southerncross-demo.com",     city: "SYDNEY",     languages: ["EN"], priority: 3, calendarId: null, active: true, tourIds: ["t1","t2","t3"] },
    { id: "g4",  name: "Olivia Brown",    email: "olivia@southerncross-demo.com",   city: "MELBOURNE",  languages: ["EN"], priority: 1, calendarId: null, active: true, tourIds: ["t4"] },
    { id: "g5",  name: "Noah Harris",     email: "noah@southerncross-demo.com",     city: "GOLD_COAST", languages: ["EN"], priority: 1, calendarId: null, active: true, tourIds: ["t5"] },
    { id: "g6",  name: "Ava Martinez",    email: "ava@southerncross-demo.com",      city: "SYDNEY",     languages: ["EN"], priority: 4, calendarId: null, active: true, tourIds: ["t1","t2","t3"] },
    { id: "g7",  name: "William Davis",   email: "william@southerncross-demo.com",  city: "MELBOURNE",  languages: ["EN"], priority: 2, calendarId: null, active: true, tourIds: ["t4"] },
    { id: "g8",  name: "Sophia Garcia",   email: "sophia@southerncross-demo.com",   city: "GOLD_COAST", languages: ["EN"], priority: 2, calendarId: null, active: true, tourIds: ["t5"] },
    { id: "g9",  name: "James Miller",    email: "james@southerncross-demo.com",    city: "SYDNEY",     languages: ["EN"], priority: 5, calendarId: null, active: true, tourIds: ["t1","t2","t3"] },
    { id: "g10", name: "Isabella Wilson", email: "isabella@southerncross-demo.com", city: "MELBOURNE",  languages: ["EN"], priority: 3, calendarId: null, active: true, tourIds: ["t4"] },
    { id: "g11", name: "Oliver Taylor",   email: "oliver@southerncross-demo.com",   city: "GOLD_COAST", languages: ["EN"], priority: 3, calendarId: null, active: true, tourIds: ["t5"] },
    { id: "g12", name: "Mia Anderson",    email: "mia@southerncross-demo.com",      city: "SYDNEY",     languages: ["EN"], priority: 6, calendarId: null, active: true, tourIds: ["t1","t2","t3"] },
  ];

  const faqs: FaqEntry[] = [
    { id: "f1", question: "Do you accept dogs?",          answer: "Small pets are welcome as long as they are in a carrier. Large dogs are not allowed.",    tags: ["pets","dogs","animals"] },
    { id: "f2", question: "What happens if it rains?",    answer: "The tour runs as planned. Our vehicles are fully covered and weather-ready.",               tags: ["weather","rain","rains","cancellation"] },
    { id: "f3", question: "Where does the tour start?",   answer: "The exact meeting point depends on the selected tour and will be confirmed after booking.", tags: ["meeting","location","start"] },
    { id: "f4", question: "Can I get a refund?",          answer: "Full refund if cancelled 48h+ before the tour. 50% refund within 24-48h. No refund within 24h.", tags: ["refund","money","policy"] },
    { id: "f5", question: "How many people per vehicle?", answer: "Each vehicle has 1 guide and fits up to 3 passengers for a private experience.",            tags: ["capacity","passengers","group","people","many"] },
    { id: "f6", question: "Do you offer hotel pickup?",   answer: "Yes! Hotel pickup is available as an extra for +60 AUD. Please add it when booking.",       tags: ["pickup","hotel","extras"] },
    { id: "f7", question: "What languages are available?",answer: "All tours are currently conducted in English.",                                              tags: ["language","english","spanish","languages"] },
  ];

  // Sample bookings with realistic data
  const now = new Date().toISOString();
  const bookings: Booking[] = [
    {
      id: "b1", reservationId: "VIATOR-DEMO-77542",
      customerName: "Sarah Mitchell", customerEmail: "sarah.mitchell@email-demo.com", customerCountry: "Australia",
      channel: "VIATOR", tourId: "t1", guideId: "g1", city: "SYDNEY",
      date: "2026-04-18", time: "15:00", passengers: 3,
      totalPrice: 490, status: "CONFIRMED", extrasIds: ["e1","e2"],
      notes: "", createdAt: now, updatedAt: now,
    },
    {
      id: "b2", reservationId: "AIRBNB-DEMO-12345",
      customerName: "James O'Brien", customerEmail: "james.obrien@email-demo.com", customerCountry: "UK",
      channel: "AIRBNB", tourId: "t2", guideId: "g2", city: "SYDNEY",
      date: "2026-04-20", time: "17:00", passengers: 2,
      totalPrice: 320, status: "CONFIRMED", extrasIds: [],
      notes: "", createdAt: now, updatedAt: now,
    },
    {
      id: "b3", reservationId: "WEB-DEMO-ABCDE",
      customerName: "Maria González", customerEmail: "maria.gonzalez@email-demo.com", customerCountry: "Spain",
      channel: "WEB", tourId: "t3", guideId: "g1", city: "SYDNEY",
      date: "2026-04-22", time: "10:00", passengers: 2,
      totalPrice: 465, status: "CONFIRMED", extrasIds: ["e3"],
      notes: "", createdAt: now, updatedAt: now,
    },
    {
      id: "b4", reservationId: "VIATOR-DEMO-88001",
      customerName: "Li Wei", customerEmail: "li.wei@email-demo.com", customerCountry: "China",
      channel: "VIATOR", tourId: "t4", guideId: "g4", city: "MELBOURNE",
      date: "2026-04-19", time: "11:00", passengers: 2,
      totalPrice: 350, status: "CONFIRMED", extrasIds: ["e1"],
      notes: "", createdAt: now, updatedAt: now,
    },
    {
      id: "b5", reservationId: "AIRBNB-DEMO-55321",
      customerName: "Emma Johnson", customerEmail: "emma.johnson@email-demo.com", customerCountry: "USA",
      channel: "AIRBNB", tourId: "t5", guideId: "g5", city: "GOLD_COAST",
      date: "2026-04-21", time: "09:00", passengers: 3,
      totalPrice: 540, status: "CONFIRMED", extrasIds: ["e1"],
      notes: "", createdAt: now, updatedAt: now,
    },
    {
      id: "b6", reservationId: "WEB-DEMO-FGHIJ",
      customerName: "Carlos Ruiz", customerEmail: "carlos.ruiz@email-demo.com", customerCountry: "Argentina",
      channel: "WEB", tourId: "t1", guideId: null, city: "SYDNEY",
      date: "2026-05-05", time: "14:00", passengers: 1,
      totalPrice: 180, status: "PENDING", extrasIds: [],
      notes: "", createdAt: now, updatedAt: now,
    },
  ];

  // Reminders for sample booking
  const reminders: Reminder[] = [
    {
      id: "r1", bookingId: "b1", type: "day_of",
      sentAt: null, scheduled: "2026-04-18T08:00:00.000Z",
      content: "Hi Sarah! 👋 This is a reminder for your Sydney Icons Drive today at 15:00. Your guide Jack will meet you at the confirmed meeting point.",
      channel: "whatsapp",
    },
    {
      id: "r2", bookingId: "b1", type: "post_tour",
      sentAt: null, scheduled: "2026-04-18T17:00:00.000Z",
      content: "We hope you enjoyed your experience 💙 Would you mind leaving us a review? 👉 https://g.page/r/southerncross-demo/review",
      channel: "whatsapp",
    },
  ];

  return { tours, extras, guides, faqs, bookings, reminders, messages: [] as Message[] };
}

// ─── GLOBAL STORE (module singleton) ─────────────────────────────────────────

const globalStore = globalThis as unknown as {
  _demoStore: ReturnType<typeof buildSeed> | undefined;
};

function getStore() {
  if (!globalStore._demoStore) {
    globalStore._demoStore = buildSeed();
    console.log("🌱 Demo store initialized with seed data");
  }
  return globalStore._demoStore;
}

// ─── STORE API ────────────────────────────────────────────────────────────────

export const store = {
  // ── TOURS ──
  getTours: (city?: City) => {
    const s = getStore();
    return city ? s.tours.filter(t => t.city === city && t.active) : s.tours.filter(t => t.active);
  },
  getTour: (id: string) => getStore().tours.find(t => t.id === id) ?? null,

  // ── EXTRAS ──
  getExtras: () => getStore().extras.filter(e => e.active),
  getExtra:  (id: string) => getStore().extras.find(e => e.id === id) ?? null,

  // ── GUIDES ──
  getGuides: (city?: City) => {
    const s = getStore();
    const guides = city
      ? s.guides.filter(g => g.city === city && g.active)
      : s.guides.filter(g => g.active);
    return guides.sort((a, b) => a.priority - b.priority);
  },
  getGuide: (id: string) => getStore().guides.find(g => g.id === id) ?? null,
  getGuideBookingCount: (guideId: string) =>
    getStore().bookings.filter(b => b.guideId === guideId && b.status !== "CANCELLED").length,

  // ── BOOKINGS ──
  getBookings: (filters?: { status?: Status; city?: City; channel?: Channel }) => {
    const s = getStore();
    return s.bookings
      .filter(b =>
        (!filters?.status  || b.status  === filters.status)  &&
        (!filters?.city    || b.city    === filters.city)     &&
        (!filters?.channel || b.channel === filters.channel)
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  },
  getBooking: (id: string) => getStore().bookings.find(b => b.id === id) ?? null,

  createBooking: (data: Omit<Booking, "id" | "createdAt" | "updatedAt">) => {
    const s = getStore();
    const now = new Date().toISOString();
    const booking: Booking = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
    s.bookings.push(booking);
    return booking;
  },

  updateBooking: (id: string, updates: Partial<Booking>) => {
    const s = getStore();
    const idx = s.bookings.findIndex(b => b.id === id);
    if (idx === -1) return null;
    s.bookings[idx] = { ...s.bookings[idx], ...updates, updatedAt: new Date().toISOString() };
    return s.bookings[idx];
  },

  // ── MESSAGES ──
  addMessage: (data: Omit<Message, "id" | "createdAt">) => {
    const s = getStore();
    const msg: Message = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    s.messages.push(msg);
    return msg;
  },
  getMessages: (bookingId?: string) => {
    const s = getStore();
    return bookingId
      ? s.messages.filter(m => m.bookingId === bookingId)
      : s.messages;
  },

  // ── REMINDERS ──
  getReminders: () => getStore().reminders,
  getDueReminders: () => {
    const now = new Date().toISOString();
    return getStore().reminders.filter(r => !r.sentAt && r.scheduled <= now);
  },
  markReminderSent: (id: string) => {
    const s = getStore();
    const r = s.reminders.find(r => r.id === id);
    if (r) r.sentAt = new Date().toISOString();
    return r ?? null;
  },

  // ── FAQS ──
  getFaqs: () => getStore().faqs,

  // ── ASSIGNMENT ──
  findAvailableGuide: (tourId: string, city: City, date: string, time: string, excludeBookingId?: string): Guide | null => {
    const s = getStore();
    const eligible = s.guides
      .filter(g => g.city === city && g.active && g.tourIds.includes(tourId))
      .sort((a, b) => a.priority - b.priority);

    for (const guide of eligible) {
      const conflict = s.bookings.find(b =>
        b.guideId  === guide.id &&
        b.date     === date     &&
        b.time     === time     &&
        b.status   !== "CANCELLED" &&
        b.id       !== excludeBookingId
      );
      if (!conflict) return guide;
    }
    return null;
  },

  // ── DASHBOARD ──
  getDashboardStats: (month: number, year: number) => {
    const s = getStore();
    const pad = (n: number) => String(n).padStart(2, "0");
    const prefix = `${year}-${pad(month)}`;

    const active = s.bookings.filter(b =>
      b.date.startsWith(prefix) && b.status !== "CANCELLED"
    );

    const totalRevenue = active.reduce((sum, b) => sum + b.totalPrice, 0);

    const byChannel: Record<string, number> = {};
    for (const b of active) byChannel[b.channel] = (byChannel[b.channel] ?? 0) + b.totalPrice;

    const channelBreakdown = Object.entries(byChannel).map(([channel, revenue]) => ({
      channel, revenue,
      percent: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
    }));

    const extrasSold: Record<string, number> = {};
    for (const b of active) {
      for (const eid of b.extrasIds) {
        const extra = s.extras.find(e => e.id === eid);
        if (extra) extrasSold[extra.name] = (extrasSold[extra.name] ?? 0) + 1;
      }
    }

    const byCity: Record<string, number> = {};
    for (const b of active) byCity[b.city] = (byCity[b.city] ?? 0) + 1;

    const guideCount: Record<string, { name: string; count: number }> = {};
    for (const b of s.bookings.filter(b => b.status !== "CANCELLED")) {
      if (b.guideId) {
        const g = s.guides.find(g => g.id === b.guideId);
        if (g) {
          guideCount[b.guideId] = guideCount[b.guideId] ?? { name: g.name, count: 0 };
          guideCount[b.guideId].count++;
        }
      }
    }
    const topGuide = Object.values(guideCount).sort((a, b) => b.count - a.count)[0] ?? null;

    return { totalTours: active.length, totalRevenue, channelBreakdown, extrasSold, byCity, topGuide };
  },

  // ── FAQ MATCH ──
  matchFaq: (message: string): string | null => {
    const faqs = getStore().faqs;
    const words = message.toLowerCase().split(/\W+/).filter(Boolean);
    for (const faq of faqs) {
      if (faq.tags.some(tag => words.includes(tag.toLowerCase()))) return faq.answer;
    }
    return null;
  },

  // ── RESET (for testing) ──
  reset: () => {
    globalStore._demoStore = buildSeed();
  },
};
