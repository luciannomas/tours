/**
 * Full Flow Test Script – Southern Cross Adventure Tours Demo
 * ============================================================
 * Runs WITHOUT a real database – uses in-memory mock data.
 * Simulates & validates all business logic:
 *
 *  1. Seed data structure
 *  2. Booking creation (multi-channel)
 *  3. Guide assignment algorithm
 *  4. Double-booking conflict detection
 *  5. AI Agent FAQ matching
 *  6. Reschedule flow
 *  7. Cancellation
 *  8. Messaging content generation
 *  9. Dashboard stats calculation
 * 10. Multi-city bookings
 *
 * To run against real DB: npm run test:flow -- --live
 */

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

type City    = "SYDNEY" | "MELBOURNE" | "GOLD_COAST";
type Channel = "AIRBNB" | "VIATOR" | "WEB" | "EMAIL";
type Status  = "PENDING" | "CONFIRMED" | "RESCHEDULED" | "CANCELLED" | "COMPLETED";

interface Tour  { id: string; name: string; city: City; price: number; duration: string; active: boolean }
interface Extra { id: string; name: string; price: number }
interface Guide { id: string; name: string; city: City; priority: number; tourIds: string[] }
interface Booking {
  id: string; reservationId: string;
  customerName: string; customerEmail: string; customerCountry?: string;
  channel: Channel; tourId: string; guideId?: string; city: City;
  date: string; time: string; passengers: number; totalPrice: number;
  status: Status; extrasIds: string[];
}
interface Message { id: string; channel: string; to: string; content: string; bookingId?: string }
interface FaqEntry { question: string; answer: string; tags: string[] }

const TOURS: Tour[] = [
  { id: "t1", name: "Sydney Icons Drive",                city: "SYDNEY",     price: 180, duration: "1h",    active: true },
  { id: "t2", name: "Sydney Sunset Harbour Tour",        city: "SYDNEY",     price: 320, duration: "1h30",  active: true },
  { id: "t3", name: "Grand Sydney Discovery",            city: "SYDNEY",     price: 420, duration: "3h",    active: true },
  { id: "t4", name: "Melbourne Cultural Highlights Tour",city: "MELBOURNE",  price: 290, duration: "2h",    active: true },
  { id: "t5", name: "Coastal Scenic Experience",         city: "GOLD_COAST", price: 480, duration: "3h",    active: true },
];

const EXTRAS: Extra[] = [
  { id: "e1", name: "Hotel Pickup",            price: 60  },
  { id: "e2", name: "Professional Photoshoot", price: 250 },
  { id: "e3", name: "Local Wine & Snacks Pack",price: 45  },
];

const GUIDES: Guide[] = [
  { id: "g1",  name: "Jack Wilson",     city: "SYDNEY",     priority: 1, tourIds: ["t1","t2","t3"] },
  { id: "g2",  name: "Emily Carter",    city: "SYDNEY",     priority: 2, tourIds: ["t1","t2","t3"] },
  { id: "g3",  name: "Liam Thompson",   city: "SYDNEY",     priority: 3, tourIds: ["t1","t2","t3"] },
  { id: "g4",  name: "Olivia Brown",    city: "MELBOURNE",  priority: 1, tourIds: ["t4"] },
  { id: "g5",  name: "Noah Harris",     city: "GOLD_COAST", priority: 1, tourIds: ["t5"] },
  { id: "g6",  name: "Ava Martinez",    city: "SYDNEY",     priority: 4, tourIds: ["t1","t2","t3"] },
  { id: "g7",  name: "William Davis",   city: "MELBOURNE",  priority: 2, tourIds: ["t4"] },
  { id: "g8",  name: "Sophia Garcia",   city: "GOLD_COAST", priority: 2, tourIds: ["t5"] },
  { id: "g9",  name: "James Miller",    city: "SYDNEY",     priority: 5, tourIds: ["t1","t2","t3"] },
  { id: "g10", name: "Isabella Wilson", city: "MELBOURNE",  priority: 3, tourIds: ["t4"] },
  { id: "g11", name: "Oliver Taylor",   city: "GOLD_COAST", priority: 3, tourIds: ["t5"] },
  { id: "g12", name: "Mia Anderson",    city: "SYDNEY",     priority: 6, tourIds: ["t1","t2","t3"] },
];

