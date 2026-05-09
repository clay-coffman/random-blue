// Augments the wrangler-generated CloudflareEnv with secret names that we set
// via `wrangler secret put`. Wrangler can't infer secrets from wrangler.jsonc,
// so we declare them here and trust that the deploy script set them.
declare namespace Cloudflare {
  interface Env {
    ANTHROPIC_API_KEY: string;
    ATLAS_ADMIN_TOKEN: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    RESEND_API_KEY: string;
    R2_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
  }
}
