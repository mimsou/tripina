import { auth } from "@/auth";
import { requestJoinTrip } from "@/actions/trip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true, username: true } },
      stops: { orderBy: { order: "asc" } },
      members: {
        include: { user: { select: { name: true, image: true } } },
      },
    },
  });
  if (!trip) notFound();

  const isCreator = session?.user?.id === trip.creatorId;
  const membership = session?.user?.id
    ? await prisma.tripMember.findUnique({
        where: { tripId_userId: { tripId: id, userId: session.user.id } },
      })
    : null;
  const canView =
    trip.visibility === "PUBLIC" ||
    isCreator ||
    membership?.status === "APPROVED";

  if (!canView && trip.visibility === "PRIVATE") {
    if (!session?.user?.id) redirect("/auth/signin");
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-trail">{trip.status}</p>
        <h1 className="font-display mt-2 text-4xl font-bold">{trip.title}</h1>
        <p className="mt-2 text-foreground/70">
          {format(new Date(trip.scheduledAt), "PPP p")} · Organised by {trip.creator.name ?? "host"}
        </p>
      </div>
      {trip.description ? <p className="text-lg leading-relaxed">{trip.description}</p> : null}

      <Card className="divide-y divide-terrain-stone/30 p-0 dark:divide-terrain-surface/50">
        {trip.stops.map((s, i) => (
          <div key={s.id} className="flex gap-4 px-4 py-4">
            <span className="font-mono text-sm text-trail">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="font-medium">{s.label}</p>
              {s.description ? <p className="mt-1 text-sm text-foreground/70">{s.description}</p> : null}
            </div>
          </div>
        ))}
      </Card>

      <div className="flex flex-wrap gap-3">
        {isCreator ? (
          <Link href={`/trip/${id}/edit`}>
            <Button variant="primary">Edit trip</Button>
          </Link>
        ) : null}
        <Link href={`/t/${trip.shareToken}`}>
          <Button variant="outline">Share page</Button>
        </Link>
        {session?.user && !isCreator && !membership ? (
          <form action={requestJoinTrip.bind(null, id)}>
            <Button type="submit" variant="secondary">
              Request to join
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
