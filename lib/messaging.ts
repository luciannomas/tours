/**
 * Messaging simulation layer
 * In production: connect to WhatsApp Cloud API, Instagram API, etc.
 * For demo: logs messages and saves to DB
 */

import { prisma } from "./db";
import { MessageChannel } from "@prisma/client";

interface SendMessageParams {
  bookingId?: string;
  channel: MessageChannel;
  to: string;
  content: string;
  sender?: string;
}

export async function sendMessage(params: SendMessageParams): Promise<{ success: boolean; messageId: string }> {
  const { bookingId, channel, to, content, sender = "SouthernCross-Bot" } = params;

  // Save to DB
  const msg = await prisma.message.create({
    data: {
      bookingId: bookingId ?? null,
      channel,
      direction: "outbound",
      content,
      sender,
      receiver: to,
    },
  });

  // Simulate channel delivery
  console.log(`📤 [${channel}] → ${to}: ${content.substring(0, 80)}...`);

  return { success: true, messageId: msg.id };
}

export async function simulateInboundMessage(params: {
  bookingId?: string;
  channel: MessageChannel;
  from: string;
  content: string;
}) {
  const { bookingId, channel, from, content } = params;

  const msg = await prisma.message.create({
    data: {
      bookingId: bookingId ?? null,
      channel,
      direction: "inbound",
      content,
      sender: from,
      receiver: "bookings@southerncross-demo.com",
    },
  });

  console.log(`📥 [${channel}] ← ${from}: ${content}`);
  return msg;
}

export function buildConfirmationMessage(booking: {
  customerName: string;
  tourName: string;
  date: string;
  time: string;
  guideName: string;
  totalPrice: number;
  reservationId: string;
}): string {
  return `✅ Booking Confirmed!\n\nHi ${booking.customerName}! Your booking is confirmed.\n\n🗺️ Tour: ${booking.tourName}\n📅 Date: ${booking.date} at ${booking.time}\n👤 Guide: ${booking.guideName}\n💰 Total: ${booking.totalPrice} AUD\n🔖 Ref: ${booking.reservationId}\n\nWe'll send you a reminder on the day. See you soon! 🚙`;
}

export function buildReminderMessage(booking: {
  customerName: string;
  tourName: string;
  time: string;
  guideName: string;
}): string {
  return `Hi ${booking.customerName}! 👋 This is a reminder for your ${booking.tourName} today at ${booking.time}. Your guide ${booking.guideName} will meet you at the confirmed meeting point.`;
}

export function buildPostTourMessage(booking: {
  customerName: string;
  tourName: string;
}): string {
  return `Hi ${booking.customerName}! We hope you enjoyed your ${booking.tourName} experience 💙\nWould you mind leaving us a review?\n👉 https://g.page/r/southerncross-demo/review`;
}

export function buildRescheduleConfirmation(booking: {
  customerName: string;
  newDate: string;
  newTime: string;
}): string {
  return `✅ Your tour has been successfully rescheduled.\nNew date: ${booking.newDate} at ${booking.newTime}.\nWe look forward to seeing you!`;
}