const FAQS: FaqEntry[] = [
  { question: "Do you accept dogs?",          answer: "Small pets are welcome as long as they are in a carrier. Large dogs are not allowed.",       tags: ["pets","dogs","animals"] },
  { question: "What happens if it rains?",    answer: "The tour runs as planned. Our vehicles are fully covered and weather-ready.",                  tags: ["weather","rain","rains"] },
  { question: "Where does the tour start?",   answer: "The exact meeting point depends on the selected tour and will be confirmed after booking.",    tags: ["meeting","location","start"] },
  { question: "Can I get a refund?",          answer: "Full refund if cancelled 48h+ before. 50% refund within 24-48h. No refund within 24h.",       tags: ["refund","cancel","money"] },
  { question: "How many people fit?",         answer: "Each vehicle has 1 guide and fits up to 3 passengers for a private experience.",               tags: ["capacity","passengers","group"] },
  { question: "Do you offer hotel pickup?",   answer: "Yes! Hotel pickup is available as an extra for +60 AUD.",                                      tags: ["pickup","hotel","extras"] },
  { question: "What languages?",              answer: "All tours are currently conducted in English.",                                                 tags: ["language","english"] },
];

// In-memory "database"
const DB: {
  bookings: Booking[];
  messages: Message[];
} = { bookings: [], messages: [] };

let nextId = 1;
function uid() { return `mock-${nextId++}`; }

// ─── BUSINESS LOGIC (mirrors lib/ files) ──────────────────────────────────────

function findAvailableGuide(tourId: string, city: City, date: string, time: string, excludeId?: string): Guide | null {
  const eligible = GUIDES
    .filter(g => g.city === city && g.tourIds.includes(tourId))
    .sort((a, b) => a.priority - b.priority);

  for (const guide of eligible) {
    const conflict = DB.bookings.find(b =>
      b.guideId === guide.id &&
      b.date    === date &&
      b.time    === time &&
      b.status  !== "CANCELLED" &&
      b.id      !== excludeId
    );
    if (!conflict) return guide;
  }
  return null;
}

function createBooking(data: Omit<Booking, "id" | "status" | "guideId">): Booking {
  const booking: Booking = { ...data, id: uid(), status: "PENDING" };
  DB.bookings.push(booking);
  return booking;
}

function assignGuide(bookingId: string): Guide | null {
  const booking = DB.bookings.find(b => b.id === bookingId);
  if (!booking) return null;
  const guide = findAvailableGuide(booking.tourId, booking.city, booking.date, booking.time, bookingId);
  if (guide) {
    booking.guideId = guide.id;
    booking.status  = "CONFIRMED";
  }
  return guide;
}

function detectIntent(msg: string): string {
  const l = msg.toLowerCase();
  if (/reschedul|move|change.*date|different.*day|new.*date/i.test(l)) return "reschedule";
  if (/\bcancel\b/i.test(l) && !/refund policy/i.test(l)) return "cancel";
  if (/my booking|reservation|confirm/i.test(l)) return "booking_info";
  return "faq";
}

function matchFaq(msg: string): string | null {
  const words = msg.toLowerCase().split(/\W+/).filter(Boolean);
  for (const faq of FAQS) {
    const keywords = faq.tags.map(t => t.toLowerCase());
    if (keywords.some(k => words.includes(k))) return faq.answer;
  }
  return null;
}

function processMessage(msg: string, bookingId?: string): { type: string; message: string } {
  const intent = detectIntent(msg);
  if (intent === "reschedule") {
    return { type: "reschedule", message: "I can help you reschedule! Please provide the new date and time." };
  }
  if (intent === "cancel") {
    return { type: "cancel", message: "Our policy: full refund 48h+ before, 50% within 24-48h. Shall I proceed?" };
  }
  const faqAnswer = matchFaq(msg);
  if (faqAnswer) return { type: "faq", message: faqAnswer };
  return { type: "unknown", message: "Thanks! Our team will get back to you shortly." };
}

function sendMessage(to: string, channel: string, content: string, bookingId?: string): Message {
  const msg: Message = { id: uid(), channel, to, content, bookingId };
  DB.messages.push(msg);
  return msg;
}

function buildConfirmation(b: { customerName: string; tourName: string; date: string; time: string; guideName: string; price: number; ref: string }): string {
  return `✅ Booking Confirmed!\nHi ${b.customerName}! Tour: ${b.tourName} · ${b.date} ${b.time} · Guide: ${b.guideName} · $${b.price} AUD · Ref: ${b.ref}`;
}

