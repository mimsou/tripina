"use client";

import { TripCard } from "@/components/trip/trip-card";
import { useQuery } from "@tanstack/react-query";

type TripRow = Parameters<typeof TripCard>[0]["trip"];

type FetchError = Error & { hint?: string };

export default function ExplorePage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["public-trips"],
    queryFn: async () => {
      const res = await fetch("/api/trips?scope=public");
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { hint?: string; error?: string };
        const err = new Error(body.error ?? `HTTP ${res.status}`) as FetchError;
        err.hint = body.hint;
        throw err;
      }
      return res.json() as Promise<TripRow[]>;
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-black tracking-tight">Explore</h1>
      <p className="mt-2 max-w-xl text-foreground/70">
        Public trips from the community — discover your next trail, road trip, or city night out.
      </p>

      {isLoading ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-lg bg-terrain-stone/40 dark:bg-terrain-surface/40"
            />
          ))}
        </div>
      ) : null}

      {isError ? (
        <div className="mt-10 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-6 text-sm text-red-800 dark:text-red-200">
          <p className="font-medium">Could not load trips.</p>
          {(error as FetchError)?.hint ? (
            <p className="mt-2 text-xs leading-relaxed opacity-90">{(error as FetchError).hint}</p>
          ) : (
            <p className="mt-2 text-xs opacity-90">{(error as Error)?.message}</p>
          )}
          <button
            type="button"
            className="mt-3 text-sm underline underline-offset-2"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {data && data.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-terrain-stone/50 px-6 py-16 text-center text-foreground/70 dark:border-terrain-surface/50">
          No public trips yet. Be the first to publish one from the builder.
        </div>
      ) : null}

      {data && data.length > 0 ? (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((t) => (
            <li key={t.id}>
              <TripCard trip={t} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
