import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import { dbUnavailableResponse, isDatabaseConnectionError } from "@/lib/prisma-errors";
import { uniqueSlug } from "@/lib/slug";
import { NextResponse } from "next/server";
import { z } from "zod";

const createTrip = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  scheduledAt: z.string().datetime(),
  visibility: z.enum(["PRIVATE", "PUBLIC", "LINK_ONLY"]).optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") ?? "mine";

  try {
    if (scope === "public") {
      const trips = await prisma.trip.findMany({
        where: { visibility: "PUBLIC", status: "PUBLISHED" },
        include: {
          creator: { select: { name: true, image: true, username: true } },
          stops: { orderBy: { order: "asc" }, take: 1 },
          _count: { select: { members: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 24,
      });
      return NextResponse.json(trips);
    }

    const userId = await requireUserId();
    const trips = await prisma.trip.findMany({
      where: { creatorId: userId },
      include: {
        stops: { orderBy: { order: "asc" }, take: 1 },
        _count: { select: { members: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(trips);
  } catch (e) {
    if (isDatabaseConnectionError(e)) {
      return dbUnavailableResponse();
    }
    throw e;
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = createTrip.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { title, description, scheduledAt, visibility } = parsed.data;
    const slug = uniqueSlug(title);
    const trip = await prisma.trip.create({
      data: {
        title,
        description,
        scheduledAt: new Date(scheduledAt),
        visibility: visibility ?? "PRIVATE",
        slug,
        creatorId: userId,
        members: {
          create: {
            userId,
            role: "CREATOR",
            status: "APPROVED",
          },
        },
      },
    });
    return NextResponse.json(trip);
  } catch (e) {
    if (isDatabaseConnectionError(e)) {
      return dbUnavailableResponse();
    }
    throw e;
  }
}
