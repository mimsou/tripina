import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

/**
 * Auth.js requires a non-empty `secret`. Prefer AUTH_SECRET (v5) or NEXTAUTH_SECRET in `.env`.
 * Local dev works without `.env` using a fixed dev fallback — set real secrets for production.
 */
function resolveAuthSecret(): string {
  const fromEnv =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Set AUTH_SECRET or NEXTAUTH_SECRET in production (e.g. openssl rand -base64 32).",
    );
  }
  if (process.env.NODE_ENV !== "test") {
    console.warn(
      "[auth] AUTH_SECRET / NEXTAUTH_SECRET not set — using dev-only fallback. Add AUTH_SECRET to .env for stable sessions.",
    );
  }
  return "triphive-dev-auth-secret-do-not-use-in-production-min-32-chars";
}

const providers: NextAuthConfig["providers"] = [];
/** Support both legacy names and Auth.js v5 `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`. */
const googleClientId =
  process.env.GOOGLE_CLIENT_ID?.trim() || process.env.AUTH_GOOGLE_ID?.trim();
const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET?.trim() || process.env.AUTH_GOOGLE_SECRET?.trim();
if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  );
}
if (process.env.RESEND_API_KEY) {
  providers.push(
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM ?? "TripHive <onboarding@resend.dev>",
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  trustHost: true,
  secret: resolveAuthSecret(),
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.username = (user as { username?: string | null }).username ?? null;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      try {
        const base =
          user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "") || "adventurer";
        let username = `${base}-${nanoid(4)}`.slice(0, 32);
        let n = 0;
        while (await prisma.user.findUnique({ where: { username } })) {
          n += 1;
          username = `${base}-${nanoid(4)}`.slice(0, 32);
          if (n > 20) break;
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { username },
        });
      } catch (e) {
        console.error("createUser username setup failed", e);
      }
    },
  },
  providers,
});
