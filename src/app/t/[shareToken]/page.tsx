import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { SharePageClient } from "./share-client";

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const trip = await prisma.trip.findUnique({
    where: { shareToken },
    include: {
      creator: { select: { name: true, image: true, username: true } },
      stops: { orderBy: { order: "asc" } },
    },
  });
  if (!trip) notFound();

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const shareUrl = `${base.replace(/\/$/, "")}/t/${shareToken}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <SharePageClient
        trip={{
          id: trip.id,
          title: trip.title,
          description: trip.description,
          scheduledAt: trip.scheduledAt.toISOString(),
          shareUrl,
          creatorName: trip.creator.name,
          stops: trip.stops.map((s) => ({
            id: s.id,
            label: s.label,
            order: s.order,
            lat: s.lat,
            lng: s.lng,
          })),
        }}
      />
      <p className="mt-8 text-center text-xs text-foreground/50">
        {format(new Date(trip.scheduledAt), "PPP p")}
      </p>
    </div>
  );
}
