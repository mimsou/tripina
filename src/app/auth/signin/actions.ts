"use server";

import { signIn } from "@/auth";

export async function signInWithGoogleAction(formData: FormData) {
  const callbackUrl = String(formData.get("callbackUrl") ?? "").trim() || "/dashboard";
  await signIn("google", { redirectTo: callbackUrl });
}
