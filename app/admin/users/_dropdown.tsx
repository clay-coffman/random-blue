"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FLIPPABLE = ["owner", "goeo_admin", "founder", "investor"];

export function UserRoleDropdown({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setRole(newRole: string) {
    if (newRole === currentRole) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        setError(json?.error?.message ?? `HTTP ${res.status}`);
        setSubmitting(false);
        return;
      }
      router.refresh();
      setSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={currentRole}
        onChange={(e) => setRole(e.target.value)}
        disabled={submitting}
        className="rounded-tile border border-ink bg-paper px-2 py-1 text-xs disabled:opacity-60"
      >
        {FLIPPABLE.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {error ? <p className="text-[10px] text-danger">{error}</p> : null}
    </div>
  );
}
