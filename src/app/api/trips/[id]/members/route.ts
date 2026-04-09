import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id: tripId } = await params;

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (trip.creatorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.tripMember.findMany({
    where: { tripId },
    include: { user: { select: { id: true, name: true, image: true, username: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });
  return NextResponse.json(members);
}

const patchBody = z.object({
  memberId: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id: tripId } = await params;
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (trip.creatorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = patchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { memberId, status } = parsed.data;

  const existing = await prisma.tripMember.findUnique({
    where: { id: memberId },
  });
  if (!existing || existing.tripId !== tripId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await prisma.tripMember.update({
    where: { id: memberId },
    data: { status },
  });
  return NextResponse.json(member);
}
