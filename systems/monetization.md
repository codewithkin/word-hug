# System: Monetization

**Owner of:** RevenueCat configuration, product and entitlement identifiers, the Nudge Coin ledger, and restore behaviour.
**Status:** Rewritten end of session 8c to match what actually shipped. The previous
version described the PRD's design (`pack_cozy_kitchen`, `wh_*` ids, `hug_club`,
restorable coins), most of which was superseded during sessions 7–8b. Where this
doc and the dashboard disagree, fix whichever is wrong — then fix the other one too.

---

## 1. Principles

RevenueCat is the **sole source of truth for entitlements**. Entitlements may **grant** and never **revoke** (D-008): an empty response means "offline", not "refunded". Results are folded into MMKV whenever they arrive; the game reads MMKV synchronously during render.

Nudge Coins are deliberately different: **local only**. RevenueCat tracks the *purchase* of coins, but *spending* them needs a secret key and a backend, and this app has neither by design. A server-side balance would be a second source of truth for one number, where the second could not do the thing the number is for.

---

## 2. Identifiers

The app's copy lives in `apps/native/content/packs.ts` and `apps/native/lib/purchases.ts`; this table mirrors it. **Match the dashboard exactly — including spaces and capitalisation.** A typo surfaces as an empty shop or a silently locked pack, never as an error.

### Apps

| App | SDK key in `app.json` | Purpose |
|---|---|---|
| Test Store | *(removed in 8c)* | Sandbox purchases without spending money |
| Word Hug (Play Store) — `app05dac30f80` | `extra.revenueCatKeys.android` = `goog_…` | Live Play billing |

iOS has an empty key slot until an App Store app exists.

### Entitlements (5)

| Entitlement ID | Grants |
|---|---|
| `Kitchen` | Kitchen Table pack |
| `Outdoor pack` | Out of Doors pack |
| `Creatures pack` | Creatures pack |
| `Workshop pack` | The Workshop pack |
| `Nightfall pack` | Nightfall pack |

There is no Hug Club and no archive entitlement — the archive was retired before launch (see `progress/05-known-issues.md`).

### Products (9)

| Product ID | Type | Grants |
|---|---|---|
| `wordhug_pack_kitchen` … `_nightfall` ×5 | Non-consumable | One pack entitlement each |
| `wordhug_pack_bundle` | Non-consumable | All five — attached to every pack entitlement, **no entitlement of its own** |
| `wordhug_coins_5` / `_15` / `_50` | Consumable | Coins, credited locally by `COIN_GRANTS` |

### Offering

One offering, `default`, nine packages (`wordhug_packs_all` for the bundle plus one per product). Word Hug never shows a chooser; offerings exist for A/B tests there is nothing to test yet.

---

## 3. Entitlement checks

```ts
// lib/storage owns the read; lib/purchases.ts is the only writer.
ownsPack(packId): boolean   // reads packs.owned from MMKV — synchronous, offline-safe
```

Rules:

- `configurePurchases()` runs once at startup, before anything asks about ownership (`app/_layout.tsx`).
- Entitlements are **folded into `packs.owned`** whenever the SDK reports them (startup, listener, after a purchase) and may grant, never revoke (D-008). A screen that awaited `getCustomerInfo()` before rendering would be blank on a train and would tell someone who paid that they had not.
- The entitlement→pack map is derived from `content/packs.ts`, so adding a pack cannot leave it half-wired.
- If the SDK is unavailable (web, Expo Go) or not configured, every purchase call degrades to a benign value; storage holds the last known truth.

---

## 4. Nudge Coin ledger

Coins are the only balance the app manages itself. Design it like an account, not a counter.

### Storage

`wh.progress` → `coins.balance`, `coins.ledger`, `coins.lastWeeklyGrant` (see `systems/storage-persistence.md` §3.2).

Every mutation appends a `LedgerEntry`. The balance is authoritative; the ledger is for auditing, support, and duplicate-grant detection.

### Grants

