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

const patchStop = z.object({
  order: z.number().int().min(0).optional(),
  type: stopTypes.optional(),
  label: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  notes: z.string().max(20000).optional().nullable(),
  checklist: z.array(checklistItem).max(40).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  image: stopImageUrlSchema.optional().nullable(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  address: z.string().max(500).optional().nullable(),
  scheduledTime: z.string().datetime().optional().nullable(),
  duration: z.number().int().min(0).max(24 * 60).optional().nullable(),
  customTypeLabel: z.string().max(100).optional().nullable(),
  customMarkerColor: z.string().max(32).optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id: stopId } = await params;
  const stop = await prisma.stop.findUnique({
    where: { id: stopId },
    include: { trip: true },
  });
  if (!stop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (stop.trip.creatorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = patchStop.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const imageVal = d.image === "" ? null : d.image;

  const data: Prisma.StopUpdateInput = {};
  if (d.order !== undefined) data.order = d.order;
  if (d.type !== undefined) data.type = d.type;
  if (d.label !== undefined) data.label = d.label;
  if (d.description !== undefined) data.description = d.description;
  if (d.notes !== undefined) data.notes = d.notes;
  if (d.checklist !== undefined) {
    data.checklist = d.checklist === null ? Prisma.JsonNull : (d.checklist as Prisma.InputJsonValue);
  }
  if (d.icon !== undefined) data.icon = d.icon;
  if (imageVal !== undefined) data.image = imageVal;
  if (d.lat !== undefined) data.lat = d.lat;
  if (d.lng !== undefined) data.lng = d.lng;
  if (d.address !== undefined) data.address = d.address;
  if (d.duration !== undefined) data.duration = d.duration;
  if (d.customTypeLabel !== undefined) data.customTypeLabel = d.customTypeLabel;
  if (d.customMarkerColor !== undefined) data.customMarkerColor = d.customMarkerColor;
  if (d.scheduledTime !== undefined) {
    data.scheduledTime = d.scheduledTime ? new Date(d.scheduledTime) : null;
  }

  const updated = await prisma.stop.update({
    where: { id: stopId },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id: stopId } = await params;
  const stop = await prisma.stop.findUnique({
    where: { id: stopId },
    include: { trip: true },
  });
  if (!stop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (stop.trip.creatorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.stop.delete({ where: { id: stopId } });
  return NextResponse.json({ ok: true });
}
