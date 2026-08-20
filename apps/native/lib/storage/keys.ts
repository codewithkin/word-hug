/**
 * Every MMKV key in the app, in one place.
 *
 * `systems/storage-persistence.md` §3 is the spec this implements. Keys are
 * written out as literals rather than built from parts, because a key is a
 * name in a database that already has users' data under it: a template that
 * renders differently after a refactor silently orphans a streak.
 *
 * What is here is the subset session 6 needs — onboarding, the reminder, and
 * the daily loop. The keys that belong to surfaces that do not exist yet
 * (`offer.*`, `coins.ledger`, RevenueCat entitlements) are deliberately absent
 * rather than stubbed: an unused key still has to be migrated.
 */

/** Bumped when the shape of anything below changes. See `migrate()`. */
export const SCHEMA_VERSION = 1;

export const INSTANCE = {
  /** Settings and onboarding state. Safe to clear — the user re-picks. */
  prefs: 'wh.prefs',
  /** Solves, streak, coins. Painful to lose — this is the user's history. */
  progress: 'wh.progress',
} as const;

export const PREFS = {
  schemaVersion: 'schemaVersion',
  onboardingCompleted: 'onboarding.completed',
  onboardingStep: 'onboarding.step',
  installDate: 'install.date',
  sound: 'prefs.sound',
  haptics: 'prefs.haptics',
  reminderEnabled: 'prefs.reminderEnabled',
  reminderTime: 'prefs.reminderTime',
} as const;

export const PROGRESS = {
  schemaVersion: 'schemaVersion',
  coinBalance: 'coins.balance',
  solves: 'solves',
  nudges: 'nudges',
  streakCurrent: 'streak.current',
  streakLongest: 'streak.longest',
  streakLastDate: 'streak.lastDailyDate',
  dailyHighWater: 'daily.highWaterDate',
  dailyFirstLaunch: 'daily.firstLaunchDate',

  // ── Levels (session 7) ───────────────────────────────────────────────────
  /** Highest level solved. 0 = none; level 1 is always unlocked. */
  levelHighest: 'levels.highest',
  /** `Record<levelNumber, LevelResult>` — see `schema.ts`. */
  levelResults: 'levels.results',

  // ── Hearts ───────────────────────────────────────────────────────────────
  /** Hearts remaining. Clamped to MAX_HEARTS on read. */
  hearts: 'hearts.count',
  /** Epoch ms the regen clock last ticked from. */
  heartsSince: 'hearts.since',
} as const;

/**
 * ── Hearts, added session 7 at the owner's instruction ────────────────────
 * A wrong guess costs a heart. At zero, guessing is paused until one
 * regenerates, a refill is bought, or (later) an ad is watched.
 *
 * **This is a deliberate reversal of rule 1** — "never punish", written into
 * a dozen files and into the onboarding copy the player already read. The
 * owner chose it over the no-lives option to create ad inventory and session
 * pressure. `lib/lives.ts` holds the argument and the single switch that
 * turns it off again.
 */
export const MAX_HEARTS = 5;

/** Minutes to regenerate one heart. */
export const HEART_REGEN_MINUTES = 20;

/** Coins to refill all hearts at once. */
export const HEART_REFILL_COST = 2;

/** 3 free coins on install — `storage-persistence.md` §3.2. */
export const INSTALL_COIN_GRANT = 3;

/** `prefs.reminderTime` default, local `HH:mm`. */
export const DEFAULT_REMINDER_TIME = '09:00';

/** Pack ids the player owns. RevenueCat is the truth; this is the local cache. */
export const OWNED_PACKS_KEY = 'packs.owned';

/**
 * Whether the end-of-free-run sheet has been shown. **Once, ever.**
 * An offer that reappears is a nag, not an offer.
 */
export const FREE_RUN_SHOWN_KEY = 'offer.freeRunShown';
