import { NextResponse } from "next/server";
import { store, Channel, City, Status } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";

function enrichBooking(b: ReturnType<typeof store.getBooking>) {
  if (!b) return null;
  return {
    ...b,
    tour:   store.getTour(b.tourId),
    guide:  b.guideId ? store.getGuide(b.guideId) : null,
    extras: b.extrasIds.map(id => store.getExtra(id)).filter(Boolean),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookings = store.getBookings({
    status:  searchParams.get("status")  as Status  | undefined ?? undefined,
    city:    searchParams.get("city")    as City    | undefined ?? undefined,
    channel: searchParams.get("channel") as Channel | undefined ?? undefined,
  });
  return NextResponse.json(bookings.map(b => enrichBooking(b)));
}

export async function POST(request: Request) {
  const body = await request.json();
  const { customerName, customerEmail, customerCountry, channel, tourId, city, date, time, passengers, extrasIds = [] } = body;

  if (!customerName || !tourId || !city || !date || !time) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const tour = store.getTour(tourId);
  if (!tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });

  const extrasTotal = extrasIds.reduce((sum: number, id: string) => {
    const extra = store.getExtra(id);
    return sum + (extra?.price ?? 0);
  }, 0);

  const totalPrice    = tour.price * (passengers ?? 1) + extrasTotal;
  const reservationId = `WEB-${uuidv4().substring(0, 8).toUpperCase()}`;

  // Find available guide
  const guide = store.findAvailableGuide(tourId, city as City, date, time);

  const booking = store.createBooking({
    reservationId, customerName,
    customerEmail: customerEmail ?? "",
    customerCountry: customerCountry ?? "",
    channel: (channel ?? "WEB") as Channel,
    tourId, guideId: guide?.id ?? null,
    city: city as City, date, time,
    passengers: passengers ?? 1, totalPrice,
    status: guide ? "CONFIRMED" : "PENDING",
    extrasIds, notes: "",
  });

  // Log confirmation message
  if (customerEmail) {
    store.addMessage({
      bookingId: booking.id, channel: "EMAIL",
      direction: "outbound", sender: "bot@southerncross-demo.com", receiver: customerEmail,
      content: `✅ Booking Confirmed! Hi ${customerName}! Tour: ${tour.name} · ${date} ${time} · Guide: ${guide?.name ?? "TBD"} · $${totalPrice} AUD · Ref: ${reservationId}`,
    });
  }

  return NextResponse.json(enrichBooking(booking), { status: 201 });
}
