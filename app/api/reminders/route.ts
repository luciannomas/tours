import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  return NextResponse.json(store.getDueReminders());
}

export async function POST() {
  const due = store.getDueReminders();
  const sent: string[] = [];

  for (const reminder of due) {
    const booking = store.getBooking(reminder.bookingId);
    if (!booking) continue;

    store.addMessage({
      bookingId: reminder.bookingId, channel: "WHATSAPP",
      direction: "outbound", sender: "bot@southerncross-demo.com",
      receiver: booking.customerEmail, content: reminder.content,
    });

    store.markReminderSent(reminder.id);
    sent.push(reminder.id);
  }

  return NextResponse.json({ processed: sent.length, ids: sent });
}