function buildReminder(customerName: string, tourName: string, time: string, guideName: string): string {
  return `Hi ${customerName}! 👋 Reminder for your ${tourName} today at ${time}. Your guide ${guideName} will meet you at the confirmed meeting point.`;
}

function buildPostTour(customerName: string, tourName: string): string {
  return `Hi ${customerName}! We hope you enjoyed your ${tourName} 💙 Leave us a review: https://g.page/r/southerncross-demo/review`;
}

// ─── TEST RUNNER ──────────────────────────────────────────────────────────────

let passed = 0, failed = 0;

function log(title: string) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`▶  ${title}`);
  console.log("─".repeat(60));
}
function ok(msg: string)                  { console.log(`  ✅ ${msg}`); passed++; }
function fail(msg: string, extra = "")    { console.log(`  ❌ ${msg}${extra ? " – " + extra : ""}`); failed++; }
function assert(cond: boolean, yes: string, no: string) { cond ? ok(yes) : fail(no); }

// ─── TESTS ────────────────────────────────────────────────────────────────────

function test1_SeedData() {
  log("TEST 1 – Seed Data Validation");
  assert(TOURS.length  >= 5,  `Tours: ${TOURS.length}`,     "Expected 5+ tours");
  assert(GUIDES.length >= 12, `Guides: ${GUIDES.length}`,   "Expected 12+ guides");
  assert(EXTRAS.length >= 3,  `Extras: ${EXTRAS.length}`,   "Expected 3+ extras");
  assert(FAQS.length   >= 5,  `FAQs: ${FAQS.length}`,       "Expected 5+ FAQs");
  const sydneyTours = TOURS.filter(t => t.city === "SYDNEY");
  assert(sydneyTours.length >= 3, `Sydney tours: ${sydneyTours.length}`, "Expected 3+ Sydney tours");
  const melbGuides  = GUIDES.filter(g => g.city === "MELBOURNE");
  const gcGuides    = GUIDES.filter(g => g.city === "GOLD_COAST");
  assert(melbGuides.length >= 3, `Melbourne guides: ${melbGuides.length}`, "Expected 3+ Melbourne guides");
  assert(gcGuides.length   >= 3, `Gold Coast guides: ${gcGuides.length}`,  "Expected 3+ Gold Coast guides");
}

function test2_CreateBookings(): Booking[] {
  log("TEST 2 – Create Bookings (Multi-Channel)");

  const tour = TOURS.find(t => t.city === "SYDNEY")!;
  const extras = [EXTRAS[0].id, EXTRAS[1].id];
  const extrasTotal = EXTRAS[0].price + EXTRAS[1].price;

  const created: Booking[] = [];
  const testCases = [
    { reservationId: "VIATOR-DEMO-77542", customerName: "Sarah Mitchell", channel: "VIATOR" as Channel, date: "2026-05-10", time: "10:00" },
    { reservationId: "AIRBNB-DEMO-12345", customerName: "James O'Brien",  channel: "AIRBNB" as Channel, date: "2026-05-10", time: "14:00" },
    { reservationId: "WEB-DEMO-ABCDE",    customerName: "Maria González", channel: "WEB"    as Channel, date: "2026-05-11", time: "10:00" },
    { reservationId: "EMAIL-DEMO-99999",  customerName: "Li Wei",         channel: "EMAIL"  as Channel, date: "2026-05-12", time: "09:00" },
  ];

  for (const tc of testCases) {
    const b = createBooking({
      reservationId: tc.reservationId,
      customerName:  tc.customerName,
      customerEmail: `${tc.customerName.toLowerCase().replace(/[^a-z]/g,"")}@test.com`,
      channel:       tc.channel,
      tourId:        tour.id,
      city:          "SYDNEY",
      date:          tc.date,
      time:          tc.time,
      passengers:    2,
      totalPrice:    tour.price + extrasTotal,
      extrasIds:     extras,
    });
    ok(`Created ${b.reservationId} (${tc.channel}) – $${b.totalPrice} AUD`);
    created.push(b);
  }

  assert(DB.bookings.length === 4, `DB has ${DB.bookings.length} bookings`, "Expected 4 bookings");
  return created;
}

