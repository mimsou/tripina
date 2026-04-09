import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

/** Codes often seen when Postgres / engine / proxy is unreachable. */
const CONNECTION_LIKE_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Connection timed out
  "P1003", // Database does not exist
  "P1017", // Server has closed the connection
  "P5010", // Request to engine failed (e.g. Accelerate/proxy fetch failed)
]);

export function isDatabaseConnectionError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return CONNECTION_LIKE_CODES.has(e.code);
  }
  if (e instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  return false;
}

export function dbUnavailableResponse() {
  return NextResponse.json(
    {
      error: "Database unavailable.",
      hint:
        "Use a direct PostgreSQL URL (postgresql://...) for local dev. Start Postgres (e.g. docker compose up -d), set DATABASE_URL in .env, then run: npx prisma db push",
      code: "DB_UNAVAILABLE",
    },
    { status: 503 },
  );
}
