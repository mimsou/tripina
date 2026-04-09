import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  tripId: z.string(),
  phone: z.string().min(6).max(32).optional(),
});

/** Returns a wa.me deeplink; optional Twilio send can be added when env is set. */
export async function POST(req: Request) {
  const userId = await requireUserId();
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { tripId, phone } = parsed.data;

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip || trip.creatorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const shareUrl = `${base.replace(/\/$/, "")}/t/${trip.shareToken}`;
  const message = `Join my TripHive outing: ${trip.title} — ${shareUrl}`;
  const text = encodeURIComponent(message);
  const waLink = phone
    ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${text}`
    : `https://wa.me/?text=${text}`;

  return NextResponse.json({ waLink, shareUrl, message });
}
