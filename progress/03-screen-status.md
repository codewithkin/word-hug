# Screen status

> **Session 8b — seven routes were removed.** `/celebration`, `/near-miss`,
> `/wrong-guess`, `/solved-today`, `/offline-notice`, `/pack-puzzle` and
> `/token-probe` no longer exist as routes. Each had already been superseded by
> an inline implementation on the screen that owns the moment — the celebration
> is an overlay over the real board, the guess notes are a line under it, and
> pack puzzles are `/pack-level/[id]/[n]`. They stayed reachable only via the
> `__DEV__` scaffolding link row, which was also deleted this session, and
> `nav-check` then correctly called them orphans.
>
> **The moments still exist and are still built.** Only the standalone
> design-reference routes are gone. The route count is 29, not 36.
>
> `/archive`, `/archive-puzzle`, `/archive-day-one` and `/archive-locked` were
> retired in session 8 when the archive itself was.

**The one place that answers "which screens are done".** Nothing else in `progress/`
tries to answer this. If this file and a changelog entry disagree, this file is right.

**Last updated: end of session 7.**

The spec is 18 screens + 8 overlays (`plans/03-screens.md` §2), plus the alternate
states of screens that already exist.

## Score

| Group | Done | Total |
|---|---|---|
| **System screens** | **3** | **3** |
| **Home / levels** (session 7) | **2** | **2** |
| **Onboarding** | **5** | **5** |
| **Main app** | **10** | **10** |
| **Overlays** | **8** | **8** |
| **Alternate states** | **9** | **9** |
| **Total** | **37** | **37** |

**Done** means code-complete and unverified — written from the design file in both
themes. **Not one screen has been seen running.** Nothing is "verified" yet, and
nothing can be until the owner runs the build.

Session 4 added four overlays (B, C, E, F), all nine alternate states, and the
splash artwork, and TypeScript-checked every one of them. The four screens still
missing are 10, 12, 13 and 15 — the archive index and the paid surface.

**Session 6 built no new screens.** It made the existing ones work: screen 09 is now
live and three of the alternate states became phases of it rather than routes. The
count above is unchanged because "done" here means the screen exists, and it did.

The owner has now run the build once, so a distinction that did not previously
matter starts to: **09 has been *seen*, and nothing else has.** Everything below is
still unverified in the sense this file has always meant.

---

## System screens — 3 of 3

| # | Screen | Design file | State |
|---|---|---|---|
| 1 | Loading | `01-loading-{light,dark}` | ✅ Built, unverified. `/loading`. Nothing routes to it yet. |
| 2 | Error | `02-error-{light,dark}` | ✅ Built, unverified. `/error`, **and** the root `ErrorBoundary`. |
| 3 | Not Found | `03-not-found-{light,dark}` | ✅ Built session 2, unverified. Motion rewritten session 3. |

The designed splash (`splash-{light,dark}`) is **now complete**: `app.json` sets the
design's grounds (`#FFF4E2` / `#1A0F38`) and the two PNGs in `assets/images/` are
the real wordmark, generated in session 4 from the design at 5x
(`720x505`, transparent, `imageWidth: 200`). They are no longer the Expo template's.

---

## Onboarding — 5 of 5

All five built in session 3, each from its own design file in both themes.

| Step | Screen | Route | State |
|---|---|---|---|
| 4 | Welcome | `/onboarding/welcome` | ✅ Built, unverified |
| 5 | Try the game | `/onboarding/try-the-game` | ✅ Built, unverified. Static board — no input layer yet. |
| 6 | The ritual | `/onboarding/ritual` | ✅ Built, unverified. Week strip is hard-coded to the design's Thursday. |
| 7 | Notification priming | `/onboarding/notifications` | ✅ Built, unverified. ALLOW asks the OS; the chosen time is not persisted. |
| 8 | Drop in | `/onboarding/drop-in` | ✅ Built, unverified |

**Nothing gates the flow yet.** There is no first-launch flag, so the app still
opens on the Daily screen and onboarding is reached from the temporary link row
at the bottom of it. Gating belongs with the storage layer (`react-native-mmkv`,
installed, still unused) — see `plans/05` §6.1.

---

## Main app — 6 of 10

