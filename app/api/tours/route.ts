import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");

  const tours = await prisma.tour.findMany({
    where: {
      active: true,
      ...(city ? { city: city as never } : {}),
    },
    orderBy: [{ city: "asc" }, { price: "asc" }],
  });

  return NextResponse.json(tours);
}
