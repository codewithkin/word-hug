/**
 * Removed in session 8b — orphaned. `git rm` this file.
 *
 * It was a standalone route reachable only from the `__DEV__` scaffolding link
 * row on the daily screen, which was deleted this session at the owner's
 * request. With the row gone, `scripts/nav-check.mjs` correctly reported it as
 * unreachable from /home.
 *
 * Every one of these seven routes had already been superseded by an inline
 * implementation on the screen that owns the moment:
 *
 *   /celebration     → <SolveCelebration> over the real board in daily.tsx
 *   /near-miss       → <GuessNote tone="close"> under the board
 *   /wrong-guess     → <GuessNote> plus the shake and the haptic
 *   /solved-today    → <SolvedBoard> in daily.tsx
 *   /offline-notice  → <OfflineBanner> mounted by shop.tsx
 *   /pack-puzzle     → /pack-level/[id]/[n]
 *   /token-probe     → a token debugging tool, not a screen
 *
 * They were built in sessions 3 and 4 as the design-reference versions the
 * inline ones were written from, which was the right call then. They have been
 * dead weight in the bundle since the inline versions landed; the link row was
 * the only thing keeping them nominally alive.
 *
 * The reasoning in the originals is not lost — it moved into the components
 * that replaced them. See git history for the full text.
 */
export default function Removed() {
  return null;
}
