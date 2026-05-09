import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Wires getCloudflareContext() so route handlers running under
// `next dev` get the same DB / R2 / secret bindings as the deployed
// Worker. Required for any /api route that reads from D1 in dev.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
