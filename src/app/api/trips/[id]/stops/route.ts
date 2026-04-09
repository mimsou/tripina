import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import { stopImageUrlSchema } from "@/lib/image-url-schema";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

const stopTypes = z.enum(["MEETUP", "REST", "CAFE", "RESTAURANT", "HIKE", "VIEWPOINT", "CUSTOM"]);

const checklistItem = z.object({
  id: z.string().min(1).max(40),
  text: z.string().min(1).max(500),
  done: z.boolean(),
});

const createStop = z.object({
  order: z.number().int().min(0),
  type: stopTypes,
  label: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  notes: z.string().max(20000).optional().nullable(),
  checklist: z.array(checklistItem).max(40).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  image: stopImageUrlSchema.optional().nullable(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().max(500).optional().nullable(),
  scheduledTime: z.string().datetime().optional().nullable(),
  duration: z.number().int().min(0).max(24 * 60).optional().nullable(),
  customTypeLabel: z.string().max(100).optional().nullable(),
  customMarkerColor: z.string().max(32).optional().nullable(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id: tripId } = await params;
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (trip.creatorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createStop.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const imageVal = d.image === "" ? null : d.image ?? null;
  const stop = await prisma.stop.create({
    data: {
      tripId,
      order: d.order,
      type: d.type,
      label: d.label,
      description: d.description ?? undefined,
      notes: d.notes ?? undefined,
      checklist:
        d.checklist === null || d.checklist === undefined
          ? undefined
          : (d.checklist as Prisma.InputJsonValue),
      icon: d.icon ?? undefined,
      image: imageVal ?? undefined,
      lat: d.lat,
      lng: d.lng,
      address: d.address ?? undefined,
      scheduledTime: d.scheduledTime ? new Date(d.scheduledTime) : undefined,
      duration: d.duration ?? undefined,
      customTypeLabel: d.customTypeLabel ?? undefined,
      customMarkerColor: d.customMarkerColor ?? undefined,
    },
  });
  return NextResponse.json(stop);
}
