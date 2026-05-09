"use client";

import * as React from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

type MenuLink = {
  href: string;
  label: string;
};

type Props = {
  name: string;
  email: string;
  role: string;
  links?: MenuLink[];
};

const ROLE_LABELS: Record<string, string> = {
  founder: "Founder",
  owner: "Owner",
  investor: "Investor",
  goeo_admin: "GOEO admin",
  superadmin: "Superadmin",
};

function formatRole(role: string): string {
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ");
}

export function UserMenu({ name, email, role, links }: Props) {
  const [signingOut, setSigningOut] = React.useState(false);
  const [signOutError, setSignOutError] = React.useState<string | null>(null);

  const display = (name?.trim() || email.split("@")[0] || "Account").trim();
  const firstName = display.split(/\s+/)[0];
  const initial = (display[0] ?? "?").toUpperCase();

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    // Better Auth's React client returns { data, error }; it does
    // not throw on HTTP-level failures (CSRF mismatch, rate limit,
    // 5xx). The try/catch only covers network/runtime exceptions.
    try {
      const { error } = await authClient.signOut();
      if (error) {
        setSignOutError(error.message ?? "Could not sign out. Try again.");
        setSigningOut(false);
        return;
      }
      // Hard navigation guarantees the admin shell unmounts and the
      // next request goes through the auth gate fresh — soft nav can
      // race with the cookie clear and leave the previous RSC tree on
      // screen.
      window.location.assign("/");
    } catch (err) {
      setSignOutError(
        err instanceof Error ? err.message : "Could not sign out. Try again.",
      );
      setSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Account menu for ${display}`}
        className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-pill border-[1.5px] border-ink bg-paper-2 py-1.5 pl-1.5 pr-3 transition hover:-translate-y-0.5"
      >
        <span
          aria-hidden
          className="grid h-8 w-8 place-items-center rounded-full border-[1.5px] border-ink bg-paper font-mono text-[12px] font-semibold"
        >
          {initial}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink">
          {firstName}
        </span>
        <span aria-hidden className="font-mono text-[10px] text-ink-3">
          ▾
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="min-w-[220px] border-[1.5px] border-ink bg-paper text-ink"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5">
            <span className="block font-serif text-sm leading-tight text-ink">
              {display}
            </span>
            <span className="block truncate font-mono text-[11px] text-ink-3">
              {email}
            </span>
            <span className="mt-1 block font-mono text-[11px] uppercase tracking-wider text-ink-3">
              {formatRole(role)}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {links?.map((link) => (
          <DropdownMenuItem
            key={link.href}
            render={
              <Link
                href={link.href}
                className="px-2 py-1.5 font-sans text-sm text-ink"
              />
            }
          >
            {link.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          render={
            <Link
              href="/settings"
              className="px-2 py-1.5 font-sans text-sm text-ink"
            />
          }
        >
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={signingOut}
          // Base UI closes the menu unless the click is prevented.
          // Keep it open through the async signOut so the user sees
          // the "Signing out…" label and any error alert below.
          onClick={(event) => {
            event.preventDefault();
            void handleSignOut();
          }}
          className="px-2 py-1.5 font-sans text-sm"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
        {signOutError ? (
          <p
            role="alert"
            className="mt-1 px-2 py-1 font-mono text-[11px] text-danger"
          >
            {signOutError}
          </p>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
