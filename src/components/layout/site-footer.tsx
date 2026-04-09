"use client";

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-terrain-stone/30 bg-terrain-stone/30 py-16 dark:border-terrain-surface/40 dark:bg-terrain-deep/50">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12] dark:opacity-[0.08]"
        aria-hidden
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="topo" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M0 40 Q20 20 40 40 T80 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-terrain-night dark:text-terrain-mist"
            />
            <path
              d="M0 60 Q30 45 60 60 T120 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-terrain-night dark:text-terrain-mist"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#topo)" />
      </svg>
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-lg font-bold">TripHive</p>
          <p className="mt-1 max-w-sm text-sm text-foreground/70">
            Built for adventurers, designed for delight.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-foreground/80">Stay in the loop</span>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
            }}
            aria-label="Newsletter"
          >
            <label htmlFor="newsletter" className="sr-only">
              Email
            </label>
            <input
              id="newsletter"
              type="email"
              placeholder="you@example.com"
              className="min-w-[200px] rounded-md border border-terrain-stone/50 bg-snow px-3 py-2 text-sm dark:border-terrain-surface/60 dark:bg-terrain-deep"
            />
            <button
              type="submit"
              className="rounded-md bg-trail px-4 py-2 text-sm font-semibold text-snow hover:bg-trail-glow"
            >
              Join
            </button>
          </form>
        </div>
        <div className="flex gap-4 text-sm text-foreground/70">
          <Link href="/explore" className="hover:text-trail">
            Explore
          </Link>
          <Link href="/auth/signin" className="hover:text-trail">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
