import { MMKV } from 'react-native-mmkv';

import {
  DEFAULT_REMINDER_TIME,
  INSTALL_COIN_GRANT,
  INSTANCE,
  FREE_RUN_SHOWN_KEY,
  OWNED_PACKS_KEY,
  PREFS,
  PROGRESS,
  SCHEMA_VERSION,
} from './keys';
import { addDays, daysBetween, localDate, normaliseTime } from '@/lib/dates';
import {
  clockTime,
  isoDate,
  levelResultsSchema,
  nudgesSchema,
  ownedPacksSchema,
  solvesSchema,
  type LevelResult,
  type Nudges,
  type Solve,
} from './schema';

export type { LevelResult } from './schema';

/**
 * ── The storage layer ─────────────────────────────────────────────────────
 * Implements `systems/storage-persistence.md`. **No component touches MMKV
 * directly** (§4) — everything goes through the typed accessors below, which
 * is what makes the zod validation and the defaults unskippable.
 *
 * Two instances rather than one (§2): a corrupt `prefs` must not take the
 * user's streak with it. `wh.content` is not created yet — the puzzle bank is
 * still bundled-only and there is no OTA overlay to hold.
 *
 * ── Why the reads are synchronous and unguarded by a loading state ────────
 * That is the entire reason MMKV was chosen over AsyncStorage (§1). The daily
 * screen reads `solves` during render; an async read there means a frame of
 * empty board before the real state arrives, on the screen users open every
 * morning. Synchronous reads make that frame impossible.
 *
 * ── The in-memory fallback ────────────────────────────────────────────────
 * MMKV is a native module and needs JSI, so it is absent in any environment
 * where the native side has not loaded. Rather than let that throw at module
 * scope — which would take the whole app down before the error boundary
 * exists — construction falls back to a Map with the same surface. The app
 * then runs perfectly and forgets everything on relaunch, which is a bad day
 * rather than a broken build. Nothing else in the app needs to know.
 */

