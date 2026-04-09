import { nanoid } from "nanoid";

export function slugify(title: string) {
  const s = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "trip";
}

export function uniqueSlug(base: string) {
  return `${slugify(base)}-${nanoid(6)}`;
}
