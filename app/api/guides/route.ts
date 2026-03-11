import { NextResponse } from "next/server";
import { store, City } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") as City | null;

  const guides = store.getGuides(city ?? undefined).map(g => ({
    ...g,
    tourDetails: g.tourIds.map(id => store.getTour(id)).filter(Boolean),
    bookingCount: store.getGuideBookingCount(g.id),
  }));

  return NextResponse.json(guides);
}
