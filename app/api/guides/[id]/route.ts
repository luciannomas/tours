import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guide = store.getGuide(id);
  if (!guide) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tourDetails = guide.tourIds
    .map((tid) => store.getTour(tid))
    .filter(Boolean);

  const bookings = store.getBookings()
    .filter((b) => b.guideId === id && b.status !== "CANCELLED")
    .map((b) => ({
      ...b,
      tour: store.getTour(b.tourId),
      extras: b.extrasIds.map((eid) => store.getExtra(eid)).filter(Boolean),
    }));

  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);

  const upcoming = bookings
    .filter((b) => b.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return NextResponse.json({
    ...guide,
    tourDetails,
    bookingCount: bookings.length,
    totalRevenue,
    upcoming,
  });
}
