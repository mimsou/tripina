"use client";

import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

type JoinPayload = {
  tripId: string;
  tripTitle: string;
  requesterName: string | null;
  requesterId: string;
  memberId: string;
};

export function MemberRequestToast() {
  const { data: session, status } = useSession();
  const [toast, setToast] = useState<JoinPayload | null>(null);
  const [progress, setProgress] = useState(100);
  const socketRef = useRef<Socket | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const dismiss = useCallback(() => {
    setToast(null);
    setProgress(100);
    if (dismissTimer.current) clearInterval(dismissTimer.current);
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    const base = process.env.NEXT_PUBLIC_REALTIME_URL;
    if (!base) return;

    let cancelled = false;

    const run = async () => {
      const res = await fetch("/api/realtime/session");
      if (!res.ok || cancelled) return;
      const { sessionToken } = (await res.json()) as { sessionToken: string };
      const socket = io(base, {
        auth: { sessionToken },
        transports: ["websocket"],
      });
      socketRef.current = socket;
      socket.on("join:request", (payload: JoinPayload) => {
        setToast(payload);
        setProgress(100);
        if (dismissTimer.current) clearInterval(dismissTimer.current);
        const start = Date.now();
        const duration = 10000;
        dismissTimer.current = setInterval(() => {
          const p = 100 - ((Date.now() - start) / duration) * 100;
          setProgress(Math.max(0, p));
          if (p <= 0) {
            dismiss();
          }
        }, 100);
      });
    };

    void run();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
      if (dismissTimer.current) clearInterval(dismissTimer.current);
    };
  }, [status, session?.user, dismiss]);

  const respond = async (approve: boolean) => {
    if (!toast) return;
    await fetch(`/api/trips/${toast.tripId}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: toast.memberId,
        status: approve ? "APPROVED" : "REJECTED",
      }),
    });
    dismiss();
  };

  if (!toast) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] w-[min(100vw-2rem,380px)] overflow-hidden rounded-lg border border-terrain-stone/40 bg-snow shadow-elevated dark:border-terrain-surface/50 dark:bg-terrain-deep"
      role="status"
    >
      <div
        className="h-1 bg-trail transition-[width] duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />
      <div className="p-4">
        <p className="text-sm font-semibold">Join request</p>
        <p className="mt-1 text-sm text-foreground/80">
          {toast.requesterName ?? "Someone"} wants to join “{toast.tripTitle}”.
        </p>
        <div className="mt-3 flex gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => void respond(true)}>
            <Check className="h-4 w-4" />
            Accept
          </Button>
          <Button type="button" variant="ghost" className="flex-1" onClick={() => void respond(false)}>
            <X className="h-4 w-4" />
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
