import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const year  = parseInt(searchParams.get("year")  ?? String(new Date().getFullYear()));

  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0, 23, 59, 59);

  const [bookings, allBookings] = await Promise.all([
    prisma.booking.findMany({
      where: { date: { gte: start, lte: end }, status: { not: "CANCELLED" } },
      include: {
        tour:   true,
        guide:  true,
        extras: { include: { extra: true } },
      },
    }),
    prisma.booking.findMany({
      where: { status: { not: "CANCELLED" } },
      include: { tour: true, guide: true },
    }),
  ]);

  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);

  // Revenue by channel
  const byChannel = bookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.channel] = (acc[b.channel] ?? 0) + b.totalPrice;
    return acc;
  }, {});

  const channelPercent = Object.entries(byChannel).map(([channel, revenue]) => ({
    channel,
    revenue,
    percent: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
  }));

  // Extras sold
  const allExtras: Record<string, number> = {};
  for (const b of bookings) {
    for (const be of b.extras) {
      allExtras[be.extra.name] = (allExtras[be.extra.name] ?? 0) + 1;
    }
  }

  // Top guide
  const guideCount = allBookings.reduce<Record<string, { name: string; count: number }>>(
    (acc, b) => {
      if (b.guide) {
        const key = b.guide.id;
        acc[key] = acc[key] ?? { name: b.guide.name, count: 0 };
        acc[key].count++;
      }
      return acc;
    },
    {}
  );

  const topGuide = Object.values(guideCount).sort((a, b) => b.count - a.count)[0] ?? null;

  // Tours by city
  const byCity = bookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.city] = (acc[b.city] ?? 0) + 1;
    return acc;
  }, {});

  // Daily revenue for chart
  const dailyRevenue: Record<string, number> = {};
  for (const b of bookings) {
    const day = b.date.toISOString().split("T")[0];
    dailyRevenue[day] = (dailyRevenue[day] ?? 0) + b.totalPrice;
  }

  const dailyChart = Object.entries(dailyRevenue)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    period: { month, year },
    totalTours:   bookings.length,
    totalRevenue,
    channelBreakdown: channelPercent,
    extrasSold:   allExtras,
    topGuide,
    byCity,
    dailyChart,
  });
}
