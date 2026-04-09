import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy for Google Places Nearby Search (server-side key).
 * GET /api/places/nearby?lat=..&lng=..&radius=1500
 */
export async function GET(req: NextRequest) {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) {
    return NextResponse.json({ results: [], hint: "Set GOOGLE_PLACES_API_KEY in .env" });
  }

  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Math.min(Number(searchParams.get("radius")) || 2000, 50000);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "Invalid lat/lng" }, { status: 400 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("type", "tourist_attraction");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  const data = (await res.json()) as {
    results?: Array<{ name?: string; place_id?: string; geometry?: { location?: { lat: number; lng: number } } }>;
    status?: string;
  };

  if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    return NextResponse.json(
      { error: "Places API error", status: data.status },
      { status: 502 },
    );
  }

  const results = (data.results ?? []).slice(0, 8).map((r) => ({
    name: r.name ?? "Place",
    placeId: r.place_id,
    lat: r.geometry?.location?.lat,
    lng: r.geometry?.location?.lng,
  }));

  return NextResponse.json({ results });
}
