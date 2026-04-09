import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** Returns DB session token for Socket.io auth (keep transport HTTPS-only in prod). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dbSession = await prisma.session.findFirst({
    where: { userId: session.user.id },
    orderBy: { expires: "desc" },
  });
  if (!dbSession) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }
  return NextResponse.json({ sessionToken: dbSession.sessionToken });
}
