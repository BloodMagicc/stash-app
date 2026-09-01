import { betterAuth } from "better-auth";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

// Create client dynamically
export const dbClient = createClient({
  url: url && url.startsWith("libsql://") ? url : "libsql://dummy-url.turso.io",
  authToken: authToken || "dummy-token",
});

export const auth = betterAuth({
  database: {
    provider: "sqlite",
    client: dbClient,
  },
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-at-least-32-chars-long",
});
