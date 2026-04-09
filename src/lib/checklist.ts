import { nanoid } from "nanoid";

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export function normalizeChecklist(raw: unknown): ChecklistItem[] {
  if (!Array.isArray(raw)) return [];
  const out: ChecklistItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id : nanoid(8);
    const text = typeof o.text === "string" ? o.text : "";
    const done = Boolean(o.done);
    if (text.trim()) out.push({ id, text: text.slice(0, 500), done });
  }
  return out.slice(0, 40);
}

export function newChecklistItem(text: string): ChecklistItem {
  return { id: nanoid(8), text: text.slice(0, 500), done: false };
}
