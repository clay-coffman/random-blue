import { redirect } from "next/navigation";

// Founder onboarding hook into Agent 3's intake page. Agent 3 reads
// the `onboard=1` param and renders a stepper above the existing
// intake form; submitting redirects to `/onboarding/done`.
export default function FounderOnboardingPage() {
  redirect("/founder?onboard=1");
}
