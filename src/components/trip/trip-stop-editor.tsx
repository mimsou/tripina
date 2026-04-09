"use client";

import type { StopType } from "@prisma/client";
import { ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ChecklistItem } from "@/lib/checklist";
import { newChecklistItem, normalizeChecklist } from "@/lib/checklist";
import { STOP_TYPE_OPTIONS } from "@/lib/trip-stop-types";

export type EditableStop = {
  id: string;
  type: StopType;
  label: string;
  description: string | null;
  notes: string | null;
  checklist: unknown;
  icon: string | null;
  image: string | null;
  lat: number;
  lng: number;
  scheduledTime: string | null;
  duration: number | null;
  customTypeLabel: string | null;
};

type Props = {
  stop: EditableStop | null;
  onSaveStop: (payload: Record<string, unknown>) => Promise<void>;
  nearbyLatLng: { lat: number; lng: number } | null;
};

export function TripStopEditor({ stop, onSaveStop, nearbyLatLng }: Props) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState("");
  const [type, setType] = useState<StopType>("MEETUP");
  const [customLabel, setCustomLabel] = useState("");
  const [icon, setIcon] = useState("");
  const [scheduledLocal, setScheduledLocal] = useState("");
  const [durationMin, setDurationMin] = useState<number | "">("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [nearby, setNearby] = useState<{ name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFromStop = useCallback(() => {
    if (!stop) return;
    setLabel(stop.label);
    setDescription(stop.description ?? "");
    setNotes(stop.notes ?? "");
    setImage(stop.image ?? "");
    setType(stop.type);
    setCustomLabel(stop.customTypeLabel ?? "");
    setIcon(stop.icon ?? "");
    setChecklist(normalizeChecklist(stop.checklist));
    if (stop.scheduledTime) {
      try {
        const d = new Date(stop.scheduledTime);
        setScheduledLocal(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
        );
      } catch {
        setScheduledLocal("");
      }
    } else {
      setScheduledLocal("");
    }
    setDurationMin(stop.duration ?? "");
  }, [stop]);

  useEffect(() => {
    resetFromStop();
  }, [resetFromStop]);

  useEffect(() => {
    if (!nearbyLatLng) {
      setNearby([]);
      return;
    }
    void fetch(
      `/api/places/nearby?lat=${nearbyLatLng.lat}&lng=${nearbyLatLng.lng}&radius=2000`,
    )
      .then((r) => r.json())
      .then((data: { results?: { name: string }[] }) => {
        setNearby(data.results ?? []);
      })
      .catch(() => setNearby([]));
  }, [nearbyLatLng]);

  if (!stop) {
    return (
      <Card className="border-dashed border-terrain-stone/50 p-6 text-center text-sm text-foreground/60 dark:border-terrain-surface/50">
        Sélectionnez une étape dans la timeline ou faites un clic droit sur la carte pour créer un arrêt.
      </Card>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/stop-image", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok) {
        window.alert(data.error ?? "Impossible d’envoyer l’image.");
        return;
      }
      if (data.url) {
        setImage(data.url);
        await onSaveStop({ image: data.url });
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveStop({
        type,
        label: label.trim() || "Sans titre",
        description: description.trim() || null,
        notes: notes.trim() || null,
        image: image.trim() || null,
        icon: type === "CUSTOM" ? icon.trim() || null : null,
        customTypeLabel: type === "CUSTOM" ? customLabel.trim() || null : null,
        scheduledTime: scheduledLocal ? new Date(scheduledLocal).toISOString() : null,
        duration: durationMin === "" ? null : Number(durationMin),
        checklist: checklist.length ? checklist : null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="space-y-4 p-4 shadow-card">
      <p className="text-sm font-semibold text-trail">Éditer l’arrêt</p>
      <p className="font-mono text-xs text-foreground/50">
        {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
      </p>
      <Input label="Nom du point / activité" value={label} onChange={(e) => setLabel(e.target.value)} />
      <div>
        <p className="mb-2 text-sm font-medium text-foreground/80">Type d’activité</p>
        <div className="flex flex-wrap gap-1.5">
          {STOP_TYPE_OPTIONS.map((o) => (
            <Chip key={o.type} active={type === o.type} onClick={() => setType(o.type)}>
              {o.label}
            </Chip>
          ))}
        </div>
      </div>
      {type === "CUSTOM" ? (
        <>
          <Input
            label="Nom du type personnalisé"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            placeholder="Ex. Atelier photo"
          />
          <Input
            label="Icône (emoji)"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder=""
            maxLength={8}
          />
        </>
      ) : null}
      <div>
        <p className="mb-2 text-sm font-medium text-foreground/80">Photo du point</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => void handleImageUpload(e)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="gap-2 text-sm"
            loading={uploading}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Importer depuis l’ordinateur
          </Button>
        </div>
        {image && image.trim() ? (
          <div className="relative mt-3 aspect-video w-full max-w-xs overflow-hidden rounded-xl border border-terrain-stone/40 bg-terrain-stone/20 dark:border-terrain-surface/50">
            {image.startsWith("/uploads/") || /^https?:\/\//i.test(image) ? (
              <Image
                src={image}
                alt=""
                fill
                sizes="320px"
                className="object-cover"
                unoptimized={image.startsWith("/uploads/")}
              />
            ) : (
              <div className="flex h-32 items-center justify-center text-xs text-foreground/50">
                <ImageIcon className="h-8 w-8 opacity-40" />
              </div>
            )}
          </div>
        ) : null}
        <div className="mt-3">
          <Input
            label="Ou lien URL"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://…"
            type="url"
          />
        </div>
      </div>
      <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Heure prévue"
          type="datetime-local"
          value={scheduledLocal}
          onChange={(e) => setScheduledLocal(e.target.value)}
        />
        <Input
          label="Durée (minutes)"
          type="number"
          min={0}
          max={1440}
          value={durationMin === "" ? "" : durationMin}
          onChange={(e) => setDurationMin(e.target.value === "" ? "" : Number(e.target.value))}
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-foreground/80">Checklist</p>
        <ul className="space-y-2">
          {checklist.map((item, idx) => (
            <li key={item.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.done}
                onChange={(e) => {
                  const next = [...checklist];
                  next[idx] = { ...item, done: e.target.checked };
                  setChecklist(next);
                }}
                className="h-4 w-4 rounded border-terrain-stone text-trail"
              />
              <input
                className="min-w-0 flex-1 rounded border border-terrain-stone/50 bg-snow/80 px-2 py-1 text-sm dark:border-terrain-surface/60 dark:bg-terrain-deep"
                value={item.text}
                onChange={(e) => {
                  const next = [...checklist];
                  next[idx] = { ...item, text: e.target.value };
                  setChecklist(next);
                }}
              />
              <button
                type="button"
                className="shrink-0 rounded p-1 text-red-600 hover:bg-red-500/10"
                aria-label="Supprimer"
                onClick={() => setChecklist(checklist.filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="ghost"
          className="mt-2 gap-1 text-sm"
          onClick={() => setChecklist([...checklist, newChecklistItem("Nouvelle tâche")])}
        >
          <Plus className="h-4 w-4" />
          Ajouter une ligne
        </Button>
      </div>
      {nearby.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground/60">
            Suggestions à proximité
          </p>
          <div className="flex flex-wrap gap-1.5">
            {nearby.map((p) => (
              <button
                key={p.name}
                type="button"
                className="rounded-pill border border-terrain-stone/40 bg-snow/90 px-2.5 py-1 text-xs font-medium hover:border-trail dark:border-terrain-surface/50 dark:bg-terrain-deep"
                onClick={() => setLabel(p.name)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <Button type="button" variant="primary" className="w-full" loading={saving} onClick={() => void handleSave()}>
        Enregistrer l’arrêt
      </Button>
    </Card>
  );
}
