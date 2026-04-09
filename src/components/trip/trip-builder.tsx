"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Copy, GripVertical, Link2, MessageCircle, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { TripBuilderSkeleton } from "@/components/trip/trip-builder-skeleton";
import { MapContextMenu, type MapContextMenuState } from "@/components/trip/map-context-menu";
import { TripMap, type MapStop } from "@/components/trip/trip-map";
import { TripStopEditor, type EditableStop } from "@/components/trip/trip-stop-editor";
import { STOP_TYPE_OPTIONS, stopTypeLabel } from "@/lib/trip-stop-types";
import type { StopType } from "@prisma/client";

type TripStop = {
  id: string;
  order: number;
  type: StopType;
  label: string;
  lat: number;
  lng: number;
  description: string | null;
  notes: string | null;
  checklist: unknown;
  icon: string | null;
  image: string | null;
  address: string | null;
  scheduledTime: string | null;
  duration: number | null;
  customTypeLabel: string | null;
  customMarkerColor: string | null;
};

function SortableTimelineStop({
  stop,
  selected,
  onSelect,
  onRemove,
  isLast,
}: {
  stop: TripStop;
  selected: boolean;
  onSelect: () => void;
  onRemove: (id: string) => void;
  isLast: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stop.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
  };
  const typeStr = stopTypeLabel(stop.type, stop.customTypeLabel);

  return (
    <div ref={setNodeRef} style={style} className="relative flex gap-0 pl-1">
      <div className="flex w-8 shrink-0 flex-col items-center">
        <div
          className={`z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold shadow-card transition-colors ${
            selected
              ? "border-trail bg-trail text-snow"
              : "border-terrain-stone/50 bg-snow text-terrain-night dark:border-terrain-surface/60 dark:bg-terrain-deep dark:text-terrain-mist"
          }`}
        >
          {stop.order + 1}
        </div>
        {!isLast ? (
          <div className="min-h-[1.25rem] w-px flex-1 bg-gradient-to-b from-trail/40 to-terrain-stone/30 dark:from-trail/30 dark:to-terrain-surface/40" />
        ) : null}
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className={`mb-3 min-w-0 flex-1 cursor-pointer rounded-xl border px-3 py-2.5 text-left transition-all hover:shadow-card ${
          selected
            ? "border-trail/60 bg-trail/5 shadow-card dark:bg-trail/10"
            : "border-terrain-stone/40 bg-snow/80 dark:border-terrain-surface/50 dark:bg-terrain-deep/80"
        }`}
      >
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="touch-none mt-0.5 shrink-0 text-foreground/40 hover:text-foreground"
            aria-label="Réorganiser"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{stop.label}</p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-trail/90">{typeStr}</p>
            <p className="mt-1 font-mono text-[10px] text-foreground/50">
              {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md p-1.5 text-red-600 hover:bg-red-500/10"
            aria-label="Supprimer"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(stop.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TripBuilder({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("Untitled adventure");
  const [scheduledAt, setScheduledAt] = useState(
    format(new Date(Date.now() + 86400000), "yyyy-MM-dd'T'HH:mm"),
  );
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [stops, setStops] = useState<TripStop[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [mapContextMenu, setMapContextMenu] = useState<MapContextMenuState | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftCustomLabel, setDraftCustomLabel] = useState("");
  const [draftIcon, setDraftIcon] = useState("");
  const [draftType, setDraftType] = useState<StopType>("MEETUP");
  const [saving, setSaving] = useState(false);
  const [routeStats, setRouteStats] = useState<{ km: number; min: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = useCallback(async () => {
    const res = await fetch(`/api/trips/${tripId}`);
    if (!res.ok) return;
    const trip = await res.json();
    setTitle(trip.title);
    setShareToken(trip.shareToken ?? null);
    setScheduledAt(format(new Date(trip.scheduledAt), "yyyy-MM-dd'T'HH:mm"));
    const list = (trip.stops as TripStop[]).sort((a, b) => a.order - b.order);
    setStops(list);
    setSelectedStopId((prev) => {
      if (prev && list.some((s) => s.id === prev)) return prev;
      return list[0]?.id ?? null;
    });
  }, [tripId]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const orderedStops = useMemo(
    () => [...stops].sort((a, b) => a.order - b.order),
    [stops],
  );

  useEffect(() => {
    if (orderedStops.length < 2) {
      setRouteStats(null);
      return;
    }
    const coordinates = orderedStops.map((s) => [s.lng, s.lat] as [number, number]);
    void fetch("/api/directions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { distance?: number; duration?: number } | null) => {
        if (data && typeof data.distance === "number" && typeof data.duration === "number") {
          setRouteStats({
            km: data.distance / 1000,
            min: Math.round(data.duration / 60),
          });
        } else {
          setRouteStats(null);
        }
      })
      .catch(() => setRouteStats(null));
  }, [orderedStops]);

  const mapStops: MapStop[] = useMemo(
    () =>
      orderedStops.map((s) => ({
        id: s.id,
        order: s.order,
        lat: s.lat,
        lng: s.lng,
        label: s.label,
        image: s.image,
      })),
    [orderedStops],
  );

  const pendingPlacementKind = pending
    ? stops.length === 0
      ? ("start" as const)
      : ("waypoint" as const)
    : null;

  const selectedStop = useMemo(
    () => stops.find((s) => s.id === selectedStopId) ?? null,
    [stops, selectedStopId],
  );

  const editableStop: EditableStop | null = selectedStop
    ? {
        id: selectedStop.id,
        type: selectedStop.type,
        label: selectedStop.label,
        description: selectedStop.description,
        notes: selectedStop.notes,
        checklist: selectedStop.checklist,
        icon: selectedStop.icon,
        image: selectedStop.image,
        lat: selectedStop.lat,
        lng: selectedStop.lng,
        scheduledTime: selectedStop.scheduledTime,
        duration: selectedStop.duration,
        customTypeLabel: selectedStop.customTypeLabel,
      }
    : null;

  const nearbyLatLng = pending ?? (selectedStop ? { lat: selectedStop.lat, lng: selectedStop.lng } : null);

  const shareUrl =
    typeof window !== "undefined" && shareToken
      ? `${window.location.origin.replace(/\/$/, "")}/t/${shareToken}`
      : "";

  const copyShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const whatsappHref = shareUrl
    ? `https://wa.me/?text=${encodeURIComponent(`Rejoins le trip : ${shareUrl}`)}`
    : "#";

  const saveMeta = async () => {
    setSaving(true);
    try {
      await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          scheduledAt: new Date(scheduledAt).toISOString(),
          status: "PUBLISHED",
        }),
      });
      router.push(`/trip/${tripId}`);
    } finally {
      setSaving(false);
    }
  };

  const beginCreateStopAt = (lng: number, lat: number) => {
    setPending({ lng, lat });
    setDraftLabel(stops.length === 0 ? "Départ" : `Étape ${stops.length + 1}`);
    setDraftCustomLabel("");
    setDraftIcon("");
    setDraftType(stops.length === 0 ? "MEETUP" : "HIKE");
    setSelectedStopId(null);
  };

  const addStop = async () => {
    if (!pending) return;
    const res = await fetch(`/api/trips/${tripId}/stops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order: stops.length,
        type: draftType,
        label: draftLabel.trim() || "Nouvel arrêt",
        lat: pending.lat,
        lng: pending.lng,
        customTypeLabel: draftType === "CUSTOM" ? draftCustomLabel.trim() || null : null,
        icon: draftType === "CUSTOM" ? draftIcon.trim() || null : null,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setPending(null);
      await load();
      setSelectedStopId(created.id);
    }
  };

  const removeStop = async (id: string) => {
    await fetch(`/api/stops/${id}`, { method: "DELETE" });
    setSelectedStopId((prev) => (prev === id ? null : prev));
    await load();
  };

  const optimizeStopOrder = async () => {
    setOptimizing(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/optimize-stops`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        window.alert(data.error ?? "Impossible d’optimiser l’ordre des arrêts.");
        return;
      }
      await load();
    } finally {
      setOptimizing(false);
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = stops.findIndex((s) => s.id === active.id);
    const newIndex = stops.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(stops, oldIndex, newIndex).map((s, i) => ({ ...s, order: i }));
    setStops(next);
    await Promise.all(
      next.map((s) =>
        fetch(`/api/stops/${s.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: s.order }),
        }),
      ),
    );
  };

  const saveStopPatch = async (payload: Record<string, unknown>) => {
    if (!selectedStopId) return;
    const res = await fetch(`/api/stops/${selectedStopId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) await load();
  };

  if (loading) {
    return <TripBuilderSkeleton />;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
      <aside className="flex max-h-[calc(100vh-5rem)] w-full flex-col gap-4 overflow-y-auto border-b border-terrain-stone/40 p-4 lg:w-[min(440px,42%)] lg:shrink-0 lg:border-b-0 lg:border-r dark:border-terrain-surface/50">
        <div>
          <h1 className="font-display text-2xl font-bold">Créer votre trip</h1>
          <p className="mt-1 text-sm text-foreground/70">
            Clic droit sur la carte pour créer un arrêt, ou sur un marqueur pour le supprimer. Timeline
            interactive — glissez pour réordonner.
          </p>
        </div>

        {shareToken ? (
          <Card className="space-y-2 p-3 text-sm">
            <p className="font-medium text-foreground/80">Partage</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" className="gap-1.5 text-xs" onClick={() => void copyShare()}>
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copié" : "Copier le lien"}
              </Button>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <Button type="button" variant="outline" className="gap-1.5 text-xs">
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </Button>
              </a>
            </div>
            <p className="break-all font-mono text-[10px] text-foreground/50">{shareUrl || "…"}</p>
          </Card>
        ) : null}

        <Input label="Nom du trip" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input
          label="Date prévue"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              void fetch(`/api/trips/${tripId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title,
                  scheduledAt: new Date(scheduledAt).toISOString(),
                }),
              })
            }
          >
            Brouillon
          </Button>
          <Link href={`/trip/${tripId}`}>
            <Button variant="ghost" className="gap-1 text-sm">
              <Link2 className="h-4 w-4" />
              Aperçu
            </Button>
          </Link>
        </div>

        {orderedStops.length >= 2 ? (
          <Card className="border-trail/20 bg-trail/5 p-3 text-sm dark:bg-trail/10">
            {routeStats ? (
              <p className="font-mono text-terrain-night/85 dark:text-terrain-mist/90">
                Itinéraire (réseau routier / sentiers) ≈ {routeStats.km.toFixed(1)} km · ~{routeStats.min}{" "}
                min
              </p>
            ) : (
              <p className="text-terrain-night/80 dark:text-terrain-mist/85">
                Définissez <span className="font-mono">OPENROUTESERVICE_API_KEY</span> pour calculer la
                distance et afficher l’itinéraire calé sur les routes et sentiers (OpenStreetMap).
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full gap-2 text-xs"
              loading={optimizing}
              disabled={optimizing}
              onClick={() => void optimizeStopOrder()}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Optimiser l’ordre des étapes (distance)
            </Button>
            <p className="mt-2 text-[11px] leading-snug text-foreground/55">
              Le tracé sur la carte suit le réseau piéton / vélo / route selon le profil ORS. L’optimisation
              garde le 1er arrêt comme départ et réordonne la suite pour réduire la distance totale.
            </p>
          </Card>
        ) : null}

        <div className="relative">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">Étapes</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col">
                {stops.map((s, idx) => (
                  <SortableTimelineStop
                    key={s.id}
                    stop={s}
                    selected={selectedStopId === s.id}
                    onSelect={() => setSelectedStopId(s.id)}
                    onRemove={(id) => void removeStop(id)}
                    isLast={idx === stops.length - 1}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {stops.length === 0 ? (
            <p className="text-sm text-foreground/60">
              Clic droit sur la carte → « Créer un arrêt ici », puis validez dans le panneau.
            </p>
          ) : null}
        </div>

        {pending ? (
          <Card className="space-y-3 border-trail/30 p-4 shadow-card">
            <p className="text-sm font-semibold">Nouvel arrêt</p>
            <p className="font-mono text-xs text-foreground/60">
              {pending.lat.toFixed(5)}, {pending.lng.toFixed(5)}
            </p>
            <Input label="Nom" value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)} />
            <div>
              <p className="mb-2 text-sm font-medium">Type</p>
              <div className="flex flex-wrap gap-1.5">
                {STOP_TYPE_OPTIONS.map((o) => (
                  <Chip
                    key={o.type}
                    active={draftType === o.type}
                    onClick={() => setDraftType(o.type)}
                  >
                    {o.label}
                  </Chip>
                ))}
              </div>
            </div>
            {draftType === "CUSTOM" ? (
              <>
                <Input
                  label="Type personnalisé"
                  value={draftCustomLabel}
                  onChange={(e) => setDraftCustomLabel(e.target.value)}
                />
                <Input label="Emoji" value={draftIcon} onChange={(e) => setDraftIcon(e.target.value)} maxLength={8} />
              </>
            ) : null}
            <div className="flex gap-2">
              <Button type="button" onClick={() => void addStop()}>
                Ajouter
              </Button>
              <Button type="button" variant="ghost" onClick={() => setPending(null)}>
                Annuler
              </Button>
            </div>
          </Card>
        ) : (
          <TripStopEditor stop={editableStop} onSaveStop={saveStopPatch} nearbyLatLng={nearbyLatLng} />
        )}

        <Button variant="primary" loading={saving} onClick={() => void saveMeta()}>
          Publier et voir le trip
        </Button>
      </aside>

      <div className="relative min-h-[55vh] flex-1 lg:sticky lg:top-16 lg:min-h-[calc(100vh-4rem)] lg:flex-1">
        <div className="h-full min-h-[420px] p-2 lg:absolute lg:inset-0 lg:min-h-0 lg:p-4">
          <div className="relative h-full overflow-hidden rounded-2xl border border-terrain-stone/30 shadow-elevated dark:border-terrain-surface/40">
            <TripMap
              stops={mapStops}
              selectedStopId={selectedStopId}
              onStopMarkerClick={(id) => setSelectedStopId(id)}
              onMapContextMenu={(e) =>
                setMapContextMenu({
                  kind: "map",
                  clientX: e.clientX,
                  clientY: e.clientY,
                  lng: e.lng,
                  lat: e.lat,
                })
              }
              onStopContextMenu={(id, ev) => {
                setSelectedStopId(id);
                setMapContextMenu({
                  kind: "stop",
                  clientX: ev.clientX,
                  clientY: ev.clientY,
                  stopId: id,
                });
              }}
              pendingPin={pending}
              isPlacing={false}
              placementKind={pendingPlacementKind}
              pendingMarkerLabel={pending ? String(stops.length + 1) : null}
            />
            <MapContextMenu
              state={mapContextMenu}
              onClose={() => setMapContextMenu(null)}
              onCreateStopHere={(lng, lat) => beginCreateStopAt(lng, lat)}
              onDeleteStop={(id) => void removeStop(id)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
