import { NextRequest, NextResponse } from "next/server";
import { decodeEncodedPolyline } from "@/lib/decode-polyline";
import {
  buildDirectionsBody,
  getOrsDirectionsUrl,
  getOrsFetchVariants,
  getOrsProfile,
  orsApiKeyRequired,
} from "@/lib/openrouteservice";

const LOG = "[directions]";

function logDirections(phase: string, data: Record<string, unknown>) {
  console.log(LOG, phase, JSON.stringify(data));
}

function truncate(text: string, max = 500): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function roundCoord(n: number): number {
  return Math.round(n * 1e5) / 1e5;
}

type OrsFeature = {
  geometry?: { type: string; coordinates: unknown };
  properties?: {
    summary?: { distance?: number; duration?: number };
    segments?: Array<{ distance?: number; duration?: number }>;
  };
};

/** Réponse `/json` : `routes[0].geometry` est souvent une polyline encodée (string), pas un objet GeoJSON. */
type OrsDirectionsJson = {
  features?: OrsFeature[];
  routes?: Array<{
    geometry?: string | { type: string; coordinates: unknown };
    summary?: { distance?: number; duration?: number };
    segments?: Array<{ distance?: number; duration?: number }>;
  }>;
};

type LineStringGeom = { type: "LineString"; coordinates: [number, number][] };

function normalizeLineGeometry(geometry: { type: string; coordinates: unknown }): LineStringGeom | null {
  if (geometry.type === "LineString" && Array.isArray(geometry.coordinates)) {
    return geometry as LineStringGeom;
  }
  if (geometry.type === "MultiLineString" && Array.isArray(geometry.coordinates)) {
    const lines = geometry.coordinates as [number, number][][];
    const merged: [number, number][] = lines.flat();
    if (merged.length < 2) return null;
    return { type: "LineString", coordinates: merged };
  }
  return null;
}

/**
 * Appelle OpenRouteService (query api_key puis Authorization Bearer, corps standard puis minimal).
 */
async function fetchOrsDirections(
  profile: string,
  apiKey: string,
  coordinates: [number, number][],
): Promise<{ ok: true; text: string } | { ok: false; status: number; text: string }> {
  const urlBase = getOrsDirectionsUrl(profile);
  const authModes = getOrsFetchVariants(urlBase, apiKey);

  const bodies: { name: string; body: Record<string, unknown> }[] = [
    { name: "standard", body: buildDirectionsBody(coordinates) },
    { name: "minimal", body: { coordinates } },
  ];

  let lastStatus = 0;
  let lastText = "";

  for (const auth of authModes) {
    for (const { name: bodyName, body } of bodies) {
      const started = Date.now();
      const res = await fetch(auth.url, {
        method: "POST",
        headers: auth.headers,
        body: JSON.stringify(body),
      });
      const text = await res.text();
      const ms = Date.now() - started;

      if (res.ok) {
        logDirections("ors_ok", {
          auth: auth.name,
          body: bodyName,
          profile,
          ms,
          responseBytes: text.length,
        });
        return { ok: true, text };
      }

      lastStatus = res.status;
      lastText = text;

      let parsedPreview: unknown;
      try {
        parsedPreview = JSON.parse(text);
      } catch {
        parsedPreview = null;
      }

      logDirections("ors_attempt_failed", {
        auth: auth.name,
        body: bodyName,
        profile,
        status: res.status,
        ms,
        detail:
          typeof parsedPreview === "object" && parsedPreview !== null && "error" in parsedPreview
            ? truncate(JSON.stringify((parsedPreview as { error?: unknown }).error ?? parsedPreview))
            : truncate(text),
      });
    }
  }

  logDirections("ors_all_attempts_failed", {
    profile,
    lastStatus,
    lastDetail: truncate(lastText, 800),
  });

  return { ok: false, status: lastStatus, text: lastText };
}

/**
 * Proxies OpenRouteService — itinéraire sur le réseau (chemins / routes OSM).
 * POST body: `{ "coordinates": [[lng, lat], ...] }` (min 2 points).
 */
