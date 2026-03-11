import { NextResponse } from "next/server";
import { store } from "@/lib/store";

function enrich(b: ReturnType<typeof store.getBooking>) {
  if (!b) return null;
  return {
    ...b,
    tour:     store.getTour(b.tourId),
    guide:    b.guideId ? store.getGuide(b.guideId) : null,
    extras:   b.extrasIds.map(id => store.getExtra(id)).filter(Boolean),
    messages: store.getMessages(b.id),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const b = store.getBooking(id);
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(enrich(b));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const booking = store.getBooking(id);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { date, time, status } = body;

  // Reschedule flow
  if (date || time) {
    const newDate = date ?? booking.date;
    const newTime = time ?? booking.time;

    const guide = store.findAvailableGuide(booking.tourId, booking.city, newDate, newTime, id);
    if (!guide) {
      return NextResponse.json({ error: "No guide available for the requested date/time" }, { status: 409 });
    }

    const updated = store.updateBooking(id, {
      date: newDate, time: newTime,
      guideId: guide.id, status: "RESCHEDULED",
    });

    store.addMessage({
      bookingId: id, channel: "EMAIL",
      direction: "outbound", sender: "bot@southerncross-demo.com",
      receiver: booking.customerEmail,
      content: `✅ Your tour has been rescheduled.\nNew date: ${newDate} at ${newTime}.\nGuide: ${guide.name}`,
    });

    return NextResponse.json(enrich(updated));
  }

  // Status update only
  const updated = store.updateBooking(id, { ...(status ? { status } : {}) });
  return NextResponse.json(enrich(updated));
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  store.updateBooking(id, { status: "CANCELLED" });
  return NextResponse.json({ message: "Booking cancelled" });
}
