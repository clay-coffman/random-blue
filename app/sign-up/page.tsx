"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AuthFooterLink, AuthShell } from "@/components/auth/AuthShell";
import { safeNext } from "@/lib/url";

type Role = "founder" | "owner" | "investor";

const ROLES: Array<{
  id: Role;
  glyph: string;
  title: string;
  desc: string;
}> = [
  {
    id: "founder",
    glyph: "▲",
    title: "Founder",
    desc:
      "Building a company in Utah. Wants a 90-day plan, resources, capital, mentors.",
  },
  {
    id: "owner",
    glyph: "⬣",
    title: "Business owner",
    desc:
      "Already running a Utah company. Wants to claim, update, and verify a profile.",
  },
  {
    id: "investor",
    glyph: "◈",
    title: "Investor / partner",
    desc:
      "Looking at the Utah ecosystem. Wants the map, briefs, deal flow.",
  },
];

export default function SignUpRolePage() {
  const router = useRouter();
  const params = useSearchParams();
  const intent = params.get("intent");
  const next = safeNext(params.get("next"), "");
  const [role, setRole] = useState<Role>(
    intent === "claim" ? "owner" : "founder",
  );

  function onContinue() {
    const sp = new URLSearchParams();
    sp.set("role", role);
    if (next) sp.set("next", next);
    router.push(`/sign-up/account?${sp.toString()}`);
  }

  return (
    <AuthShell
      kicker="Sign up · step 1 of 3"
      title="Who are you building?"
      steps={[
        { label: "Role", state: "current" },
        { label: "Account", state: "pending" },
        { label: "Verify", state: "pending" },
      ]}
      footer={
        <div className="space-y-1">
          <AuthFooterLink
            prefix="Already have an account?"
            href="/sign-in"
            label="Log in"
          />
          <p className="text-xs text-ink-3">
            Admin accounts are not self-serve. GOEO staff are invited by an
            existing superadmin.
          </p>
        </div>
      }
    >
      <fieldset className="grid gap-3">
        <legend className="sr-only">Pick your role</legend>
        {ROLES.map((r) => {
          const selected = role === r.id;
          return (
            <label
              key={r.id}
              className={`flex cursor-pointer items-center gap-3 rounded-tile border-[1.5px] p-3 transition ${
                selected
                  ? "border-ember bg-ember-tint shadow-sketch"
                  : "border-topo bg-paper-2 hover:-translate-y-0.5 hover:border-ink"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.id}
                checked={selected}
                onChange={() => setRole(r.id)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={`grid h-[42px] w-[42px] flex-none place-items-center rounded-tile border-[1.5px] font-serif text-[22px] leading-none ${
                  selected
                    ? "border-ember bg-paper text-ember"
                    : "border-ink bg-stone text-ink"
                }`}
              >
                {r.glyph}
              </span>
              <span className="flex-1">
                <span className="block font-serif text-lg leading-tight">
                  {r.title}
                </span>
                <span className="mt-1 block text-sm leading-snug text-ink-2">
                  {r.desc}
                </span>
              </span>
              <span
                aria-hidden
                className={`h-[14px] w-[14px] flex-none rounded-full border-[1.5px] ${
                  selected
                    ? "border-ember bg-ember-tint shadow-[inset_0_0_0_3px_var(--color-ember)]"
                    : "border-ink"
                }`}
              />
            </label>
          );
        })}
      </fieldset>
      <button
        type="button"
        onClick={onContinue}
        className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-tile border-[1.5px] border-ember bg-ember px-5 py-3 font-medium text-paper shadow-sketch transition-transform hover:-translate-y-0.5 hover:shadow-sketch-hover"
      >
        Continue →
      </button>
    </AuthShell>
  );
}
