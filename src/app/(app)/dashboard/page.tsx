import { auth } from "@/auth";
import { TripCard } from "@/components/trip/trip-card";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const [created, joined] = await Promise.all([
    prisma.trip.findMany({
      where: { creatorId: session.user.id },
      include: { stops: { orderBy: { order: "asc" }, take: 1 }, _count: { select: { members: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.tripMember.findMany({
      where: { userId: session.user.id, NOT: { role: "CREATOR" } },
      include: {
        trip: {
          include: { stops: { orderBy: { order: "asc" }, take: 1 }, _count: { select: { members: true } } },
        },
      },
      take: 20,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-foreground/70">Your adventures and invitations.</p>
        </div>
        <Link
          href="/trip/new"
          className="rounded-pill bg-trail px-5 py-2.5 text-sm font-semibold text-snow hover:bg-trail-glow"
        >
          New trip
        </Link>
      </div>

      <section>
        <h2 className="font-display text-xl font-semibold">Trips you organise</h2>
        {created.length === 0 ? (
          <Empty label="No trips yet — start by building your first route." />
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {created.map((t) => (
              <li key={t.id}>
                <TripCard trip={t} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">Trips you joined</h2>
        {joined.length === 0 ? (
          <Empty label="When you join outings, they will appear here." />
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {joined.map((m) => (
              <li key={m.id}>
                <TripCard trip={m.trip} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-terrain-stone/50 bg-terrain-stone/20 px-6 py-12 text-center text-sm text-foreground/70 dark:border-terrain-surface/50 dark:bg-terrain-deep/40">
      {label}
    </div>
  );
}
