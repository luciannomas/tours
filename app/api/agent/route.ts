import { NextResponse } from "next/server";
import { store, MsgChannel, City } from "@/lib/store";

// ── Intent detection ──────────────────────────────────────────────────────────
function detectIntent(msg: string): string {
  const m = msg.toLowerCase();
  if (/reschedul|move|change.*date|different.*day|new.*date/i.test(m))        return "reschedule";
  if (/\bcancel\b/i.test(m) && !/refund policy/i.test(m))                     return "cancel";
  if (/my booking|my reservation|booking status|order status|confirm/i.test(m)) return "booking_info";
  if (/guide|guides|who.*guide|guide.*available|staff/i.test(m))               return "guides";
  if (/\btour(s)?\b|what.*offer|activities|experience|trip/i.test(m))          return "tours";
  if (/price|cost|how much|fee|rate|charge|aud|\$/i.test(m))                   return "pricing";
  if (/extra|add.?on|photoshoot|photo shoot|wine|snack|hotel pickup/i.test(m)) return "extras";
  if (/available|availability|slot|schedule|book now|when/i.test(m))           return "availability";
  if (/hello|hi |hey |good morning|good afternoon|howdy/i.test(m))             return "greeting";
  if (/thank|thanks|cheers|appreciate/i.test(m))                               return "thanks";
  return "faq";
}

function parseReschedule(msg: string) {
  const dateMatch = msg.match(/(\w+ \d{1,2}(?:st|nd|rd|th)?|\d{4}-\d{2}-\d{2})/i);
  const timeMatch = msg.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{2}:\d{2})/i);
  return { date: dateMatch?.[1], time: timeMatch?.[1] };
}

function detectCity(msg: string): City | null {
  if (/sydney/i.test(msg))                     return "SYDNEY";
  if (/melbourne/i.test(msg))                  return "MELBOURNE";
  if (/gold.?coast/i.test(msg))                return "GOLD_COAST";
  return null;
}

// ── Intent handlers ───────────────────────────────────────────────────────────
function handleGuides(msg: string): string {
  const city = detectCity(msg);
  const guides = store.getGuides(city ?? undefined).filter(g => g.active);

  if (guides.length === 0) return "We don't currently have available guides for that location. Please contact us directly.";

  const cityLabel = city ? city.replace("_", " ") : "all cities";
  const list = guides.slice(0, 4).map(g => `• ${g.name} (${g.city.replace("_", " ")})`).join("\n");
  const more = guides.length > 4 ? `\n…and ${guides.length - 4} more.` : "";

  return `We have ${guides.length} active guide${guides.length > 1 ? "s" : ""} in ${cityLabel}:\n\n${list}${more}\n\nAll guides are certified, English-speaking and assigned automatically based on availability and priority.`;
}

function handleTours(msg: string): string {
  const city = detectCity(msg);
  const tours = store.getTours(city ?? undefined);

  if (tours.length === 0) return "We don't have tours in that city yet. Try Sydney, Melbourne or Gold Coast!";

  const cityLabel = city ? `in ${city.replace("_", " ")}` : "across all cities";
  const list = tours.map(t => `• ${t.name} – ${t.duration} – $${t.price} AUD`).join("\n");

  return `Here are our tours ${cityLabel}:\n\n${list}\n\nExtras available: Hotel Pickup (+$60), Professional Photoshoot (+$250), Wine & Snacks (+$45).\n\nWould you like to book one?`;
}

function handlePricing(msg: string): string {
  const city = detectCity(msg);
  const tours = store.getTours(city ?? undefined);
  const list = tours.map(t => `• ${t.name}: $${t.price} AUD`).join("\n");
  return `Our tour prices${city ? ` in ${city.replace("_", " ")}` : ""}:\n\n${list}\n\nAll prices are per private vehicle (up to 3 passengers). Extras are charged separately.`;
}

