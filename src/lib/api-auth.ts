import { auth } from "@/auth";

export async function requireUserId() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return id;
}