| Reason | Amount | Trigger | Where |
|---|---|---|---|
| Install grant | 3 (`INSTALL_COIN_GRANT`) | First launch, keyed on a stored install date | `lib/storage/index.ts` |
| Daily coin | 1 (`DAILY_COIN_GRANT`) | First daily solve of the local day — granted **before** the toast that announces it | `recordSolve` |
| Coin purchase | 5 / 15 / 50 | Store confirms; credited from `COIN_GRANTS[pkg.product.identifier]`, only in `buy()` | `lib/purchases.ts` |

There is no weekly grant and no club grant — those belonged to the unbuilt Hug Club. The accepted risk at `COIN_GRANTS`: if the process dies between the store confirming and the app crediting, the money is taken and the coins are not granted. If a player ever reports it, restore the virtual currency rather than adding a retry.

### Spending

Spending happens in `app/nudge-picker.tsx` against `spendCoins`, with prices from `NUDGE_RUNGS`. Since D-010 the ladder is **1 / 2 / 3** — category, first letter, whole answer. Tier integers are storage keys against puzzle ids and were never renumbered through any of this.

- Tiers unlock in sequence; a rung not yet reached reads "Later", never "Locked".
- Re-opening a puzzle shows previously purchased nudges for free — a player never pays twice for the same hint.
- Balance can never go below zero: `spendCoins` refuses before deducting.

### Zero-balance flow

A priced rung at a zero balance routes to **overlay C (`/zero-coin`)**, a quiet sheet about what is still free — never a full-screen paywall, never shown during or after a solve. It uses `router.replace` so backing out does not land the player on the picker again with an empty wallet.

---

## 5. Restore purchases

`restore()` in `lib/purchases.ts`, from Settings and the restore-result screen.

| Item | Restored |
|---|---|
| Packs, Bundle | Yes — automatic via entitlements |
| Coins | **No.** Consumables are not restorable purchases, by store design — they exist to be used up |

The restore screen says so in as many words rather than implying a full recovery. (This reverses the PRD's "coins restorable in full"; the ledger machinery it required was never built.)

Restore always produces visible feedback: what came back, or a warm "nothing to restore" — never silence.

---

## 6. Where money is allowed to appear

Binding placement rules derived from PRD §1.1 Principle 3 and 4.

| Surface | Allowed? |
|---|---|
| Puzzle screen | Only the small nudge button. No prices, no badges, no packs. |
| Solve celebration | **Never.** No offers, no "unlock more," nothing. |
| Screen after a solve | Permitted, quiet, dismissible |
| Archive | The archive was retired; there is no locked-date paywall |
| Pack list | Permitted — this is a store surface |
| Shop | Obviously |
| Onboarding | **Never.** No prices, no offers, no shop entry anywhere in the flow. |
| Second visit, one screen after a solve | Permitted — the welcome offer, once, dismissible with a full-size button |
| Notifications | **Never.** No notification may contain a price or an offer. |
| Streak break | **Never.** Loss is not a sales moment. |

---

## 7. Business-model risks

Recorded here because they shape build priority, not just pricing.

- **Packs are anchors, not products.** 5 × £1.99 = £9.95 against a £7.99 bundle. Essentially nobody buys a single pack. Don't invest engineering effort in merchandising individual packs.
- **No recurring revenue at all.** Every product is a one-time purchase; the Club was never built and the archive retired. LTV per paying user is capped at roughly **£8–15** — Bundle plus occasional coins.
- **Coins are the only repeatable revenue**, and the product principles forbid pushing hints — the ladder is opt-in, quiet, and priced so the daily coin covers roughly one hint a day (D-010). Accept that ARPU will be low by design.
- **Revenue is essentially unmeasurable in-app.** No analytics means the only signal is Play Console revenue against installs.

---

## 8. Testing requirements

- Buying each product grants the right thing: five packs unlock their own levels only, the bundle unlocks all five, coin purchases raise the balance by exactly 5/15/50
- Offline launch after a prior purchase still unlocks owned packs
- Rapid triple-tap on a rung spends exactly one coin
- Restore brings packs back and **coins never**
- Balance never goes negative under any sequence of operations
- No price or offer renders at any point during onboarding

---

## 9. Open questions

- Family Sharing on iOS for the Bundle — enable or not? (When iOS exists.)
- Is one hint a day the right economy once real players arrive, or does the daily coin need to be 2?
