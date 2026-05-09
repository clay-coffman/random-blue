import { PlanLoadingOverlay } from "@/components/PlanLoadingOverlay";

// Covers the persona lazy-gen SSR gap (3–6s with sonnet).
export default function Loading() {
  return <PlanLoadingOverlay />;
}
