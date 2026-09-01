import { betterAuth } from "better-auth";
import { createClient } from "@libsql/client";

export const dbClient = createClient({
  url: process.env.TURSO_DATABASE_URL || "libsql://dummy-stash-db.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN || "dummy-token",
});

export const auth = betterAuth({
  database: {
    provider: "sqlite",
    client: dbClient,
  },
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET || "super-secret-key-stash-zk-2026-vault",
});
