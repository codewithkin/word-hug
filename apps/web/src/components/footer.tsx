import Link from "next/link";

import { SITE } from "@/lib/site";

/**
 * The footer exists for the store reviewers.
 *
 * Google Play and the App Store both want a privacy policy reachable from the
 * site root, and a contact address that is not a form. Both are here on every
 * page rather than only on the pages they describe.
 */
export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          {SITE.name} — a {SITE.publisher} game.
        </p>

        <nav className="flex items-center gap-5">
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="text-muted-foreground hover:text-foreground">
            Terms
          </Link>
          <a
            href={`mailto:${SITE.email}`}
            className="text-muted-foreground hover:text-foreground"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