export async function POST(req: NextRequest) {
  const key = process.env.OPENROUTESERVICE_API_KEY?.trim() ?? "";
  if (orsApiKeyRequired() && !key) {
    logDirections("missing_api_key", {});
    return NextResponse.json(
      { error: "OPENROUTESERVICE_API_KEY is not set", code: "MISSING_ORS_KEY" },
      { status: 503 },
    );
  }

  let body: { coordinates?: [number, number][] };
  try {
    body = await req.json();
  } catch {
    logDirections("invalid_json", {});
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const coordinates = body.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    logDirections("bad_coordinates_count", { count: Array.isArray(coordinates) ? coordinates.length : 0 });
    return NextResponse.json({ error: "Need at least 2 [lng, lat] coordinates" }, { status: 400 });
  }

  for (const c of coordinates) {
    if (
      !Array.isArray(c) ||
      c.length !== 2 ||
      typeof c[0] !== "number" ||
      typeof c[1] !== "number" ||
      !Number.isFinite(c[0]) ||
      !Number.isFinite(c[1])
    ) {
      logDirections("invalid_coordinate_pair", {});
      return NextResponse.json({ error: "Invalid coordinate pair" }, { status: 400 });
    }
  }

  const profile = getOrsProfile();
  logDirections("request", {
    profile,
    waypointCount: coordinates.length,
    apiKeyPresent: key.length > 0,
    apiKeyLength: key.length,
    firstCoord: [roundCoord(coordinates[0]![0]), roundCoord(coordinates[0]![1])],
    lastCoord: [
      roundCoord(coordinates[coordinates.length - 1]![0]),
      roundCoord(coordinates[coordinates.length - 1]![1]),
    ],
  });

  const t0 = Date.now();
  const result = await fetchOrsDirections(profile, key, coordinates);
  const totalMs = Date.now() - t0;

  if (!result.ok) {
    logDirections("response_502", {
      totalMs,
      orsStatus: result.status,
      note: "Voir les logs ors_attempt_failed et ors_all_attempts_failed ci-dessus",
    });
    let parsed: { error?: { message?: string }; message?: string } | null = null;
    try {
      parsed = JSON.parse(result.text) as { error?: { message?: string }; message?: string };
    } catch {
      /* ignore */
    }
    const orsMsg =
      parsed?.error?.message ?? parsed?.message ?? result.text.slice(0, 800);
    return NextResponse.json(
      {
        error: "OpenRouteService request failed",
        orsStatus: result.status,
        detail: orsMsg,
        hint:
          result.status === 401 || result.status === 403
            ? "Vérifiez OPENROUTESERVICE_API_KEY sur https://openrouteservice.org/dev/#/home"
            : result.status === 429
              ? "Quota ORS dépassé — réessayez plus tard."
              : "Vérifiez le profil OPENROUTESERVICE_PROFILE et que les coordonnées sont [longitude, latitude].",
      },
      { status: 502 },
    );
  }

  let data: OrsDirectionsJson;
  try {
    data = JSON.parse(result.text) as OrsDirectionsJson;
  } catch (e) {
    logDirections("parse_json_failed", {
      totalMs,
      err: e instanceof Error ? e.message : String(e),
      preview: truncate(result.text, 300),
    });
    return NextResponse.json(
      { error: "Invalid response from routing service", detail: result.text.slice(0, 300) },
      { status: 502 },
    );
  }

  const route = data.routes?.[0];
  const feature = data.features?.[0];

  let geometry: LineStringGeom | null = null;

  const routeGeom = route?.geometry;
  if (typeof routeGeom === "string" && routeGeom.length > 0) {
    try {
      const coords = decodeEncodedPolyline(routeGeom);
      if (coords.length >= 2) {
        geometry = { type: "LineString", coordinates: coords };
        logDirections("geometry_decoded_polyline", { pointCount: coords.length });
      }
    } catch (e) {
      logDirections("polyline_decode_failed", { err: e instanceof Error ? e.message : String(e) });
    }
  } else if (routeGeom && typeof routeGeom === "object") {
    geometry = normalizeLineGeometry(routeGeom as { type: string; coordinates: unknown });
  }

  if (!geometry && feature?.geometry && typeof feature.geometry === "object") {
    geometry = normalizeLineGeometry(feature.geometry as { type: string; coordinates: unknown });
  }

  if (!geometry) {
    logDirections("no_geometry", {
      routes: data.routes?.length ?? 0,
      features: data.features?.length ?? 0,
      routeGeometryType: routeGeom === undefined ? "undefined" : typeof routeGeom,
    });
    return NextResponse.json({ error: "No route geometry returned" }, { status: 422 });
  }

  const summary = route?.summary ?? feature?.properties?.summary;
  let distance = summary?.distance ?? 0;
  let duration = summary?.duration ?? 0;
  const segments = route?.segments ?? feature?.properties?.segments;
  if ((!distance || !duration) && segments?.length) {
    distance = segments.reduce((a, s) => a + (s.distance ?? 0), 0);
    duration = segments.reduce((a, s) => a + (s.duration ?? 0), 0);
  }

  logDirections("success", {
    totalMs,
    profile,
    distanceM: distance,
    durationS: duration,
  });

  return NextResponse.json({
    geometry,
    distance,
    duration,
    profile,
  });
}
