/**
 * Connects to the default "postgres" database and creates the app database
 * if it does not exist. Requires DATABASE_URL pointing at postgresql://… (not prisma+).
 * Run via npm (loads .env): npm run db:ensure
 */
import pg from "pg";

function parseConnectionString(raw) {
  const url = raw.trim().replace(/^["']|["']$/g, "");
  if (url.startsWith("prisma+") || url.startsWith("prisma://")) {
    console.error(
      "DATABASE_URL must be a direct PostgreSQL URL, e.g.\n" +
        '  postgresql://USER:PASSWORD@localhost:5432/triphive\n' +
        "Remove prisma+postgres / prisma:// (Prisma local proxy) for local Postgres.",
    );
    process.exit(1);
  }
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    console.error("DATABASE_URL must start with postgresql:// or postgres://");
    process.exit(1);
  }
  const u = new URL(url.replace(/^postgresql:/, "http:").replace(/^postgres:/, "http:"));
  const database = (u.pathname || "/").replace(/^\//, "").split("?")[0] || "postgres";
  return {
    user: decodeURIComponent(u.username || "postgres"),
    password: u.password ? decodeURIComponent(u.password) : "",
    host: u.hostname || "localhost",
    port: parseInt(u.port || "5432", 10),
    database,
  };
}

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.error("Missing DATABASE_URL in .env");
    process.exit(1);
  }

  const cfg = parseConnectionString(raw);
  const targetDb = cfg.database;

  const admin = new pg.Client({
    user: cfg.user,
    password: cfg.password,
    host: cfg.host,
    port: cfg.port,
    database: "postgres",
  });

  await admin.connect();
  try {
    const { rows } = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDb],
    );
    if (rows.length === 0) {
      const safe = /^[a-zA-Z0-9_]+$/.test(targetDb) ? targetDb : null;
      if (!safe) {
        throw new Error(`Refusing to create database with unsafe name: ${targetDb}`);
      }
      await admin.query(`CREATE DATABASE ${safe}`);
      console.log(`Created database "${safe}".`);
    } else {
      console.log(`Database "${targetDb}" already exists.`);
    }
  } finally {
    await admin.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
