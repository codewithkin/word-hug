"use client";

import Link from "next/link";

import { Wordmark } from "./wordmark";
import { ModeToggle } from "./mode-toggle";

/**
 * The site is three pages, so the nav is three links and the mark.
 *
 * The mark links home and is `compact`, because a full-size wordmark in a
 * 64px bar would be the header shouting over the page it introduces.
 */
const LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export default function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" aria-label="Word Hug, home">
          <Wordmark compact />
        </Link>

        <nav className="flex items-center gap-5">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
