import { NextResponse } from "next/server";
import { store, MsgChannel } from "@/lib/store";

function detectIntent(msg: string): string {
  if (/reschedul|move|change.*date|different.*day|new.*date/i.test(msg)) return "reschedule";
  if (/\bcancel\b/i.test(msg) && !/refund policy/i.test(msg)) return "cancel";
  if (/my booking|reservation|confirm/i.test(msg)) return "booking_info";
  return "faq";
}

function parseReschedule(msg: string) {
  const dateMatch = msg.match(/(\w+ \d{1,2}(?:st|nd|rd|th)?|\d{4}-\d{2}-\d{2})/i);
  const timeMatch = msg.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)|\d{2}:\d{2})/i);
  return { date: dateMatch?.[1], time: timeMatch?.[1] };
}

export async function POST(request: Request) {
  const body = await request.json();
  const { message, bookingId, channel = "WEB", customerEmail = "customer@demo.com" } = body;

  if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

  // Save inbound
  store.addMessage({
    bookingId: bookingId ?? null, channel: channel as MsgChannel,
    direction: "inbound", sender: customerEmail, receiver: "bot@southerncross-demo.com",
    content: message,
  });

  const intent = detectIntent(message);
  let type = "unknown";
  let reply = "Thank you for your message! Our team will get back to you shortly.";

  if (intent === "reschedule") {
    const { date, time } = parseReschedule(message);
    type  = "reschedule";
    reply = date && time
      ? `I can help you reschedule! Checking availability for ${date} at ${time}...`
      : "Sure! Please provide the new date and time you'd like for your tour.";
  } else if (intent === "cancel") {
    type  = "cancel";
    reply = "I understand you'd like to cancel. Our policy: full refund 48h+ before tour, 50% within 24-48h. Shall I proceed with the cancellation?";
  } else if (intent === "booking_info" && bookingId) {
    const b = store.getBooking(bookingId);
    if (b) {
      const tour  = store.getTour(b.tourId);
      const guide = b.guideId ? store.getGuide(b.guideId) : null;
      const extras = b.extrasIds.map(id => store.getExtra(id)?.name).filter(Boolean).join(", ");
      type  = "booking_info";
      reply = `📋 Your booking:\n• Tour: ${tour?.name}\n• Date: ${b.date} at ${b.time}\n• Guide: ${guide?.name ?? "TBD"}\n• Passengers: ${b.passengers}\n• Total: $${b.totalPrice} AUD${extras ? `\n• Extras: ${extras}` : ""}\n• Status: ${b.status}`;
    }
  } else {
    const faqAnswer = store.matchFaq(message);
    if (faqAnswer) { type = "faq"; reply = faqAnswer; }
  }

  // Save outbound
  store.addMessage({
    bookingId: bookingId ?? null, channel: channel as MsgChannel,
    direction: "outbound", sender: "bot@southerncross-demo.com", receiver: customerEmail,
    content: reply,
  });

  return NextResponse.json({ type, message: reply });
}