function handleExtras(): string {
  const extras = store.getExtras();
  const list = extras.map(e => `• ${e.name}: +$${e.price} AUD`).join("\n");
  return `We offer the following add-ons:\n\n${list}\n\nExtras can be added during booking or by contacting us directly.`;
}

function handleAvailability(msg: string): string {
  const city = detectCity(msg);
  const guides = store.getGuides(city ?? undefined).filter(g => g.active);
  const cityLabel = city ? `in ${city.replace("_", " ")}` : "across Sydney, Melbourne and Gold Coast";
  return `Yes, we currently have ${guides.length} guide${guides.length !== 1 ? "s" : ""} available ${cityLabel}. Tours run daily and can be booked for your preferred date and time.\n\nWould you like to check availability for a specific date?`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { message, bookingId, channel = "WEB", customerEmail = "customer@demo.com" } = body;

  if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

  store.addMessage({
    bookingId: bookingId ?? null, channel: channel as MsgChannel,
    direction: "inbound", sender: customerEmail, receiver: "bot@southerncross-demo.com",
    content: message,
  });

  const intent = detectIntent(message);
  let type  = "faq";
  let reply = "";

  switch (intent) {
    case "greeting":
      type  = "faq";
      reply = "Hi there! 👋 Welcome to Southern Cross Adventure Tours. I'm the AI assistant — I can help you with tours, guides, bookings, pricing and more. What would you like to know?";
      break;

    case "thanks":
      type  = "faq";
      reply = "You're welcome! 😊 Feel free to ask if you need anything else. We hope to see you on tour soon!";
      break;

    case "reschedule": {
      const { date, time } = parseReschedule(message);
      type  = "reschedule";
      reply = date && time
        ? `Sure! I can help you reschedule. Checking availability for ${date} at ${time}...\n\n✅ A guide is available at that time. Your booking will be updated and you'll receive a confirmation shortly.`
        : "I'd be happy to help you reschedule! Please provide the new date and time you'd prefer.";
      break;
    }

    case "cancel":
      type  = "cancel";
      reply = "I understand you'd like to cancel. Our policy:\n\n• Full refund if cancelled 48h+ before the tour\n• 50% refund within 24–48h\n• No refund within 24h\n\nShall I proceed with the cancellation?";
      break;

    case "booking_info": {
      if (bookingId) {
        const b = store.getBooking(bookingId);
        if (b) {
          const tour   = store.getTour(b.tourId);
          const guide  = b.guideId ? store.getGuide(b.guideId) : null;
          const extras = b.extrasIds.map(id => store.getExtra(id)?.name).filter(Boolean).join(", ");
          type  = "booking_info";
          reply = `📋 Your booking details:\n• Tour: ${tour?.name}\n• Date: ${b.date} at ${b.time}\n• Guide: ${guide?.name ?? "TBD"}\n• Passengers: ${b.passengers}\n• Total: $${b.totalPrice} AUD${extras ? `\n• Extras: ${extras}` : ""}\n• Status: ${b.status}`;
          break;
        }
      }
      reply = "Please provide your reservation ID so I can look up your booking details.";
      break;
    }

    case "guides":
      type  = "faq";
      reply = handleGuides(message);
      break;

    case "tours":
      type  = "faq";
      reply = handleTours(message);
      break;

    case "pricing":
      type  = "faq";
      reply = handlePricing(message);
      break;

    case "extras":
      type  = "faq";
      reply = handleExtras();
      break;

    case "availability":
      type  = "faq";
      reply = handleAvailability(message);
      break;

    default: {
      const faqAnswer = store.matchFaq(message);
      if (faqAnswer) {
        reply = faqAnswer;
      } else {
        type  = "unknown";
        reply = "Thanks for reaching out! I can help you with tours, pricing, guides, availability, bookings and more. What would you like to know?";
      }
    }
  }

  store.addMessage({
    bookingId: bookingId ?? null, channel: channel as MsgChannel,
    direction: "outbound", sender: "bot@southerncross-demo.com", receiver: customerEmail,
    content: reply,
  });

  return NextResponse.json({ type, message: reply });
}
