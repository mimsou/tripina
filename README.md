# TripHive

Plan outdoor trips together — Next.js 14 (App Router), Prisma, MapLibre + OpenFreeMap tiles, OpenRouteService walking routes, Auth.js, Socket.io realtime service.

## Setup

1. Copy `.env.example` to `.env` and set **`AUTH_SECRET`** or **`NEXTAUTH_SECRET`** (required — without it, Google sign-in returns a server `Configuration` error), **`DATABASE_URL`**, optional OAuth, and **`OPENROUTESERVICE_API_KEY`** (free tier at [openrouteservice.org](https://openrouteservice.org/) — walking directions; map tiles use OpenFreeMap and need no token).
2. **Google OAuth:** in Google Cloud Console, add **Authorized redirect URI** `{NEXTAUTH_URL}/api/auth/callback/google` (e.g. `http://localhost:3000/api/auth/callback/google`).
3. Start Postgres: `docker compose up -d` (or use your own URL).
4. `npx prisma db push` (or `prisma migrate dev`) to apply the schema.
5. `npm run dev` — app at [http://localhost:3000](http://localhost:3000). Sign-in page: **`/auth/signin`** (legacy **`/signin`** redirects to it).

### Database errors (`P5010`, `fetch failed`, Explore 500)

- **P5010** usually means Prisma could not reach the database engine (often a **`prisma://` / Accelerate** URL that is offline, or Postgres not running).
- For **local development**, use a **direct** URL:  
  `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/triphive"`  
  then `docker compose up -d` and `npx prisma db push`.
- If you use **Prisma Accelerate** / cloud URLs, ensure that service is up and the URL is correct.

## Realtime (join requests)

Run the Socket.io service (e.g. on Railway in production):

```bash
npm run realtime
```

Set `REALTIME_INTERNAL_URL`, `REALTIME_SECRET`, and `NEXT_PUBLIC_REALTIME_URL` so the Next app can notify the realtime server and clients can connect.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run realtime` | Fastify + Socket.io server |
| `npm test` | Vitest |
| `npx prisma studio` | DB browser |

## Project layout

- `src/app` — App Router pages (marketing, dashboard, trip builder, public share `/t/[shareToken]`).
- `src/components` — UI, landing, map, realtime toasts.
- `server/realtime.ts` — standalone WebSocket service.
- `prisma/schema.prisma` — data model.

## Bonus ideas (roadmap)

Trip memories, Open-Meteo weather (`src/lib/weather.ts`), PWA push, Uploadthing + R2, and map fly-over are sketched in the product spec and can be layered on without changing the core schema.
