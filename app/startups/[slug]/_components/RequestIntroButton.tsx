"use client";

import { RequestIntroDialog } from "../../../investors/[slug]/_components/RequestIntroDialog";

// Thin wrapper so the startups page can import a flat-named component.
// Reuses the same dialog implementation as the investor profile page.
export function RequestIntroButton({
  companyId,
  companyName,
}: {
  companyId: string;
  companyName: string;
}) {
  return (
    <RequestIntroDialog
      targetType="company"
      targetId={companyId}
      targetName={companyName}
    />
  );
}
