import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Wires getCloudflareContext() so route handlers running under
// `next dev` get the same DB / R2 / secret bindings as the deployed
// Worker. Required for any /api route that reads from D1 in dev.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // Map the dot-extension URLs from product-plan.md (e.g.
  // /startups/crew.md, /startups/crew.json) to their App Router
  // route handlers at /startups/[slug]/route.md and route.json. The
  // file-system path produces /startups/[slug]/route.md natively;
  // these rewrites just expose the cleaner URL.
  async rewrites() {
    return [
      {
        source: "/startups/:slug.md",
        destination: "/startups/:slug/route.md",
      },
      {
        source: "/startups/:slug.json",
        destination: "/startups/:slug/route.json",
      },
      {
        source: "/investors/:slug.md",
        destination: "/investors/:slug/route.md",
      },
      {
        source: "/investors/:slug.json",
        destination: "/investors/:slug/route.json",
      },
    ];
  },
};

export default nextConfig;
