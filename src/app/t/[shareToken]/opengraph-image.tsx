import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "TripHive trip";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params;
  const trip = await prisma.trip.findUnique({
    where: { shareToken },
    include: { creator: { select: { name: true } } },
  });

  const title = trip?.title ?? "TripHive";
  const subtitle = trip ? new Date(trip.scheduledAt).toLocaleDateString() : "";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d1117 0%, #1c2333 50%, #111827 100%)",
          padding: 64,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            color: "#e85d04",
            fontSize: 28,
            fontWeight: 800,
          }}
        >
          TripHive
        </div>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#f5f3ee", lineHeight: 1.1, maxWidth: 900 }}>
          {title}
        </div>
        {subtitle ? (
          <div style={{ marginTop: 24, fontSize: 28, color: "#9ca3af" }}>{subtitle}</div>
        ) : null}
        {trip?.creator?.name ? (
          <div style={{ marginTop: 32, fontSize: 22, color: "#6b7280" }}>With {trip.creator.name}</div>
        ) : null}
      </div>
    ),
    { ...size },
  );
}
