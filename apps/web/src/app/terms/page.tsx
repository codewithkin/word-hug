import type { Metadata } from 'next';

import { LAST_UPDATED, SITE } from '@/lib/site';

/**
 * ── Terms of service ──────────────────────────────────────────────────────
 * Linked from the app's settings screen and from both store listings.
 *
 * ── Two things this deliberately does not do ──────────────────────────────
 * · **It does not claim to handle refunds.** Apple and Google own that
 *   relationship entirely; a clause saying "all sales are final" would be
 *   unenforceable against a store refund and would read as hostile to the one
 *   person actually asking.
 * · **It does not disclaim things that are not true.** There is no account to
 *   terminate, no content you can upload, and no community to moderate, so
 *   there are no clauses about any of them. A terms page padded with
 *   boilerplate about user-generated content in a single-player word game
 *   makes the parts that *are* real harder to find.
 *
 * Not legal advice. Written by the people who built the app; have a lawyer
 * read it before launch, particularly the liability section.
 */

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `The terms for using ${SITE.name}.`,
  alternates: { canonical: '/terms' },
};

export default function Terms() {
  return (
    <article className="prose-wh mx-auto max-w-2xl px-5 py-16">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Terms of Service</h1>
      <p className="mb-10 text-sm text-muted-foreground">Last updated {LAST_UPDATED}</p>

      <div className="mb-10 rounded-2xl border border-border bg-card p-6 shadow-chunky">
        <p className="!mb-0 text-card-foreground">
          <strong>The short version.</strong> {SITE.name} is a word puzzle game. Play it, enjoy it,
          and please do not try to break it or resell it. If you buy something and it does not
          work, tell us and we will help. Refunds go through Apple or Google, not through us.
        </p>
      </div>

      <h2>1. Agreement</h2>
      <p>
        These terms are between you and {SITE.publisher} (&quot;we&quot;, &quot;us&quot;). By
        installing or using {SITE.name} you accept them. If you do not, please do not use the app.
      </p>
      <p>
        You also remain bound by the terms of whichever store you installed from — Apple&apos;s or
        Google&apos;s. Where their rules and ours conflict on something they control, such as
        payment or refunds, theirs apply.
      </p>

      <h2>2. Using the app</h2>
      <p>
        We grant you a personal, non-exclusive, non-transferable licence to use {SITE.name} on
        devices you own or control, for your own enjoyment. That licence lasts as long as you keep
        to these terms.
      </p>
      <p>Please do not:</p>
      <ul>
        <li>Copy, sell, rent or redistribute the app or its puzzles</li>
        <li>Reverse-engineer or modify it, except where the law says you may</li>
        <li>Try to unlock paid content without paying for it</li>
        <li>Use it in a way that breaks the law where you are</li>
      </ul>
      <p>
        The puzzles, artwork, wordmark and the name {SITE.name} belong to us. The English language
        does not, and nothing here stops you telling anyone the answer to anything.
      </p>

      <h2>3. What is free, and what is not</h2>
      <p>
        The daily puzzle is free, always. So are the first fifty levels. We consider that a promise
        rather than a current arrangement, and we do not intend to put either behind a paywall.
      </p>
      <p>
        Optional purchases are available: themed level packs, and coins that buy hints. Prices are
        shown in your own currency before you confirm, and are set through the store you bought
        from.
      </p>

      <h2>4. Purchases and refunds</h2>
      <p>
        All payments are handled by Apple or Google. We never receive your card details and cannot
        charge you directly.
      </p>
      <p>
        <strong>Refunds are theirs to give.</strong> If you want one, request it from Apple or
        Google — we have no ability to issue it ourselves and telling us first only slows it down.
        If something you bought did not unlock, that is a different problem and we can usually fix
        it: write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
      <p>
        Level packs are permanent and can be restored on a new device with &quot;Restore
        purchases&quot;. Coins are consumable and are spent on your device, so they do not survive
        a reinstall. This is stated in the app at the point it matters.
      </p>

      <h2>5. Your progress</h2>
      <p>
        Your streak, solves and coins live on your phone. We do not hold a copy, so we cannot
        recover them if you delete the app, lose your device or clear its data. We are sorry in
        advance; it is the direct cost of not having accounts, and we think it is the right trade.
      </p>

      <h2>6. Availability</h2>
      <p>
        We will try to keep {SITE.name} working and to fix what breaks, but we do not promise it
        will always be available or always be free of bugs. The app is provided &quot;as is&quot;.
      </p>
      <p>
        We may update it, change how it works, or add and remove content. If we ever stop
        supporting it entirely, the version on your phone will keep working — nothing in the game
        requires our servers, because there are none.
      </p>

      <h2>7. Liability</h2>
      <p>
        To the extent the law allows, we are not liable for indirect or consequential loss arising
        from your use of {SITE.name}. Where liability cannot be excluded, it is limited to what you
        have paid us for the app in the twelve months before the claim.
      </p>
      <p>
        Nothing here limits liability for death or personal injury caused by negligence, for fraud,
        or for anything else that cannot lawfully be limited. If you are a consumer, your statutory
        rights are unaffected.
      </p>

      <h2>8. Ending it</h2>
      <p>
        You can stop using {SITE.name} whenever you like by deleting it. We may end your licence if
        you seriously breach these terms — in practice, if you are attacking the app or pirating
        the paid content.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update these terms. The date at the top will change when we do, and a material
        change will be mentioned in the app&apos;s release notes. Continuing to use the app after a
        change means you accept it.
      </p>

      <h2>10. Law</h2>
      <p>
        These terms are governed by the laws of England and Wales, and the courts of England and
        Wales have jurisdiction. If you are a consumer resident elsewhere, you keep the protection
        of the mandatory laws of the country you live in.
      </p>

      <h2>11. Contact</h2>
      <p>
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
      </p>
    </article>
  );
}
