export function TripBuilderSkeleton() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-4 p-4 lg:flex-row">
      <div className="flex w-full flex-col gap-4 lg:w-[42%] lg:max-w-xl lg:shrink-0">
        <div className="h-8 w-48 animate-pulse rounded-md bg-terrain-stone/40 dark:bg-terrain-surface/40" />
        <div className="h-10 w-full animate-pulse rounded-md bg-terrain-stone/30 dark:bg-terrain-surface/30" />
        <div className="h-10 w-full animate-pulse rounded-md bg-terrain-stone/30 dark:bg-terrain-surface/30" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 w-full animate-pulse rounded-lg bg-terrain-stone/25 dark:bg-terrain-surface/25"
            />
          ))}
        </div>
      </div>
      <div className="min-h-[50vh] flex-1 animate-pulse rounded-lg bg-terrain-stone/20 dark:bg-terrain-surface/20 lg:min-h-0" />
    </div>
  );
}
