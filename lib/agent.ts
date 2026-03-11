/**
 * AI Agent logic (simulated - no external LLM required for demo)
 * Handles FAQ matching and booking intent detection
 */

import { prisma } from "./db";

interface AgentResponse {
  type: "faq" | "reschedule" | "cancel" | "booking_info" | "unknown";
  message: string;
  data?: Record<string, unknown>;
}

// Simple keyword-based intent detection (no LLM needed for demo)
function detectIntent(message: string): string {
  const lower = message.toLowerCase();

  if (/reschedul|move|change.*date|different.*day|new.*date/i.test(lower))
    return "reschedule";
  if (/\bcancel\b/i.test(lower) && !/refund policy/i.test(lower)) return "cancel";
  if (/my booking|reservation|confirm/i.test(lower)) return "booking_info";
  if (/dog|pet|animal/i.test(lower)) return "faq_pets";
  if (/rain|weather|cancell.*weather/i.test(lower)) return "faq_weather";
  if (/where|meeting point|start|pickup point/i.test(lower)) return "faq_location";
  if (/refund|money back|policy/i.test(lower)) return "faq_refund";
  if (/how many|capacity|passenger|group size/i.test(lower)) return "faq_capacity";
  if (/hotel pickup|pick me up/i.test(lower)) return "faq_pickup";
  if (/language|english|spanish/i.test(lower)) return "faq_language";

  return "unknown";
}

// Match FAQ from DB using whole-word keyword search
async function matchFaq(message: string): Promise<string | null> {
  const faqs = await prisma.faqEntry.findMany();
  const words = message.toLowerCase().split(/\W+/).filter(Boolean);

  for (const faq of faqs) {
    const keywords = faq.tags.map((t) => t.toLowerCase());
    const match = keywords.some((k) => words.includes(k));
    if (match) return faq.answer;
  }
  return null;
}

// Parse reschedule request: "Can I move my tour to April 20th at 10am?"
function parseRescheduleRequest(message: string): { date?: string; time?: string } {
  const dateMatch = message.match(
    /(\w+ \d{1,2}(?:st|nd|rd|th)?|\d{4}-\d{2}-\d{2})/i
  );
  const timeMatch = message.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{2}:\d{2})/i);

  return {
    date: dateMatch?.[1],
    time: timeMatch?.[1],
  };
}

export async function processAgentMessage(
  message: string,
  bookingId?: string
): Promise<AgentResponse> {
  const intent = detectIntent(message);

  // FAQ intents
  if (intent.startsWith("faq_") || intent === "unknown") {
    const faqAnswer = await matchFaq(message);
    if (faqAnswer) {
      return { type: "faq", message: faqAnswer };
    }
    if (intent === "unknown") {
      return {
        type: "unknown",
        message:
          "Thanks for reaching out! I'll connect you with our team shortly. In the meantime, feel free to ask about our tours, availability, or policies.",
      };
    }
  }

  // Reschedule intent
  if (intent === "reschedule" && bookingId) {
    const { date, time } = parseRescheduleRequest(message);
    return {
      type: "reschedule",
      message: date && time
        ? `I can help you reschedule! Checking availability for ${date} at ${time}...`
        : "Sure! Please provide the new date and time you'd like for your tour.",
      data: { requestedDate: date, requestedTime: time, bookingId },
    };
  }

  // Cancel intent
  if (intent === "cancel") {
    return {
      type: "cancel",
      message:
        "I understand you'd like to cancel. Our policy: full refund if cancelled 48h+ before tour, 50% within 24-48h. Shall I proceed with the cancellation?",
    };
  }

  // Booking info
  if (intent === "booking_info" && bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tour: true, guide: true, extras: { include: { extra: true } } },
    });

    if (booking) {
      const extrasText =
        booking.extras.length > 0
          ? `\nExtras: ${booking.extras.map((e) => e.extra.name).join(", ")}`
          : "";

      return {
        type: "booking_info",
        message: `📋 Your booking details:\n• Tour: ${booking.tour.name}\n• Date: ${booking.date.toDateString()} at ${booking.time}\n• Guide: ${booking.guide?.name ?? "TBD"}\n• Passengers: ${booking.passengers}\n• Total: ${booking.totalPrice} AUD${extrasText}\n• Status: ${booking.status}`,
        data: { booking },
      };
    }
  }

  const faqAnswer = await matchFaq(message);
  if (faqAnswer) return { type: "faq", message: faqAnswer };

  return {
    type: "unknown",
    message:
      "Thank you for your message! Our team will get back to you shortly.",
  };
}
