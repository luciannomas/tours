import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");

  const guides = await prisma.guide.findMany({
    where: {
      active: true,
      ...(city ? { city: city as never } : {}),
    },
    include: {
      guidesTours: { include: { tour: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: [{ city: "asc" }, { priority: "asc" }],
  });

  return NextResponse.json(guides);
}
