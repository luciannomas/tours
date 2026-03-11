import { NextResponse } from "next/server";
import { store, City } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") as City | null;
  return NextResponse.json(store.getTours(city ?? undefined));
}
