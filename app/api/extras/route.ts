import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const extras = await prisma.extra.findMany({ where: { active: true } });
  return NextResponse.json(extras);
}
