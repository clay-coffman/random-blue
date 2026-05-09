"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Atlas" },
  { href: "/map", label: "Map" },
  { href: "/founder", label: "For founders" },
  { href: "/investors", label: "For investors" },
  { href: "/agents", label: "For agents" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="order-3 -mx-4 flex w-full gap-4 overflow-x-auto px-4 md:order-none md:mx-0 md:w-auto md:flex-1 md:justify-center md:overflow-visible md:px-0"
    >
      {navLinks.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className="whitespace-nowrap border-b-2 border-transparent pb-2 font-sans text-xs font-semibold uppercase leading-none tracking-[0.18em] text-ink no-underline transition-colors duration-200 hover:text-ember aria-[current=page]:border-ember"
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
