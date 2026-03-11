import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const now   = new Date();
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));
  const year  = parseInt(searchParams.get("year")  ?? String(now.getFullYear()));

  const stats = store.getDashboardStats(month, year);

  return NextResponse.json({ period: { month, year }, ...stats });
}