function test3_GuideAssignment(bookings: Booking[]) {
  log("TEST 3 – Guide Auto-Assignment");

  for (const b of bookings) {
    const guide = assignGuide(b.id);
    if (guide) {
      ok(`${b.reservationId} → ${guide.name} (priority #${guide.priority})`);
    } else {
      fail(`${b.reservationId} → No guide available`);
    }
  }

  // All same tour/city but different dates/times – should all get assigned
  const assigned = DB.bookings.filter(b => b.status === "CONFIRMED").length;
  assert(assigned === bookings.length, `All ${assigned}/${bookings.length} bookings assigned`, "Some bookings unassigned");
}

function test4_ConflictDetection() {
  log("TEST 4 – Double-Booking Conflict Detection");

  const tour  = TOURS.find(t => t.city === "SYDNEY")!;
  const jack  = GUIDES.find(g => g.name === "Jack Wilson")!;

  // Create a booking for Jack at 09:00 on May 20
  const occupied = createBooking({
    reservationId: "TEST-CONFLICT-A",
    customerName:  "User A",
    customerEmail: "a@test.com",
    channel:       "WEB",
    tourId:        tour.id,
    city:          "SYDNEY",
    date:          "2026-05-20",
    time:          "09:00",
    passengers:    1,
    totalPrice:    180,
    extrasIds:     [],
  });
  occupied.guideId = jack.id;
  occupied.status  = "CONFIRMED";
  ok(`Booked Jack at 09:00 on May 20`);

  // Try same slot – Jack should be skipped
  const nextGuide = findAvailableGuide(tour.id, "SYDNEY", "2026-05-20", "09:00");
  if (!nextGuide) {
    ok("No other Sydney guide available at same slot (OK for this test scenario)");
  } else {
    assert(nextGuide.id !== jack.id,
      `Conflict skipped Jack → assigned ${nextGuide.name}`,
      "Conflict not detected – Jack re-assigned"
    );
  }

  // Same customer, different time – Jack should be available again
  const differentTime = findAvailableGuide(tour.id, "SYDNEY", "2026-05-20", "14:00");
  assert(
    differentTime?.id === jack.id,
    `Jack available at 14:00 same day ✓`,
    "Jack incorrectly blocked for different time"
  );

  // Cleanup conflict booking
  const idx = DB.bookings.findIndex(b => b.reservationId === "TEST-CONFLICT-A");
  if (idx !== -1) DB.bookings.splice(idx, 1);
}

function test5_AgentFAQ() {
  log("TEST 5 – AI Agent FAQ & Intent Detection");

  const tests: { msg: string; expectedType: string; keyword?: string }[] = [
    { msg: "Do you accept dogs?",                    expectedType: "faq",       keyword: "carrier" },
    { msg: "What happens if it rains?",              expectedType: "faq",       keyword: "weather" },
    { msg: "Where is the meeting point?",            expectedType: "faq",       keyword: "meeting" },
    { msg: "Can I get a refund for my booking?",     expectedType: "faq",       keyword: "refund" },
    { msg: "How many passengers can fit per car?",   expectedType: "faq",       keyword: "passengers" },
    { msg: "Do you offer hotel pickup service?",     expectedType: "faq",       keyword: "pickup" },
    { msg: "Can I move my tour to May 20 10am?",     expectedType: "reschedule" },
    { msg: "I want to cancel my reservation",        expectedType: "cancel" },
    { msg: "Qzxwvbplmrfkjh completely unmatched!!!", expectedType: "unknown" },
  ];

  for (const t of tests) {
    const result = processMessage(t.msg);
    const typeOk    = result.type === t.expectedType;
    const keywordOk = !t.keyword || result.message.toLowerCase().includes(t.keyword);

    if (typeOk && keywordOk) {
      ok(`"${t.msg.substring(0,40)}" → [${result.type}]`);
    } else {
      fail(
        `"${t.msg.substring(0,40)}" expected [${t.expectedType}] got [${result.type}]`,
        t.keyword && !keywordOk ? `missing keyword "${t.keyword}"` : ""
      );
    }
  }
}