| # | Screen | Design file | State |
|---|---|---|---|
| 9 | **Daily Puzzle** | `09-daily-puzzle-{light,dark}` | ✅ Built, unverified. Static. All four of its alternate states now exist as routes. |
| 10 | Archive | `10-archive-{light,dark}` | ❌ Not started. **Its day-one state IS built** — `/archive-day-one`. |
| 11 | Archive Puzzle | `11-archive-puzzle-{light,dark}` | ✅ Built, unverified. `/archive-puzzle`. |
| 12 | Pack List | `12-pack-list-{light,dark}` | ❌ Not started. **Its empty state IS built** — `/nothing-owned`. |
| 13 | Pack Detail | `13-pack-detail-{light,dark}` | ❌ Not started |
| 14 | Pack Puzzle | `14-pack-puzzle-{light,dark}` | ✅ Built, unverified. `/pack-puzzle`. |
| 15 | Shop | `15-shop-{light,dark}` | ❌ Not started. **Its failure state IS built** — `/store-unreachable`. |
| 16 | Settings | `16-settings-{light,dark}` | ✅ Built, unverified. Toggles persist nothing. |
| 17 | How to Play | `17-how-to-play-{light,dark}` | ✅ Built, unverified. |
| 18 | Stats | `18-stats-{light,dark}` | ✅ Built, unverified. **`/stats-empty` is now built and is what a new player sees.** |

Three of the four missing screens now have their empty/failure state built and
nothing else. That is a deliberate order: an empty state is where a screen's copy
and its manners live, and it is far cheaper to be wrong about a list of five packs
than about the sentence explaining why you cannot buy them.

**12, 13 and 15 are the rest of the paid surface.** That block needs RevenueCat
wired, which is why it is last.

---

## Overlays — 5 of 8

| | Overlay | Route | State |
|---|---|---|---|
| A | Solve celebration | `/celebration` | ✅ Built session 3, unverified. Transparent modal. |
| B | **Nudge picker** | `/nudge-picker` | ✅ Built session 4, unverified. Wired to the Nudge button on 3 screens. |
| C | **Zero-coin prompt** | `/zero-coin` | ✅ Built session 4, unverified. Prices are placeholders — see below. |
| D | Welcome offer | — | ❌ Not started |
| E | **Archive locked** | `/archive-locked` | ✅ Built session 4, unverified. Centred dialog, own scrim. |
| F | **Offline notice** | `/offline-notice` | ✅ Built session 4, unverified. A **component**, not a screen — see below. |
| G | Restore result | — | ❌ Not started |
| H | Caught-up | — | ❌ Not started. **Not the same thing as `/caught-up`**, which is the 09 alternate state. |

F is `components/notice.tsx`'s `OfflineBanner`. In the product the Shop and the
Pack List mount it themselves when `expo-network` reports no connection; the route
exists only so it can be looked at. **Its backdrop is not the design's** — the
design draws it over the Shop, which does not exist. Recorded in the file.

D and G are both purchase-flow overlays and belong with 12/13/15.

---

## Alternate states — 9 of 9

| Of screen | State | Route | Notes |
|---|---|---|---|
| 9 Daily | Solved today | `/solved-today` | No countdown to the next puzzle. Deliberate. |
| 9 Daily | Wrong guess | `/wrong-guess` | **Where rule 1 lives.** No red, no shake, nothing deducted. |
| 9 Daily | Near miss | `/near-miss` | Same board, warmer pill. The only two tones that exist. |
| 9 Daily | Caught up | `/caught-up` | Softer empty tiles than every other board — reproduced, see the file. |
| 10 Archive | Day one | `/archive-day-one` | |
| 12 Pack List | Nothing owned | `/nothing-owned` | **Pack names, art and prices are placeholders.** |
| 15 Shop | Store unreachable | `/store-unreachable` | Retry does not re-query RevenueCat yet. |
| 18 Stats | Empty | `/stats-empty` | The Stats screen a new player actually sees. |
| — | Splash | assets | Artwork generated from the design; app.json already pointed at it. |

**All eight of the routed ones are temporary.** Every one is a *state* of a screen,
not a destination, and each becomes a branch of its parent when the storage and
guess layers land (`plans/05` §6). Nothing in the product should ever navigate to
one. They are registered in `app/_layout.tsx` under a comment that says so.

---

## Not a product screen

| Screen | Route | State |
|---|---|---|
| Token probe | `/token-probe` | ✅ Built. **Delete once signed off.** |
| Temporary link row | bottom of Daily | Now 22 entries in three labelled groups: Screens / Overlays / States. **Delete with the probe.** |

---

## Suggested order for the next session

1. **Whatever the owner reported** after running the build. Always first — there are
   now 28 screens and none has been seen.
2. **Delete the token probe and the link row** once the palette is confirmed.
3. **`progress/05-known-issues.md`** — read before debugging anything. Two of its
   items (`ch` units, the splash artwork) were fixed in session 4; the rest stand.
4. **The storage layer and the real game state.** Every one of the nine alternate
   states is a branch this code has to produce, and all nine now exist to build
   against — which is the point of having done them first.
5. **Screens 10, 12, 13, 15 and overlays D, G, H** — the archive index and the paid
   surface, with RevenueCat. The empty states are already built, so what is left is
   the populated versions.
