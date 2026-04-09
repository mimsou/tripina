import { z } from "zod";

/** Accepts absolute URLs or app-relative uploads from `/api/upload/stop-image`. */
export const stopImageUrlSchema = z
  .string()
  .max(2048)
  .refine(
    (s) =>
      s === "" ||
      /^https?:\/\//i.test(s) ||
      (s.startsWith("/uploads/") && !s.includes("..")),
    "URL d’image invalide",
  );
