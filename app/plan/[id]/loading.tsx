import { PlanLoadingOverlay } from "@/components/PlanLoadingOverlay";

// Next.js renders this automatically while /plan/[id]/page.tsx
// is server-rendering. Important when the persona path lazy-
// generates a plan via `generatePlanForPassport` (3–6s with
// sonnet) — without this, the user stares at a blank white page
// during the wait and assumes the app hung.
export default function Loading() {
  return <PlanLoadingOverlay />;
}
