import { auth } from "@/auth";
import { TripCard } from "@/components/trip/trip-card";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      tripsCreated: {
        where: { visibility: "PUBLIC" },
        include: { stops: { orderBy: { order: "asc" }, take: 1 }, _count: { select: { members: true } } },
        take: 12,
      },
    },
  });

  if (!user) notFound();

  const isSelf = session?.user?.id === user.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt=""
            className="h-24 w-24 rounded-full border-2 border-trail/40 object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-trail/20 text-2xl font-bold text-trail">
            {(user.name ?? user.username ?? "?").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="font-display text-3xl font-bold">{user.name ?? user.username}</h1>
          <p className="font-mono text-sm text-foreground/60">@{user.username}</p>
          {user.bio ? <p className="mt-2 max-w-lg text-foreground/80">{user.bio}</p> : null}
          {isSelf ? (
            <p className="mt-2 text-xs text-foreground/50">This is your public profile.</p>
          ) : null}
        </div>
      </div>

      <h2 className="font-display mt-12 text-xl font-semibold">Public trips</h2>
      {user.tripsCreated.length === 0 ? (
        <p className="mt-4 text-sm text-foreground/60">No public trips to show yet.</p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {user.tripsCreated.map((t) => (
            <li key={t.id}>
              <TripCard trip={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
