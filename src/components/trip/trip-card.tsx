import { format } from "date-fns";
import { MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Trip } from "@prisma/client";

type TripWithMeta = Trip & {
  stops: { label: string }[];
  _count: { members: number };
};

export function TripCard({ trip }: { trip: TripWithMeta }) {
  const cover = trip.coverImage;
  return (
    <Link
      href={`/trip/${trip.id}`}
      className="group block overflow-hidden rounded-lg border border-terrain-stone/40 bg-snow shadow-card transition hover:shadow-elevated dark:border-terrain-surface/50 dark:bg-terrain-deep"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-terrain-stone/40 dark:bg-terrain-surface/40">
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-terrain-deep to-terrain-night text-trail/40">
            <MapPin className="h-12 w-12" aria-hidden />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-terrain-night/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="font-display text-lg font-bold text-snow">{trip.title}</p>
          <p className="mt-1 text-xs text-snow/80">{format(new Date(trip.scheduledAt), "PPP")}</p>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2 text-xs text-foreground/70">
        <span className="line-clamp-1">{trip.stops[0]?.label ?? "Add stops"}</span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {trip._count.members}
        </span>
      </div>
    </Link>
  );
}
