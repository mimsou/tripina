"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function NewTripClient() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled adventure",
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
      if (res.status === 401) {
        router.replace("/auth/signin?callbackUrl=/trip/new");
        return;
      }
      if (res.ok) {
        const t = (await res.json()) as { id: string };
        router.replace(`/trip/${t.id}/edit`);
      }
    };
    void run();
  }, [router]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-trail border-t-transparent"
        aria-hidden
      />
      <p className="text-sm text-foreground/70">Preparing your map…</p>
    </div>
  );
}
