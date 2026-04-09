import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const bodySchema = z.object({
  tripId: z.string(),
  emails: z.array(z.string().email()).min(1).max(20),
});

export async function POST(req: Request) {
  const userId = await requireUserId();
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { tripId, emails } = parsed.data;

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip || trip.creatorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const shareUrl = `${base.replace(/\/$/, "")}/t/${trip.shareToken}`;
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json(
      { error: "Email is not configured (RESEND_API_KEY missing)." },
      { status: 503 },
    );
  }

  const resend = new Resend(resendKey);
  const from = process.env.EMAIL_FROM ?? "TripHive <onboarding@resend.dev>";

  const results = await Promise.allSettled(
    emails.map((to) =>
      resend.emails.send({
        from,
        to,
        subject: `You're invited: ${trip.title}`,
        html: `<p>You've been invited to join <strong>${trip.title}</strong> on TripHive.</p><p><a href="${shareUrl}">Open the trip</a></p>`,
      }),
    ),
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  return NextResponse.json({ sent: emails.length - failed, failed });
}
