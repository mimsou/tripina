"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Copy, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

type TripPayload = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  shareUrl: string;
  creatorName: string | null;
  stops: { id: string; label: string; order: number; lat: number; lng: number }[];
};

export function SharePageClient({ trip }: { trip: TripPayload }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(trip.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: trip.title, url: trip.shareUrl });
      } catch {
        /* user cancelled */
      }
    } else {
      await copy();
    }
  };

  return (
    <>
      <div className="text-center">
        <h1 className="font-display text-4xl font-black tracking-tight sm:text-5xl">{trip.title}</h1>
        {trip.description ? (
          <p className="mx-auto mt-4 max-w-xl text-foreground/75">{trip.description}</p>
        ) : null}
        <p className="mt-2 text-sm text-foreground/60">
          Hosted by {trip.creatorName ?? "TripHive organiser"}
        </p>
      </div>

      <Card className="mx-auto mt-10 max-w-md space-y-6 p-6">
        <div className="flex justify-center">
          <QRCodeSVG value={trip.shareUrl} size={160} level="M" />
        </div>
        <div className="flex gap-2">
          <input
            readOnly
            value={trip.shareUrl}
            className="min-w-0 flex-1 rounded-md border border-terrain-stone/50 bg-snow px-3 py-2 text-xs dark:border-terrain-surface/60 dark:bg-terrain-deep"
          />
          <Button type="button" variant="primary" onClick={() => void copy()} aria-label="Copy link">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={() => void nativeShare()}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </Card>

      <div className="mt-12 space-y-3">
        <h2 className="font-display text-xl font-bold">Stops</h2>
        <ol className="space-y-2">
          {trip.stops.map((s, i) => (
            <li key={s.id} className="flex gap-3 rounded-md border border-terrain-stone/40 bg-snow/60 px-4 py-3 dark:border-terrain-surface/50 dark:bg-terrain-deep/60">
              <span className="font-mono text-trail">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-medium">{s.label}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
