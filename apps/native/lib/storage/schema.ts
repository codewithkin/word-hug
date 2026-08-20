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
 * `wrongGuesses` replaced `heartsLost` when the heart system was removed in
 * session 8. It is the same signal — how much trouble a level gave — and it is
 * still not shown to the player. With no analytics pipeline and none planned
 * (PRD §10), a level's median wrong-guess count on the owner's own device is
 * the only evidence this project will ever have that a level is mis-rated.
 *
 * `.catch()` on the field rather than the object, so a record written before
 * the rename still parses instead of taking the whole history down with it.
 */
export const levelResultSchema = z.object({
  solvedAt: z.number(),
  wrongGuesses: z.number().catch(0),
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
