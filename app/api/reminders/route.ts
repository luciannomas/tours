import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMessage, buildReminderMessage, buildPostTourMessage } from "@/lib/messaging";
import { MessageChannel } from "@prisma/client";

// GET: list pending reminders
export async function GET() {
  const now = new Date();
  const pending = await prisma.reminder.findMany({
    where: { sentAt: null, scheduled: { lte: now } },
    include: { booking: { include: { tour: true, guide: true } } },
  });
  return NextResponse.json(pending);
}

// POST: manually trigger reminder processing (cron endpoint)
export async function POST() {
  const now = new Date();

  const due = await prisma.reminder.findMany({
    where: { sentAt: null, scheduled: { lte: now } },
    include: {
      booking: {
        include: { tour: true, guide: true },
      },
    },
  });

  const sent: string[] = [];

  for (const reminder of due) {
    const { booking } = reminder;

    let content = "";
    if (reminder.type === "day_of") {
      content = buildReminderMessage({
        customerName: booking.customerName,
        tourName:     booking.tour.name,
        time:         booking.time,
        guideName:    booking.guide?.name ?? "your guide",
      });
    } else {
      content = buildPostTourMessage({
        customerName: booking.customerName,
        tourName:     booking.tour.name,
      });
    }

    await sendMessage({
      bookingId: booking.id,
      channel:   MessageChannel.WHATSAPP,
      to:        booking.customerEmail,
      content,
    });

    await prisma.reminder.update({
      where: { id: reminder.id },
      data: { sentAt: now },
    });

    sent.push(reminder.id);
  }

  return NextResponse.json({ processed: sent.length, ids: sent });
}
