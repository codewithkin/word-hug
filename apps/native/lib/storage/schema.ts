import { z } from 'zod';

/**
 * Zod schemas for everything that comes back out of MMKV.
 *
 * `systems/storage-persistence.md` §4 rule 1: **every read is validated, and a
 * parse failure returns the default rather than throwing.** MMKV is a file on
 * a device that can be half-written by a kill at the wrong moment, and the
 * daily screen reads storage during render. A throw there is a crash on the
 * one screen the product is.
 *
 * The rule matters most for the JSON-encoded values — `solves` is a record
 * that grows for a year and is the single most painful thing in the app to
 * lose. Validating it means a corrupt entry costs one solve, not all of them.
 */

/** ISO `YYYY-MM-DD`, local calendar date. */
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Local `HH:mm`, 24-hour. */
export const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const solveSchema = z.object({
  solvedAt: z.number(),
  source: z.enum(['daily', 'archive', 'pack', 'tutorial', 'club']),
  usedSolveNudge: z.boolean(),
});

export type Solve = z.infer<typeof solveSchema>;

/**
 * `catch({})` rather than a bare parse: one malformed entry must not discard
 * the whole history, and a missing key must not be distinguishable from an
 * empty one at the call site.
 */
export const solvesSchema = z.record(z.string(), solveSchema).catch({});

/**
 * What is remembered about a finished level.
 *
 * `heartsLost` is kept for the level-analysis script rather than for the
 * player: nothing in the UI shows it. It is the only signal this app will ever
 * have about whether a level is too hard, because there is no analytics
 * pipeline and there never will be (PRD §10). If a level's median
 * `heartsLost` is 4 on the owner's own device, that is the bug report.
 */
export const levelResultSchema = z.object({
  solvedAt: z.number(),
  heartsLost: z.number(),
  nudgeTier: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
});

export type LevelResult = z.infer<typeof levelResultSchema>;

export const levelResultsSchema = z.record(z.string(), levelResultSchema).catch({});

export const nudgesSchema = z
  .record(z.string(), z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]))
  .catch({});

export type Nudges = z.infer<typeof nudgesSchema>;

/** Locally cached pack entitlements. RevenueCat is the truth — see storage. */
export const ownedPacksSchema = z.array(z.string()).catch([]);
