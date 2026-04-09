import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extForMime(mime: string): string {
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return ".jpg";
}

/**
 * Saves a stop image under `public/uploads/stops/` (persists on a normal Node host;
 * for serverless production, prefer UploadThing or object storage).
 */
export async function POST(req: Request) {
  await requireUserId();

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Format non supporté (JPEG, PNG, WebP, GIF)" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 4 Mo)" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const dir = join(process.cwd(), "public", "uploads", "stops");
  await mkdir(dir, { recursive: true });
  const name = `${nanoid()}${extForMime(file.type)}`;
  const fullPath = join(dir, name);
  await writeFile(fullPath, buf);

  const url = `/uploads/stops/${name}`;
  return NextResponse.json({ url });
}
