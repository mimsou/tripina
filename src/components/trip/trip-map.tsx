"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { OPENFREEMAP_STYLE_URL } from "@/lib/map-config";

export type MapStop = {
  id: string;
  order: number;
  lat: number;
  lng: number;
  label: string;
  image?: string | null;
};

export type MapPlacementKind = "start" | "waypoint";

type Props = {
  stops: MapStop[];
  selectedStopId?: string | null;
  onStopMarkerClick?: (stopId: string) => void;
  /** Clic droit sur le fond de carte (hors marqueurs) */
  onMapContextMenu?: (e: { lng: number; lat: number; clientX: number; clientY: number }) => void;
  /** Clic droit sur un arrêt existant */
  onStopContextMenu?: (stopId: string, e: { clientX: number; clientY: number }) => void;
  interactive?: boolean;
  pendingPin?: { lat: number; lng: number } | null;
  isPlacing?: boolean;
  placementKind?: MapPlacementKind | null;
  pendingMarkerLabel?: string | null;
};

function buildStopMarkerElement(
  s: MapStop,
  selected: boolean,
  onSelect: () => void,
  onCtx: (ev: MouseEvent) => void,
): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute(
    "aria-label",
    `Arrêt ${s.order + 1}: ${s.label}${s.image ? " — image" : ""}`,
  );

  const outer = document.createElement("div");
  outer.className = "map-stop-bubble-outer pointer-events-auto";

  const ring = document.createElement("div");
  ring.className = [
    "map-stop-bubble-ring flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 bg-terrain-night text-xs font-bold text-snow shadow-elevated transition-transform duration-300 ease-out",
    selected
      ? "scale-110 border-trail ring-2 ring-trail ring-offset-2 ring-offset-terrain-mist dark:ring-offset-terrain-night"
      : "border-trail/85 hover:scale-105",
  ].join(" ");

  const imageUrl = s.image?.trim();
  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = "";
    img.className = "h-full w-full object-cover";
    img.loading = "lazy";
    img.draggable = false;
    img.onerror = () => {
      ring.textContent = "";
      const fallback = document.createElement("span");
      fallback.className = "text-sm font-bold";
      fallback.textContent = String(s.order + 1);
      ring.appendChild(fallback);
    };
    ring.appendChild(img);
  } else {
    ring.textContent = String(s.order + 1);
  }

  outer.appendChild(ring);
  btn.appendChild(outer);

  btn.className =
    "relative block cursor-pointer border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-trail focus-visible:ring-offset-2";

  btn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    onSelect();
  });
  btn.addEventListener("contextmenu", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    onCtx(ev);
  });

  return btn;
}

function sortStopsByOrder(stops: MapStop[]): MapStop[] {
  return [...stops].sort((a, b) => a.order - b.order);
}

function removeRouteLayer(map: maplibregl.Map) {
  if (map.getLayer("route-line")) map.removeLayer("route-line");
  if (map.getSource("route")) map.removeSource("route");
}

