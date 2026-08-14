# System: Storage & Persistence

**Owner of:** every MMKV key in the app, the schema version, and migrations.
**Status:** Draft

---

## 1. Choice

`react-native-mmkv` over AsyncStorage.

- Synchronous reads — no `await` in render paths, no flash of empty state on the daily screen
- ~30× faster than AsyncStorage
- Native encryption support if we ever need it

**Consequence:** MMKV requires a native module, so Expo Go will not work. Development uses a dev client (`expo run:ios` / `expo run:android`), which the repo's scripts already support.

---

## 2. Instances

Three separate MMKV instances so that a corrupt or reset section doesn't take everything with it.

| Instance ID | Contents | Reset risk |
|---|---|---|
| `wh.prefs` | User settings and onboarding state | Safe to clear — user re-picks settings |
| `wh.progress` | Solves, streak, stats, nudges used | Painful to lose — this is the user's history |
| `wh.content` | Downloaded OTA puzzle bank and manifest version | Safe to clear — falls back to bundled |

The coin balance lives in `wh.progress`, not `wh.prefs`, because losing it costs the user money.

---

## 3. Schema

All keys are namespaced and versioned. Every instance stores its own `schemaVersion`.

### 3.1 `wh.prefs`

| Key | Type | Default | Notes |
|---|---|---|---|
| `schemaVersion` | number | `1` | |
| `locale` | string \| null | `null` | `null` = follow device locale |
| `onboarding.completed` | boolean | `false` | |
| `onboarding.step` | number | `0` | Resume point if killed mid-flow (5 steps) |
| `install.date` | string \| null | `null` | ISO date. Second-visit offer trigger. |
| `offer.shown` | boolean | `false` | Welcome offer is one-time |
| `offer.expiresAt` | number \| null | `null` | Epoch ms; 48h window |
| `offer.dismissed` | boolean | `false` | Dismissed means gone forever |
| `prefs.sound` | boolean | `true` | |
| `prefs.haptics` | boolean | `true` | |
| `prefs.reminderEnabled` | boolean | `false` | |
| `prefs.reminderTime` | string | `"08:00"` | Local `HH:mm` |
| `prefs.lastNotifPermissionAsk` | number \| null | `null` | Don't re-prompt aggressively |

### 3.2 `wh.progress`

| Key | Type | Default | Notes |
|---|---|---|---|
| `schemaVersion` | number | `1` | |
| `coins.balance` | number | `3` | 3 free on install |
| `coins.lastWeeklyGrant` | string \| null | `null` | ISO date of last Monday grant |
| `coins.ledger` | LedgerEntry[] | `[]` | Capped at last 200 entries |
| `solves` | Record<PuzzleId, Solve> | `{}` | |
| `nudges` | Record<PuzzleId, 0\|1\|2\|3> | `{}` | Highest tier purchased on that puzzle |
| `streak.current` | number | `0` | |
| `streak.longest` | number | `0` | |
| `streak.lastDailyDate` | string \| null | `null` | ISO `YYYY-MM-DD`, local |
| `streak.restDaysUsedThisWeek` | number | `0` | |
| `streak.weekAnchor` | string \| null | `null` | ISO date of current rest-day week |
| `daily.highWaterDate` | string \| null | `null` | Clock-tamper guard — see §5 |
| `daily.firstLaunchDate` | string \| null | `null` | Set once; anchors the daily index |

```ts
type Solve = {
  solvedAt: number;        // epoch ms
  source: 'daily' | 'archive' | 'pack' | 'tutorial' | 'club';
  usedSolveNudge: boolean;
};

type LedgerEntry = {
  at: number;              // epoch ms
  delta: number;           // +ve grant/purchase, -ve spend
  reason: 'install_grant' | 'weekly_grant' | 'club_grant' | 'purchase' | 'nudge' | 'restore';
  ref?: string;            // puzzleId or RevenueCat transaction id
};
```

### 3.3 `wh.content`

| Key | Type | Default | Notes |
|---|---|---|---|
| `schemaVersion` | number | `1` | |
| `bank.version` | number | bundled version | Monotonic manifest version |
| `bank.lastCheckedAt` | number \| null | `null` | Throttles OTA checks to 24h |
| `bank.overlay` | Puzzle[] | `[]` | OTA-delivered puzzles merged over the bundled bank |

---

## 4. Access rules

**One typed accessor module owns all reads and writes.** No component touches MMKV directly.

```
apps/native/lib/storage/
  index.ts          // instances + typed get/set
  keys.ts           // every key as a const, single source of truth
  migrations.ts     // version → version transforms
  schema.ts         // zod schemas per key
```

Rules:

1. Every read is validated against a zod schema. A parse failure returns the default and logs — never throws into render.
2. Writes are synchronous but **debounced for hot paths** (stats updates during a solve).
3. Nothing is stored that could be recomputed cheaply. Stats like "total solved" derive from `solves`.
4. No PII, ever. There is no user identity in v1.
5. **Nothing in storage is ever transmitted.** There is no analytics pipeline, no crash-report attachment of user state, no sync. Everything here lives and dies on the device. The privacy policy says this in plain words, so it must stay true.

---

## 5. Clock tampering

With no backend, device time is the only clock. Guard:

- On every daily-screen mount, compute `today` from device local time.
- If `today > daily.highWaterDate + 1 day`, clamp to `highWaterDate + 1 day`.
- If `today < daily.highWaterDate`, the user moved the clock backwards — show the puzzle for `highWaterDate` and do not rewind progress.
- Update `highWaterDate` only when it advances.

This makes clock-forwarding yield at most one extra puzzle per real day. It is not tamper-proof and does not need to be — this is a cozy game, not a competition. The goal is only to stop a user accidentally burning the entire bank and then finding nothing to play.

---

## 6. Migrations

`migrations.ts` exports an ordered list of `{ from, to, migrate(instance) }`.

- Run on app boot in `+loading`, before any feature code reads storage
- Each migration is idempotent and wrapped in try/catch
- On unrecoverable failure: clear only the affected instance, keep the others, and continue booting. Never show the user a migration error.
- Never delete `wh.progress` automatically. If it cannot be migrated, keep the raw blob under `progress.backup.v<n>` so support can recover it.

---

## 7. Reinstall behaviour

MMKV does not survive uninstall. On a fresh install with a prior purchase history:

| Data | Recovered? | Via |
|---|---|---|
| Pack / bundle entitlements | Yes | RevenueCat restore |
| Hug Club subscription | Yes | RevenueCat restore |
| Coin balance | **Yes, in full** (decided) | Re-grant the full purchased amount from RevenueCat's non-subscription transaction history, ignoring prior spend |
| Streak, stats, solve history | No | Lost. This is the strongest argument for adding optional cloud sync in v2. |
| Settings | No | Re-defaulted |

If coins are restored, write a ledger entry with `reason: 'restore'` so a repeated restore can be detected and not double-credited (key on RevenueCat transaction id).

---

## 8. Open questions

- Does losing streak history on reinstall justify optional iCloud/Google Drive backup in v1? It is cheap on iOS (`NSUbiquitousKeyValueStore`) and messy on Android.
- Should `coins.ledger` be capped at 200 entries, or kept complete for support purposes?
