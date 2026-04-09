import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

if (process.env.NODE_ENV === "development" && typeof process.env.DATABASE_URL === "string") {
  const url = process.env.DATABASE_URL;
  if (url.startsWith("prisma://") || url.startsWith("prisma+postgres://")) {
    console.warn(
      "[prisma] DATABASE_URL uses prisma:// (Accelerate / Data Proxy). P5010 often means that service is unreachable. For local dev, prefer postgresql://… to Docker Postgres — see README.",
    );
  }
}