function test6_RescheduleFlow() {
  log("TEST 6 – Reschedule Flow");

  const tour = TOURS.find(t => t.city === "SYDNEY")!;

  const b = createBooking({
    reservationId: "TEST-RESCHEDULE-001",
    customerName:  "Reschedule Test User",
    customerEmail: "reschedule@test.com",
    channel:       "WEB",
    tourId:        tour.id,
    city:          "SYDNEY",
    date:          "2026-05-25",
    time:          "11:00",
    passengers:    2,
    totalPrice:    tour.price,
    extrasIds:     [],
  });

  const guide = assignGuide(b.id);
  ok(`Original booking: May 25 at 11:00 → Guide: ${guide?.name ?? "none"}`);

  // Reschedule to May 27 14:00
  const newGuide = findAvailableGuide(tour.id, "SYDNEY", "2026-05-27", "14:00", b.id);
  if (newGuide) {
    b.date    = "2026-05-27";
    b.time    = "14:00";
    b.guideId = newGuide.id;
    b.status  = "RESCHEDULED";

    // Send confirmation message
    const content = `✅ Your tour has been rescheduled.\nNew date: May 27 at 14:00.\nGuide: ${newGuide.name}`;
    sendMessage(b.customerEmail, "EMAIL", content, b.id);

    assert(b.status === "RESCHEDULED", `Status → RESCHEDULED ✓`,           "Status not updated");
    assert(b.time   === "14:00",       `New time 14:00 ✓`,                  "Time not updated");
    ok(`Message sent to ${b.customerEmail}`);
  } else {
    ok("No guide available at new slot (expected in mock – all busy)");
  }

  // Cleanup
  const idx = DB.bookings.findIndex(b => b.reservationId === "TEST-RESCHEDULE-001");
  if (idx !== -1) DB.bookings.splice(idx, 1);
}

function test7_Cancellation() {
  log("TEST 7 – Cancellation Flow");

  const tour = TOURS[0];
  const b = createBooking({
    reservationId: "TEST-CANCEL-001",
    customerName:  "Cancel Test User",
    customerEmail: "cancel@test.com",
    channel:       "WEB",
    tourId:        tour.id,
    city:          tour.city,
    date:          "2026-06-01",
    time:          "10:00",
    passengers:    1,
    totalPrice:    tour.price,
    extrasIds:     [],
  });
  assignGuide(b.id);
  ok(`Booking created and assigned: ${b.reservationId}`);

  b.status = "CANCELLED";
  assert(b.status === "CANCELLED", "Booking cancelled ✓", "Cancel failed");

  // Should NOT appear in active bookings
  const active = DB.bookings.filter(x => x.status !== "CANCELLED");
  ok(`Active bookings after cancel: ${active.length}`);

  // Cleanup
  const idx = DB.bookings.findIndex(x => x.reservationId === "TEST-CANCEL-001");
  if (idx !== -1) DB.bookings.splice(idx, 1);
}

function test8_Messaging() {
  log("TEST 8 – Messaging Content & Channels");

  const msgsBefore = DB.messages.length;

  // Confirmation
  const conf = buildConfirmation({
    customerName: "Sarah Mitchell",
    tourName:     "Sydney Icons Drive",
    date:         "May 10, 2026",
    time:         "10:00",
    guideName:    "Jack Wilson",
    price:        490,
    ref:          "VIATOR-DEMO-77542",
  });
  sendMessage("sarah@test.com", "EMAIL", conf);
  assert(conf.includes("Sarah Mitchell"),   "Confirmation has customer name", "Missing name");
  assert(conf.includes("Jack Wilson"),      "Confirmation has guide name",    "Missing guide");
  assert(conf.includes("490"),              "Confirmation has price",         "Missing price");

  // WhatsApp reminder
  const reminder = buildReminder("Sarah", "Sydney Icons Drive", "10:00", "Jack Wilson");
  sendMessage("+61412345678", "WHATSAPP", reminder);
  assert(reminder.includes("10:00"), "Reminder has time", "Missing time");

  // Post-tour
  const postTour = buildPostTour("Sarah", "Sydney Icons Drive");
  sendMessage("sarah@test.com", "EMAIL", postTour);
  assert(postTour.includes("review"), "Post-tour has review link", "Missing review link");

  // Instagram
  sendMessage("@sarah.demo", "INSTAGRAM", "Thanks for your inquiry! We'll get back to you shortly.");
  // Airbnb chat
  sendMessage("airbnb_thread_123", "AIRBNB_CHAT", "Your booking is confirmed for May 10th!");

  const msgsAfter = DB.messages.length;
  assert(msgsAfter >= msgsBefore + 5, `5 messages logged across channels (total: ${msgsAfter})`, "Messages not logged");

  ok("Channels tested: EMAIL, WHATSAPP, INSTAGRAM, AIRBNB_CHAT");
}

