import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assignGuide } from "@/lib/assignment";
import { sendMessage, buildConfirmationMessage } from "@/lib/messaging";
import { MessageChannel } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status  = searchParams.get("status");
  const city    = searchParams.get("city");
  const channel = searchParams.get("channel");

  const bookings = await prisma.booking.findMany({
    where: {
      ...(status  ? { status: status as never }  : {}),
      ...(city    ? { city: city as never }       : {}),
      ...(channel ? { channel: channel as never } : {}),
    },
    include: {
      tour:   true,
      guide:  true,
      extras: { include: { extra: true } },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  return NextResponse.json(bookings);
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    customerName,
    customerEmail,
    customerCountry,
    channel,
    tourId,
    city,
    date,
    time,
    passengers,
    extrasIds = [],
  } = body;

  // Validate required fields
  if (!customerName || !tourId || !city || !date || !time) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const tour = await prisma.tour.findUnique({ where: { id: tourId } });
  if (!tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });

  // Calculate price
  const extrasRecords = extrasIds.length > 0
    ? await prisma.extra.findMany({ where: { id: { in: extrasIds } } })
    : [];

  const extrasTotal = extrasRecords.reduce((sum: number, e: { price: number }) => sum + e.price, 0);
  const totalPrice  = tour.price * (passengers ?? 1) + extrasTotal;

  // Create booking
  const reservationId = `WEB-${uuidv4().substring(0, 8).toUpperCase()}`;

  const booking = await prisma.booking.create({
    data: {
      reservationId,
      customerName,
      customerEmail,
      customerCountry,
      channel: channel ?? "WEB",
      tourId,
      city,
      date: new Date(date),
      time,
      passengers: passengers ?? 1,
      totalPrice,
      status: "PENDING",
      extras: {
        create: extrasIds.map((extraId: string) => ({ extraId })),
      },
    },
    include: { tour: true, extras: { include: { extra: true } } },
  });

  // Auto-assign guide
  const guide = await assignGuide(booking.id);

  // Send confirmation
  if (customerEmail) {
    await sendMessage({
      bookingId: booking.id,
      channel: MessageChannel.EMAIL,
      to: customerEmail,
      content: buildConfirmationMessage({
        customerName,
        tourName: tour.name,
        date: new Date(date).toDateString(),
        time,
        guideName: guide?.name ?? "TBD",
        totalPrice,
        reservationId,
      }),
    });
  }

  return NextResponse.json({ ...booking, guide }, { status: 201 });
}
