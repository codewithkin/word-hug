/**
 * One place for everything about the site that is not a page.
 *
 * ── Why a module and not inline strings ───────────────────────────────────
 * The domain, the support address and the "last updated" dates appear in the
 * layout metadata, the footer, the privacy policy, the terms, and the store
 * listings that point at them. A store review that follows a stale URL to a
 * 404 is a rejection, so there is exactly one copy of each.
 *
 * `LAST_UPDATED` is deliberately manual. It is a legal date, not a build date
 * — regenerating it from `Date.now()` would silently claim the policy changed
 * every time the site was redeployed, which is both false and the sort of
 * thing that matters if anyone ever asks which version someone agreed to.
 */

export const SITE = {
  name: 'Word Hug',
  domain: 'wordhug.gamesforstrangers.lol',
  url: 'https://wordhug.gamesforstrangers.lol',

  tagline: 'Three words. One word that hugs all three.',
  description:
    'A cozy word puzzle. Three clues, one word that joins them all. A new one every day, free, plus fifty levels to work through. No timer, no score, no way to lose.',

  /** Where a player, a store reviewer or a regulator writes to. */
  email: 'kinzinzombe07@gmail.com',

  /** The publisher named in the policies and on the store listings. */
  publisher: 'Games for Strangers',

  /** Android application id, as registered with Google Play. */
  androidPackage: 'com.codewithkin.wordhug',
  /** iOS bundle identifier. */
  iosBundleId: 'com.codewithkin.wordhug',
} as const;

/** Update by hand whenever the substance of a policy changes. */
export const LAST_UPDATED = '21 August 2026';
