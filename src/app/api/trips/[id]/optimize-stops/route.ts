import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/api-auth";
import {
  fetchOrsPostJson,
  getOrsMatrixUrl,
  getOrsProfile,
  nearestNeighborOrder,
  orsApiKeyRequired,
} from "@/lib/openrouteservice";
import { NextResponse } from "next/server";

type MatrixResponse = {
  distances?: (number | null)[][];
};

/**
 * Réordonne les arrêts (sauf le premier : départ) pour minimiser la distance routière
 * entre étapes consécutives (heuristique + proche voisin sur la matrice ORS).
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  const { id: tripId } = await params;

  const key = process.env.OPENROUTESERVICE_API_KEY?.trim() ?? "";
  if (orsApiKeyRequired() && !key) {
    return NextResponse.json(
      { error: "OPENROUTESERVICE_API_KEY requis pour optimiser l’ordre", code: "MISSING_ORS_KEY" },
      { status: 503 },
    );
  }

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { stops: true },
  });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (trip.creatorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sorted = [...trip.stops].sort((a, b) => a.order - b.order);
  if (sorted.length < 2) {
    return NextResponse.json({ error: "Au moins 2 arrêts sont nécessaires" }, { status: 400 });
  }

  const locations: [number, number][] = sorted.map((s) => [s.lng, s.lat]);
  const profile = getOrsProfile();

  const matrixResult = await fetchOrsPostJson(getOrsMatrixUrl(profile), key, {
    locations,
    metrics: ["distance"],
    units: "m",
  });

  if (!matrixResult.ok) {
    return NextResponse.json(
      {
        error: "Échec matrice OpenRouteService",
        status: matrixResult.status,
        detail: matrixResult.text.slice(0, 400),
      },
      { status: 502 },
    );
  }

  const rawText = matrixResult.text;

  let data: MatrixResponse;
  try {
    data = JSON.parse(rawText) as MatrixResponse;
  } catch {
    return NextResponse.json({ error: "Réponse matrice invalide" }, { status: 502 });
  }

  const dist = data.distances;
  if (!dist || !Array.isArray(dist) || dist.length !== sorted.length) {
    return NextResponse.json({ error: "Matrice de distances incomplète" }, { status: 422 });
  }

  const n = sorted.length;
  for (let i = 0; i < n; i++) {
    if (!Array.isArray(dist[i]) || dist[i]!.length !== n) {
      return NextResponse.json({ error: "Matrice de distances invalide" }, { status: 422 });
    }
  }

  const matrix: (number | null)[][] = dist.map((row) =>
    (row as (number | null)[]).map((v) => (typeof v === "number" && Number.isFinite(v) ? v : null)),
  );

  const perm = nearestNeighborOrder(matrix, n);

  await prisma.$transaction(
    perm.map((idxInSorted, newOrder) =>
      prisma.stop.update({
        where: { id: sorted[idxInSorted].id },
        data: { order: newOrder },
      }),
    ),
  );

  const updated = await prisma.stop.findMany({
    where: { tripId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ stops: updated });
}
