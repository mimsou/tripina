import type { StopType } from "@prisma/client";

/** UI labels (FR / EN mix as requested). Maps to Prisma `StopType`. */
export const STOP_TYPE_OPTIONS: { type: StopType; label: string; hint?: string }[] = [
  { type: "MEETUP", label: "Point de rendez-vous", hint: "Meet" },
  { type: "HIKE", label: "Randonnée / hiking" },
  { type: "RESTAURANT", label: "Restaurant" },
  { type: "CAFE", label: "Pause café" },
  { type: "REST", label: "Pause / repos" },
  { type: "VIEWPOINT", label: "Point de vue" },
  { type: "CUSTOM", label: "Activité libre" },
];

export function stopTypeLabel(t: StopType, custom?: string | null): string {
  if (t === "CUSTOM" && custom?.trim()) return custom.trim();
  return STOP_TYPE_OPTIONS.find((o) => o.type === t)?.label ?? t;
}
