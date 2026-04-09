import { redirect } from "next/navigation";

/** Legacy `/signin` → `/auth/signin` (preserve query string). */
export default function SignInLegacyRedirect({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const sp = new URLSearchParams();
  for (const [key, val] of Object.entries(searchParams)) {
    if (val == null) continue;
    if (Array.isArray(val)) val.forEach((v) => sp.append(key, v));
    else sp.set(key, val);
  }
  const q = sp.toString();
  redirect(q ? `/auth/signin?${q}` : "/auth/signin");
}