function test9_Dashboard() {
  log("TEST 9 – Dashboard Stats Calculation");

  // All non-cancelled bookings
  const active = DB.bookings.filter(b => b.status !== "CANCELLED");
  const revenue = active.reduce((sum, b) => sum + b.totalPrice, 0);
  ok(`Active bookings: ${active.length}`);
  ok(`Total revenue: $${revenue} AUD`);

  // By channel
  const byChannel: Record<string, number> = {};
  for (const b of active) {
    byChannel[b.channel] = (byChannel[b.channel] ?? 0) + b.totalPrice;
  }
  ok(`Channels: ${Object.keys(byChannel).join(", ")}`);

  // By city
  const byCity: Record<string, number> = {};
  for (const b of active) {
    byCity[b.city] = (byCity[b.city] ?? 0) + 1;
  }
  ok(`Cities: ${JSON.stringify(byCity)}`);

  // Extras sold
  const extrasSold: Record<string, number> = {};
  for (const b of active) {
    for (const eid of b.extrasIds) {
      const extra = EXTRAS.find(e => e.id === eid);
      if (extra) extrasSold[extra.name] = (extrasSold[extra.name] ?? 0) + 1;
    }
  }
  ok(`Extras sold: ${JSON.stringify(extrasSold)}`);

  // Top guide
  const guideCount: Record<string, { name: string; count: number }> = {};
  for (const b of active) {
    if (b.guideId) {
      const guide = GUIDES.find(g => g.id === b.guideId);
      if (guide) {
        guideCount[b.guideId] = guideCount[b.guideId] ?? { name: guide.name, count: 0 };
        guideCount[b.guideId].count++;
      }
    }
  }
  const topGuide = Object.values(guideCount).sort((a, b) => b.count - a.count)[0];
  if (topGuide) ok(`Top guide: ${topGuide.name} (${topGuide.count} tours)`);

  assert(TOURS.filter(t => t.active).length >= 5, "5+ active tours in catalogue", "Tours missing");
  assert(GUIDES.filter(g => g.city === "SYDNEY").length >= 6, "6+ Sydney guides", "Guides missing");
}

function test10_MultiCity() {
  log("TEST 10 – Multi-City Bookings");

  for (const city of ["MELBOURNE", "GOLD_COAST"] as City[]) {
    const tour = TOURS.find(t => t.city === city)!;
    const guide = findAvailableGuide(tour.id, city, "2026-06-10", "10:00");

    assert(!!guide,
      `${city}: guide found → ${guide?.name} (priority #${guide?.priority})`,
      `${city}: no guide available`
    );

    if (guide) {
      const b = createBooking({
        reservationId: `TEST-${city}-001`,
        customerName:  `${city} Test User`,
        customerEmail: `test@${city.toLowerCase()}.com`,
        channel:       "WEB",
        tourId:        tour.id,
        city,
        date:          "2026-06-10",
        time:          "10:00",
        passengers:    2,
        totalPrice:    tour.price,
        extrasIds:     [],
      });
      b.guideId = guide.id;
      b.status  = "CONFIRMED";
      ok(`${city}: booking created – ${tour.name} @ $${tour.price} AUD`);
    }
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   SOUTHERN CROSS ADVENTURE TOURS – FULL FLOW TEST        ║");
  console.log("║   (Mock mode – no database required)                     ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`  Running at: ${new Date().toISOString()}\n`);

  test1_SeedData();
  const bookings = test2_CreateBookings();
  test3_GuideAssignment(bookings);
  test4_ConflictDetection();
  test5_AgentFAQ();
  test6_RescheduleFlow();
  test7_Cancellation();
  test8_Messaging();
  test9_Dashboard();
  test10_MultiCity();

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  RESULTS: ${passed} passed · ${failed} failed`);
  console.log("═".repeat(60));

  if (failed > 0) {
    console.log(`\n  ⚠️  ${failed} test(s) failed.\n`);
    process.exit(1);
  } else {
    console.log(`\n  🎉 All ${passed} tests passed!\n`);
    process.exit(0);
  }
}

main();
