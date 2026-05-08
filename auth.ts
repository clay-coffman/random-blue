import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";

// Stub D1 binding so `@better-auth/cli generate` can introspect the schema
// at codegen time. Agent 5 replaces this with the real per-request env
// binding before any runtime DB call.
const stubDb = drizzle({} as never);

export const auth = betterAuth({
  database: drizzleAdapter(stubDb, { provider: "sqlite" }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role: { type: "string", required: true, defaultValue: "owner" },
    },
  },
});
