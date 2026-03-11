/**
 * Guide assignment logic
 * Finds the best available guide for a booking based on:
 * - City match
 * - Tour eligibility
 * - No conflicts on that date/time
 * - Priority (lower number = higher priority)
 */

import { prisma } from "./db";
import { City } from "@prisma/client";

interface AssignmentParams {
  tourId: string;
  city: City;
  date: Date;
  time: string;
  excludeBookingId?: string; // for rescheduling
}

export async function findAvailableGuide(params: AssignmentParams) {
  const { tourId, city, date, time, excludeBookingId } = params;

  // Get guides eligible for this tour & city, sorted by priority
  const eligible = await prisma.guide.findMany({
    where: {
      city,
      active: true,
      guidesTours: { some: { tourId } },
    },
    orderBy: { priority: "asc" },
  });

  // Check each guide for conflicts
  for (const guide of eligible) {
    const conflict = await prisma.booking.findFirst({
      where: {
        guideId: guide.id,
        date: {
          gte: new Date(date.toDateString()),
          lt: new Date(new Date(date.toDateString()).getTime() + 86400000),
        },
        time,
        status: { notIn: ["CANCELLED"] },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
    });

    if (!conflict) {
      return guide;
    }
  }

  return null; // No guide available
}

export async function assignGuide(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { tour: true },
  });

  if (!booking) throw new Error("Booking not found");

  const guide = await findAvailableGuide({
    tourId: booking.tourId,
    city: booking.city,
    date: booking.date,
    time: booking.time,
    excludeBookingId: bookingId,
  });

  if (!guide) return null;

  await prisma.booking.update({
    where: { id: bookingId },
    data: { guideId: guide.id, status: "CONFIRMED" },
  });

  return guide;
}
