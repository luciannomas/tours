import { NextResponse } from "next/server";
import { processAgentMessage } from "@/lib/agent";
import { simulateInboundMessage, sendMessage } from "@/lib/messaging";
import { MessageChannel } from "@prisma/client";

export async function POST(request: Request) {
  const body = await request.json();
  const { message, bookingId, channel = "WEB", customerEmail } = body;

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Save inbound message
  await simulateInboundMessage({
    bookingId,
    channel: channel as MessageChannel,
    from:    customerEmail ?? "customer@demo.com",
    content: message,
  });

  // Process with agent
  const response = await processAgentMessage(message, bookingId);

  // Save outbound response
  await sendMessage({
    bookingId,
    channel: channel as MessageChannel,
    to:      customerEmail ?? "customer@demo.com",
    content: response.message,
  });

  return NextResponse.json(response);
}