export function TripMap({
  stops,
  selectedStopId,
  onStopMarkerClick,
  onMapContextMenu,
  onStopContextMenu,
  interactive = true,
  pendingPin = null,
  isPlacing = false,
  placementKind = null,
  pendingMarkerLabel = null,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const pendingMarkerRef = useRef<maplibregl.Marker | null>(null);
  const onStopClickRef = useRef(onStopMarkerClick);
  const onMapCtxRef = useRef(onMapContextMenu);
  const onStopCtxRef = useRef(onStopContextMenu);
  onStopClickRef.current = onStopMarkerClick;
  onMapCtxRef.current = onMapContextMenu;
  onStopCtxRef.current = onStopContextMenu;
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLE_URL,
      center: [-3.7038, 40.4168],
      zoom: 4,
      pitch: 45,
      bearing: -12,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    const ctxHandler = (e: maplibregl.MapMouseEvent) => {
      e.preventDefault();
      const oe = e.originalEvent;
      onMapCtxRef.current?.({
        lng: e.lngLat.lng,
        lat: e.lngLat.lat,
        clientX: oe.clientX,
        clientY: oe.clientY,
      });
    };
    if (interactive) {
      map.on("contextmenu", ctxHandler);
    }

    map.once("load", () => setMapReady(true));

    return () => {
      if (interactive) {
        map.off("contextmenu", ctxHandler);
      }
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [interactive]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    let alive = true;
    const ac = new AbortController();

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const ordered = sortStopsByOrder(stops);

    ordered.forEach((s) => {
      const el = buildStopMarkerElement(
        s,
        selectedStopId === s.id,
        () => onStopClickRef.current?.(s.id),
        (ev) =>
          onStopCtxRef.current?.(s.id, {
            clientX: ev.clientX,
            clientY: ev.clientY,
          }),
      );
      const marker = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([s.lng, s.lat]).addTo(map);
      markersRef.current.push(marker);
    });

    /** Points dans l’ordre timeline + optionnellement le futur arrêt (prévisualisation). */
    const routeCoords: [number, number][] = ordered.map((s) => [s.lng, s.lat]);
    if (pendingPin && routeCoords.length >= 1) {
      routeCoords.push([pendingPin.lng, pendingPin.lat]);
    }

    const fitToStops = () => {
      const m = mapRef.current;
      if (!m || !alive) return;
      const pts: [number, number][] = ordered.map((s) => [s.lng, s.lat]);
      if (pendingPin) pts.push([pendingPin.lng, pendingPin.lat]);
      if (pts.length === 0) return;
      if (pts.length === 1) {
        m.flyTo({ center: pts[0], zoom: 12, essential: true });
        return;
      }
      const b = new maplibregl.LngLatBounds();
      pts.forEach((p) => b.extend(p));
      m.fitBounds(b, { padding: 72, maxZoom: 14, duration: 750 });
    };

    if (routeCoords.length < 2) {
      removeRouteLayer(map);
      fitToStops();
      return () => {
        alive = false;
        ac.abort();
      };
    }

    void (async () => {
      let geometry: GeoJSON.LineString | null = null;
      let usedFallback = false;

      try {
        const res = await fetch("/api/directions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coordinates: routeCoords }),
          signal: ac.signal,
        });
        if (res.ok) {
          const data = (await res.json()) as { geometry?: GeoJSON.LineString };
          if (data.geometry?.type === "LineString" && Array.isArray(data.geometry.coordinates)) {
            geometry = data.geometry;
          }
        } else {
          usedFallback = true;
        }
      } catch {
        usedFallback = true;
      }

      if (!alive) return;

      if (!geometry) {
        usedFallback = true;
        geometry = {
          type: "LineString",
          coordinates: routeCoords,
        };
      }

      const m = mapRef.current;
      if (!m || !alive) return;

      removeRouteLayer(m);

      const feature: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {},
        geometry,
      };

      m.addSource("route", {
        type: "geojson",
        data: feature,
      });
      m.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: usedFallback
          ? {
              "line-color": "#e85d04",
              "line-width": 3,
              "line-opacity": 0.72,
              "line-dasharray": [1.8, 2.4],
            }
          : {
              "line-color": "#e85d04",
              "line-width": 4,
              "line-opacity": 0.88,
            },
      });

      fitToStops();
    })();

    return () => {
      alive = false;
      ac.abort();
    };
  }, [stops, mapReady, selectedStopId, pendingPin]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    pendingMarkerRef.current?.remove();
    pendingMarkerRef.current = null;
    if (!pendingPin) return;

    const kind = placementKind ?? "waypoint";
    const wrap = document.createElement("div");
    wrap.className = "relative flex h-[52px] w-[52px] items-center justify-center";
    const ping = document.createElement("div");
    ping.className =
      kind === "start"
        ? "absolute inset-0 animate-ping rounded-full bg-emerald-500/35"
        : "absolute inset-0 animate-ping rounded-full bg-trail/40";
    const disc = document.createElement("div");
    disc.className =
      kind === "start"
        ? "relative z-[1] flex h-11 w-11 items-center justify-center rounded-full border-2 border-emerald-300 bg-emerald-600 text-sm font-bold text-white shadow-elevated ring-2 ring-emerald-400/40"
        : "relative z-[1] flex h-11 w-11 items-center justify-center rounded-full border-2 border-trail/90 bg-trail text-sm font-bold text-snow shadow-elevated ring-2 ring-trail/30";
    disc.textContent =
      pendingMarkerLabel?.trim() ||
      (kind === "start" ? "S" : "·");
    wrap.appendChild(ping);
    wrap.appendChild(disc);

    const marker = new maplibregl.Marker({ element: wrap, anchor: "center" })
      .setLngLat([pendingPin.lng, pendingPin.lat])
      .addTo(map);
    pendingMarkerRef.current = marker;
    return () => {
      marker.remove();
      pendingMarkerRef.current = null;
    };
  }, [pendingPin, mapReady, placementKind, pendingMarkerLabel]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !pendingPin) return;
    map.easeTo({
      center: [pendingPin.lng, pendingPin.lat],
      zoom: Math.max(map.getZoom(), 13),
      duration: 550,
      essential: true,
    });
  }, [pendingPin, mapReady]);

  return (
    <div
      className={`relative h-full min-h-[320px] w-full overflow-hidden rounded-lg border transition-[box-shadow,ring] duration-300 ease-out ${
        isPlacing
          ? "cursor-crosshair border-trail/50 shadow-elevated ring-2 ring-trail/35 dark:border-trail/40"
          : "border-terrain-stone/40 dark:border-terrain-surface/50"
      }`}
      role="presentation"
    >
      {isPlacing ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 z-[2] rounded-[inherit] bg-[radial-gradient(ellipse_80%_60%_at_50%_45%,transparent_0%,rgba(15,23,42,0.06)_100%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_45%,transparent_0%,rgba(0,0,0,0.2)_100%)]"
            aria-hidden
          />
          <div
            className="animate-map-placement-breath pointer-events-none absolute inset-0 z-[2] rounded-[inherit] ring-1 ring-inset ring-trail/25"
            aria-hidden
          />
        </>
      ) : null}
      <div
        ref={containerRef}
        className={`relative z-0 h-full min-h-[320px] w-full rounded-[inherit] ${isPlacing ? "cursor-crosshair" : ""}`}
      />
    </div>
  );
}
