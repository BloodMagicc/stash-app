import { betterAuth } from "better-auth";
import { dbClient } from "@/lib/db";

export const auth = betterAuth({
  database: {
    provider: "sqlite",
    client: dbClient,
  },
  emailAndPassword: {
    enabled: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
});
