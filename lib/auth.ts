import { betterAuth } from "better-auth";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

export const dbClient = createClient({
  url: url || "libsql://dummy-url.turso.io",
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
  secret: process.env.BETTER_AUTH_SECRET || "stash-vault-secret-key-32-chars-minimum",
});
