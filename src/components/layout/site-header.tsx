"use client";

import { Mountain, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { data: session } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-terrain-stone/30 bg-terrain-mist/80 backdrop-blur-md dark:border-terrain-surface/40 dark:bg-terrain-night/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-display flex items-center gap-2 text-lg font-bold tracking-tight">
          <Mountain className="h-7 w-7 text-trail" aria-hidden />
          TripHive
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium">
          <Link href="/explore" className="hidden text-foreground/80 hover:text-trail sm:inline">
            Explore
          </Link>
          {session?.user ? (
            <>
              {session.user.username ? (
                <Link
                  href={`/profile/${session.user.username}`}
                  className="hidden text-foreground/80 hover:text-trail sm:inline"
                >
                  Profile
                </Link>
              ) : null}
              <Link href="/dashboard" className="hidden text-foreground/80 hover:text-trail sm:inline">
                Dashboard
              </Link>
              <Link href="/trip/new">
                <Button variant="primary" className="!py-2 !text-xs">
                  New trip
                </Button>
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-md px-2 py-1 text-foreground/70 hover:bg-terrain-stone/30 dark:hover:bg-terrain-surface/50"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/auth/signin">
              <Button variant="outline" className="!py-2 !text-xs">
                Sign in
              </Button>
            </Link>
          )}
          {mounted ? (
            <button
              type="button"
              aria-label="Toggle theme"
              className="rounded-full p-2 text-foreground/80 hover:bg-terrain-stone/40 dark:hover:bg-terrain-surface/60"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            >
              {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
