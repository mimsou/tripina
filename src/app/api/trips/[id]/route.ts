import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const patchTrip = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
  visibility: z.enum(["PRIVATE", "PUBLIC", "LINK_ONLY"]).optional(),
  coverImage: z.string().url().optional().nullable(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, image: true, username: true } },
      stops: { orderBy: { order: "asc" } },
      members: {
        include: { user: { select: { id: true, name: true, image: true, username: true } } },
      },
    },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(trip);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const existing = await prisma.trip.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.creatorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = patchTrip.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const trip = await prisma.trip.update({
    where: { id },
    data: {
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    },
  });
  return NextResponse.json(trip);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id } = await params;
  const existing = await prisma.trip.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.creatorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.trip.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
