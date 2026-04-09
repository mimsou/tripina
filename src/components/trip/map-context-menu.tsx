"use client";

import { MapPin, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";

export type MapContextMenuState =
  | { kind: "map"; clientX: number; clientY: number; lng: number; lat: number }
  | { kind: "stop"; clientX: number; clientY: number; stopId: string };

type Props = {
  state: MapContextMenuState | null;
  onClose: () => void;
  onCreateStopHere: (lng: number, lat: number) => void;
  onDeleteStop: (stopId: string) => void;
};

export function MapContextMenu({ state, onClose, onCreateStopHere, onDeleteStop }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state) return;
    const onDocPointer = (e: MouseEvent | PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const t = window.setTimeout(() => {
      document.addEventListener("pointerdown", onDocPointer, true);
      document.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("pointerdown", onDocPointer, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [state, onClose]);

  if (!state) return null;

  const pad = 8;
  const w = 220;
  const left = Math.min(state.clientX, typeof window !== "undefined" ? window.innerWidth - w - pad : state.clientX);
  const top = Math.min(state.clientY, typeof window !== "undefined" ? window.innerHeight - 120 - pad : state.clientY);

  return (
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[60] min-w-[200px] overflow-hidden rounded-xl border border-terrain-stone/35 bg-snow/98 py-1 text-sm shadow-elevated backdrop-blur-md dark:border-terrain-surface/55 dark:bg-terrain-night/98"
      style={{ left, top }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {state.kind === "map" ? (
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-medium text-foreground transition-colors hover:bg-trail/10 dark:hover:bg-trail/15"
          onClick={() => {
            onCreateStopHere(state.lng, state.lat);
            onClose();
          }}
        >
          <MapPin className="h-4 w-4 shrink-0 text-trail" />
          Créer un arrêt ici
        </button>
      ) : (
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
          onClick={() => {
            onDeleteStop(state.stopId);
            onClose();
          }}
        >
          <Trash2 className="h-4 w-4 shrink-0" />
          Supprimer cet arrêt
        </button>
      )}
    </div>
  );
}
