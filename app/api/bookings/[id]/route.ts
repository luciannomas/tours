import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findAvailableGuide } from "@/lib/assignment";
import { sendMessage, buildRescheduleConfirmation } from "@/lib/messaging";
import { MessageChannel } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      tour:      true,
      guide:     true,
      extras:    { include: { extra: true } },
      messages:  { orderBy: { createdAt: "desc" }, take: 20 },
      reminders: true,
    },
  });

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(booking);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { date, time, status } = body;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { tour: true, guide: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Reschedule flow
  if (date || time) {
    const newDate = date ? new Date(date) : booking.date;
    const newTime = time ?? booking.time;

    const guide = await findAvailableGuide({
      tourId: booking.tourId,
      city:   booking.city,
      date:   newDate,
      time:   newTime,
      excludeBookingId: id,
    });

    if (!guide) {
      return NextResponse.json(
        { error: "No guide available for the requested date/time" },
        { status: 409 }
      );
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        date:    newDate,
        time:    newTime,
        guideId: guide.id,
        status:  "RESCHEDULED",
      },
      include: { tour: true, guide: true },
    });

    // Send reschedule confirmation
    await sendMessage({
      bookingId: id,
      channel:   MessageChannel.EMAIL,
      to:        booking.customerEmail,
      content:   buildRescheduleConfirmation({
        customerName: booking.customerName,
        newDate:      newDate.toDateString(),
        newTime,
      }),
    });

    return NextResponse.json(updated);
  }

  // Status update only
  const updated = await prisma.booking.update({
    where: { id },
    data: { ...(status ? { status } : {}) },
    include: { tour: true, guide: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  return NextResponse.json({ message: "Booking cancelled" });
}
