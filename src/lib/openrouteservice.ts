/**
 * OpenRouteService helpers — profile from env, request bodies.
 * Docs: https://giscience.github.io/openrouteservice/api-reference/
 *
 * Base URL (priorité) : `OPENROUTESERVICE_BASE_URL` → sinon `OPENROUTESERVICE_HOSTPORT` en
 * `http://{hostport}/ors` (Render privé) → sinon `https://api.openrouteservice.org`.
 * Self-hosted (e.g. Docker ORS sur `http://localhost:8080/ors`) — API key optional unless
 * `OPENROUTESERVICE_REQUIRE_API_KEY=true`. Public API always requires a key unless
 * `OPENROUTESERVICE_SKIP_API_KEY=true` (testing only).
 */

const ALLOWED_PROFILES = new Set([
  "foot-walking",
  "foot-hiking",
  "cycling-regular",
  "cycling-road",
  "cycling-electric",
  "driving-car",
]);

const DEFAULT_PUBLIC_ORS = "https://api.openrouteservice.org";

export function getOrsProfile(): string {
  const p = process.env.OPENROUTESERVICE_PROFILE?.trim() || "foot-walking";
  return ALLOWED_PROFILES.has(p) ? p : "foot-walking";
}

/** Normalized base URL (no trailing slash). */
export function getOrsBaseUrl(): string {
  const explicit = process.env.OPENROUTESERVICE_BASE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }
  const hostport = process.env.OPENROUTESERVICE_HOSTPORT?.trim();
  if (hostport) {
    return `http://${hostport}/ors`.replace(/\/+$/, "");
  }
  return DEFAULT_PUBLIC_ORS;
}

/**
 * Public hosted API requires an API key. Self-hosted instances do not, unless forced.
 */
export function orsApiKeyRequired(): boolean {
  if (process.env.OPENROUTESERVICE_SKIP_API_KEY === "true") return false;
  if (process.env.OPENROUTESERVICE_REQUIRE_API_KEY === "true") return true;
  try {
    const u = new URL(getOrsBaseUrl());
    return u.hostname === "api.openrouteservice.org";
  } catch {
    return true;
  }
}

/** Endpoint `/json` — geometry is often an encoded polyline in `routes[0].geometry`. */
export function getOrsDirectionsUrl(profile: string): string {
  const base = getOrsBaseUrl();
  return `${base}/v2/directions/${profile}/json`;
}

export function getOrsMatrixUrl(profile: string): string {
  const base = getOrsBaseUrl();
  return `${base}/v2/matrix/${profile}/json`;
}

/** Corps standard — pas de `geometry_format` (API publique ORS 9.x). */
export function buildDirectionsBody(coordinates: [number, number][]): Record<string, unknown> {
  return {
    coordinates,
    preference: "fastest",
    units: "m",
  };
}

export type OrsFetchAuthVariant = {
  name: string;
  url: string;
  headers: Record<string, string>;
};

/**
 * Auth variants: sans clé (self-hosted sans auth), puis `api_key` en query, puis Bearer.
 */
export function getOrsFetchVariants(urlBaseWithoutQuery: string, apiKey: string): OrsFetchAuthVariant[] {
  const baseHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (!apiKey) {
    return [{ name: "no_auth", url: urlBaseWithoutQuery, headers: baseHeaders }];
  }
  return [
    {
      name: "query_api_key",
      url: `${urlBaseWithoutQuery}?api_key=${encodeURIComponent(apiKey)}`,
      headers: baseHeaders,
    },
    {
      name: "authorization_bearer",
      url: urlBaseWithoutQuery,
      headers: {
        ...baseHeaders,
        Authorization: `Bearer ${apiKey}`,
      },
    },
  ];
}

/**
 * POST JSON vers ORS en essayant chaque variante d’auth (no key → query → Bearer).
 */
export async function fetchOrsPostJson(
  urlBase: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; text: string } | { ok: false; status: number; text: string }> {
  const variants = getOrsFetchVariants(urlBase, apiKey);
  let lastStatus = 0;
  let lastText = "";
  for (const auth of variants) {
    const res = await fetch(auth.url, {
      method: "POST",
      headers: auth.headers,
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (res.ok) return { ok: true, text };
    lastStatus = res.status;
    lastText = text;
  }
  return { ok: false, status: lastStatus, text: lastText };
}

/**
 * Ordre de visite : plus proche voisin depuis l’arrêt 0 (départ fixe).
 * Retourne une permutation des indices 0..n-1.
 */
export function nearestNeighborOrder(distances: (number | null)[][], n: number): number[] {
  const order: number[] = [0];
  const visited = new Set<number>([0]);
  let current = 0;

  while (order.length < n) {
    let best = -1;
    let bestD = Infinity;
    for (let j = 0; j < n; j++) {
      if (visited.has(j)) continue;
      const d = distances[current]?.[j];
      if (d == null || !Number.isFinite(d) || d < 0) continue;
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    if (best < 0) {
      for (let j = 0; j < n; j++) {
        if (!visited.has(j)) {
          best = j;
          break;
        }
      }
    }
    if (best < 0) break;
    visited.add(best);
    order.push(best);
    current = best;
  }

  return order;
}