interface KVLike {
  getString(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;
  set(key: string, value: string | number | boolean): void;
  delete(key: string): void;
}

function createInstance(id: string): KVLike {
  try {
    return new MMKV({ id });
  } catch {
    const memory = new Map<string, string | number | boolean>();
    return {
      getString: (k) => (typeof memory.get(k) === 'string' ? (memory.get(k) as string) : undefined),
      getNumber: (k) => (typeof memory.get(k) === 'number' ? (memory.get(k) as number) : undefined),
      getBoolean: (k) =>
        typeof memory.get(k) === 'boolean' ? (memory.get(k) as boolean) : undefined,
      set: (k, v) => void memory.set(k, v),
      delete: (k) => void memory.delete(k),
    };
  }
}

const prefs = createInstance(INSTANCE.prefs);
const progress = createInstance(INSTANCE.progress);

// ── JSON helpers ───────────────────────────────────────────────────────────

function readJson<T>(kv: KVLike, key: string, schema: { parse: (v: unknown) => T }, fallback: T): T {
  const raw = kv.getString(key);
  if (raw === undefined) return fallback;
  try {
    return schema.parse(JSON.parse(raw));
  } catch {
    // §4 rule 1: a parse failure returns the default. It never throws into
    // render, and it never clears the key — a value we cannot read today may
    // still be recoverable by a migration tomorrow.
    return fallback;
  }
}

function writeJson(kv: KVLike, key: string, value: unknown) {
  try {
    kv.set(key, JSON.stringify(value));
  } catch {
    // A full disk. There is nothing useful to tell the player about it.
  }
}

// ── Dates ─────────────────────────────────────────────────────────────────

/**
 * Re-exported so callers have one import for "storage and the clock". The
 * implementations live in `lib/dates.ts` because they have no React Native
 * dependency and are therefore the only part of the daily loop that can be
 * unit-tested in plain Node — see `scripts/daily-loop-check.mjs`.
 */
export { addDays, daysBetween, localDate, normaliseTime } from '@/lib/dates';

// ── Boot ───────────────────────────────────────────────────────────────────

/**
 * Runs once, before anything reads storage.
 *
 * Idempotent by construction: every write is guarded by a read of the key it
 * would overwrite, so calling it twice — which a fast-refresh will — cannot
 * re-grant the install coins or move the install date.
 */
export function initStorage(): void {
  if (prefs.getNumber(PREFS.schemaVersion) === undefined) {
    prefs.set(PREFS.schemaVersion, SCHEMA_VERSION);
  }
  if (progress.getNumber(PROGRESS.schemaVersion) === undefined) {
    progress.set(PROGRESS.schemaVersion, SCHEMA_VERSION);
  }

  if (prefs.getString(PREFS.installDate) === undefined) {
    prefs.set(PREFS.installDate, localDate());
  }

  // The 3 free coins. Guarded on the key's existence and not on the balance,
  // so someone who has legitimately spent down to zero is not topped back up
  // every launch.
  if (progress.getNumber(PROGRESS.coinBalance) === undefined) {
    progress.set(PROGRESS.coinBalance, INSTALL_COIN_GRANT);
  }

  if (progress.getString(PROGRESS.dailyFirstLaunch) === undefined) {
    progress.set(PROGRESS.dailyFirstLaunch, localDate());
  }
}

// ── Onboarding ─────────────────────────────────────────────────────────────

export function hasOnboarded(): boolean {
  return prefs.getBoolean(PREFS.onboardingCompleted) ?? false;
}

/**
 * Called when the flow is finished OR skipped.
 *
 * Skipping counts. Onboarding explains the rule and asks for a notification
 * permission; a person who declines both has made a choice, and showing them
 * the same five screens tomorrow would be overriding it. Rule 1 covers the
 * interface's relationship with the player, not just the puzzle.
 */
export function completeOnboarding(): void {
  prefs.set(PREFS.onboardingCompleted, true);
}

export function getOnboardingStep(): number {
  return prefs.getNumber(PREFS.onboardingStep) ?? 0;
}

export function setOnboardingStep(step: number): void {
  prefs.set(PREFS.onboardingStep, step);
}

// ── Reminder ───────────────────────────────────────────────────────────────

export function getReminder(): { enabled: boolean; time: string } {
  const raw = prefs.getString(PREFS.reminderTime);
  const parsed = clockTime.safeParse(raw);
  return {
    enabled: prefs.getBoolean(PREFS.reminderEnabled) ?? false,
    time: parsed.success ? parsed.data : DEFAULT_REMINDER_TIME,
  };
}

/**
 * Remembers what was chosen. **Does not talk to the OS** — scheduling is
 * `lib/notifications.ts`, and keeping the two apart means Settings can show
 * the chosen time even when permission was refused, instead of showing
 * nothing and looking broken.
 */
export function setReminder(enabled: boolean, time?: string): void {
  prefs.set(PREFS.reminderEnabled, enabled);
  if (time !== undefined) {
    const canonical = normaliseTime(time);
    if (clockTime.safeParse(canonical).success) prefs.set(PREFS.reminderTime, canonical);
  }
}

// ── Preferences ────────────────────────────────────────────────────────────

export function getSound(): boolean {
  return prefs.getBoolean(PREFS.sound) ?? true;
}

export function setSound(on: boolean): void {
  prefs.set(PREFS.sound, on);
}

export function getHaptics(): boolean {
  return prefs.getBoolean(PREFS.haptics) ?? true;
}

export function setHaptics(on: boolean): void {
  prefs.set(PREFS.haptics, on);
}

// ── Coins ──────────────────────────────────────────────────────────────────

export function getCoins(): number {
  return progress.getNumber(PROGRESS.coinBalance) ?? INSTALL_COIN_GRANT;
}

/**
 * Returns false and writes nothing when the balance would go negative.
 *
 * The caller's job on false is to open overlay C (`/zero-coin`), which is a
 * screen about what is still free rather than a wall. Nothing in the app is
 * allowed to fail a spend silently and leave the player wondering.
 */
export function spendCoins(amount: number): boolean {
  const balance = getCoins();
  if (amount > balance) return false;
  progress.set(PROGRESS.coinBalance, balance - amount);
  return true;
}

export function grantCoins(amount: number): void {
  progress.set(PROGRESS.coinBalance, getCoins() + amount);
}

// ── Solves ─────────────────────────────────────────────────────────────────

export function getSolves(): Record<string, Solve> {
  return readJson(progress, PROGRESS.solves, solvesSchema, {});
}

export function getSolve(puzzleId: string): Solve | undefined {
  return getSolves()[puzzleId];
}

export function isSolved(puzzleId: string): boolean {
  return getSolve(puzzleId) !== undefined;
}

export function recordSolve(puzzleId: string, solve: Solve): void {
  writeJson(progress, PROGRESS.solves, { ...getSolves(), [puzzleId]: solve });
}

// ── Nudges ─────────────────────────────────────────────────────────────────

export function getNudges(): Nudges {
  return readJson(progress, PROGRESS.nudges, nudgesSchema, {});
}

/** The highest tier bought on a puzzle. Buying tier 2 after tier 1 is an upgrade. */
export function getNudgeTier(puzzleId: string): 0 | 1 | 2 | 3 {
  return getNudges()[puzzleId] ?? 0;
}

export function setNudgeTier(puzzleId: string, tier: 1 | 2 | 3): void {
  const current = getNudgeTier(puzzleId);
  if (tier <= current) return;
  writeJson(progress, PROGRESS.nudges, { ...getNudges(), [puzzleId]: tier });
}

// ── Streak ─────────────────────────────────────────────────────────────────

export interface Streak {
  current: number;
  longest: number;
  lastDate: string | null;
}

export function getStreak(): Streak {
  const raw = progress.getString(PROGRESS.streakLastDate);
  const parsed = isoDate.safeParse(raw);
  return {
    current: progress.getNumber(PROGRESS.streakCurrent) ?? 0,
    longest: progress.getNumber(PROGRESS.streakLongest) ?? 0,
    lastDate: parsed.success ? parsed.data : null,
  };
}

/**
 * Advances the streak for a daily solve on `date`.
 *
 * Three cases, and the third is the one that carries the product's values:
 * solving the same day twice changes nothing, solving the next day increments,
 * and solving after a gap **starts again at 1 without comment**. There is no
 * "streak lost" state, no notification about it, and nothing anywhere in the
 * interface that mentions the number that used to be there. Missing a day is
 * not an event (rule 1) — `longest` quietly keeps the memory instead.
 *
 * Archive and pack solves never call this. `caught-up` says "Replays don't
 * change your streak" and that line has to stay true.
 */
export function advanceStreak(date: string): Streak {
  const { current, longest, lastDate } = getStreak();

  if (lastDate === date) return { current, longest, lastDate };

  const next = lastDate !== null && daysBetween(lastDate, date) === 1 ? current + 1 : 1;
  const best = Math.max(longest, next);

  progress.set(PROGRESS.streakCurrent, next);
  progress.set(PROGRESS.streakLongest, best);
  progress.set(PROGRESS.streakLastDate, date);

  return { current: next, longest: best, lastDate: date };
}

// ── Levels ─────────────────────────────────────────────────────────────────

/** Highest level solved. 0 means none — level 1 is always unlocked. */
export function getHighestLevel(): number {
  return progress.getNumber(PROGRESS.levelHighest) ?? 0;
}

/**
 * Linear unlock: level N is playable once N-1 is solved.
 *
 * Replaying a solved level is always allowed and always free — it costs no
 * heart on a wrong guess and does not touch the streak. A level you have
 * beaten is not a test any more.
 */
export function isLevelUnlocked(n: number): boolean {
  return n <= getHighestLevel() + 1;
}

export function isLevelSolved(n: number): boolean {
  return n <= getHighestLevel();
}

export function getLevelResults(): Record<string, LevelResult> {
  return readJson(progress, PROGRESS.levelResults, levelResultsSchema, {});
}

export function getLevelResult(n: number): LevelResult | undefined {
  return getLevelResults()[String(n)];
}

/**
 * Records a solve and advances the frontier.
 *
 * `Math.max` rather than assignment: replaying level 3 after reaching 40 must
 * not send the player back to 3. The frontier only ever moves forward.
 */
export function recordLevelSolve(key: string | number, result: LevelResult): void {
  writeJson(progress, PROGRESS.levelResults, { ...getLevelResults(), [String(key)]: result });

  // Only the free run has a frontier. A pack key looks like `creatures:12` and
  // must never move it — buying a pack would otherwise appear to unlock the
  // free run up to level 12.
  const n = Number(key);
  if (Number.isInteger(n)) progress.set(PROGRESS.levelHighest, Math.max(getHighestLevel(), n));
}

// ── Packs ──────────────────────────────────────────────────────────────────

/**
 * Which packs the player owns.
 *
 * **RevenueCat is the source of truth, not this.** This is a local cache so
 * the Pack List can render without a network round-trip on every open, and so
 * an offline player can still play what they bought. When RevenueCat is wired,
 * entitlements refresh this on launch and on restore — they never read it.
 */
export function getOwnedPacks(): string[] {
  const parsed = ownedPacksSchema.safeParse(
    JSON.parse(progress.getString(OWNED_PACKS_KEY) ?? '[]')
  );
  return parsed.success ? parsed.data : [];
}

export function ownsPack(id: string): boolean {
  return getOwnedPacks().includes(id);
}

/** Called by a restore or a purchase. Idempotent. */
export function grantPack(id: string): void {
  const owned = getOwnedPacks();
  if (owned.includes(id)) return;
  writeJson(progress, OWNED_PACKS_KEY, [...owned, id]);
}

/**
 * The end-of-free-run sheet: has it been shown?
 *
 * Read-and-set in one call, because the caller is a focus effect on the map
 * and a separate read/write would show the sheet twice on a fast remount.
 * Returns true exactly once in the lifetime of an install.
 */
export function claimFreeRunPrompt(): boolean {
  if (prefs.getBoolean(FREE_RUN_SHOWN_KEY) === true) return false;
  prefs.set(FREE_RUN_SHOWN_KEY, true);
  return true;
}

/**
 * Advances the streak for *today*, whatever kept it alive.
 *
 * Session 7, the owner's decision: **a level solve and a daily solve both
 * count.** One puzzle of either kind on a given calendar day keeps the run
 * going, and doing both on the same day counts once — `advanceStreak` already
 * returns unchanged when `lastDate` is today, so this is safe to call from
 * every solve path without either of them knowing about the other.
 *
 * Uses the raw local date rather than the clamped `effectiveToday`, because a
 * level is not on a schedule: it can be played any day, and clamping would
 * mean a player who moved their clock could not keep a streak they earned
 * honestly.
 */
export function advanceStreakToday(): Streak {
  return advanceStreak(localDate());
}

// ── The clock-tamper guard ─────────────────────────────────────────────────

/**
 * The effective "today", clamped — `storage-persistence.md` §5.
 *
 * Moving the clock forward yields at most one extra puzzle per real run;
 * moving it backwards yields the high-water date rather than rewinding
 * progress. It is not tamper-proof and does not need to be. The only thing it
 * actually prevents is someone accidentally burning a year of the bank in an
 * afternoon and then finding nothing to play tomorrow, which is a support
 * problem disguised as a cheat.
 */
export function effectiveToday(): string {
  const today = localDate();
  const parsed = isoDate.safeParse(progress.getString(PROGRESS.dailyHighWater));

  if (!parsed.success) {
    progress.set(PROGRESS.dailyHighWater, today);
    return today;
  }

  const highWater = parsed.data;
  const drift = daysBetween(highWater, today);

  if (drift < 0) return highWater;

  const clamped = drift > 1 ? addDays(highWater, 1) : today;
  if (daysBetween(highWater, clamped) > 0) progress.set(PROGRESS.dailyHighWater, clamped);
  return clamped;
}

// ── Testing / Settings ─────────────────────────────────────────────────────

/**
 * Wipes everything and re-seeds. Not reachable from the product; it exists so
 * the owner can re-see onboarding on a device without reinstalling.
 */
export function resetAll(): void {
  for (const key of Object.values(PREFS)) prefs.delete(key);
  for (const key of Object.values(PROGRESS)) progress.delete(key);
  initStorage();
}
