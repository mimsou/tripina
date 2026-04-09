"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyJoinRequest } from "@/lib/notify-realtime";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function requestJoinTrip(tripId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { creator: true },
  });
  if (!trip) return;

  const existing = await prisma.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId: session.user.id } },
  });
  if (existing) {
    revalidatePath(`/trip/${tripId}`);
    return;
  }

  const member = await prisma.tripMember.create({
    data: {
      tripId,
      userId: session.user.id,
      role: "MEMBER",
      status: "PENDING",
    },
  });

  const requester = await prisma.user.findUnique({ where: { id: session.user.id } });
  await notifyJoinRequest({
    creatorId: trip.creatorId,
    tripId: trip.id,
    tripTitle: trip.title,
    requesterName: requester?.name ?? requester?.email ?? null,
    requesterId: session.user.id,
    memberId: member.id,
  });

  revalidatePath(`/trip/${tripId}`);
}
