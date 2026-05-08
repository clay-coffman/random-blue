import 'dotenv/config';
import type { Config } from 'drizzle-kit';

const databaseId = process.env.D1_DATABASE_ID;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: accountId!,
    databaseId: databaseId!,
    token: token!,
  },
} satisfies Config;
