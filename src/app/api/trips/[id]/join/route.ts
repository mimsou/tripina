import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import { notifyJoinRequest } from "@/lib/notify-realtime";
import { NextResponse } from "next/server";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id: tripId } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { creator: true },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (trip.creatorId === userId) {
    return NextResponse.json({ error: "You are the organiser" }, { status: 400 });
  }

  const existing = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId } },
  });
  if (existing) {
    return NextResponse.json(existing);
  }

  const member = await prisma.tripMember.create({
    data: {
      tripId,
      userId,
      role: "MEMBER",
      status: "PENDING",
    },
  });

  const requester = await prisma.user.findUnique({ where: { id: userId } });

  await notifyJoinRequest({
    creatorId: trip.creatorId,
    tripId: trip.id,
    tripTitle: trip.title,
    requesterName: requester?.name ?? requester?.email ?? null,
    requesterId: userId,
    memberId: member.id,
  });

  return NextResponse.json(member);
}
