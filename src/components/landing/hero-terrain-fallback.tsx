/** Static placeholder while WebGL chunk loads — keeps layout stable for LCP. */
export function HeroTerrainFallback() {
  return (
    <div
      className="absolute inset-0 min-h-[520px] bg-gradient-to-br from-terrain-surface/90 via-terrain-night/80 to-terrain-night dark:from-terrain-night dark:via-terrain-deep dark:to-terrain-night"
      aria-hidden
    />
  );
}
