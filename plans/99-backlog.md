# Backlog — Deferred Past v1

Things explicitly decided *not* to build in v1, with enough context that picking them up later doesn't mean re-deciding from scratch.

Nothing here is a "maybe someday" wishlist. Each item was a live v1 candidate that was consciously cut.

---

## V2 — Spanish

**Decision:** deferred to v2. v1 ships English only.

**Why it was cut:** the mechanic doesn't translate. `thunderstorm` is one English word; *tormenta eléctrica* is two Spanish words with no shared element. Translating the answer produces non-words. A Spanish UI wrapped around English puzzles reads as broken software, so partial Spanish was never an option.

**What v1 already does to make this cheap later:**

- Full react-i18next layer built and tested, with one locale in it
- `Puzzle.locale` field exists in the schema — no migration needed
- `content.availableLocales()` drives the Settings language control, so a second locale appears automatically once its bank exists
- Copy tone constraints documented in `systems/i18n.md` §4 for briefing a translator

**What v2 actually costs — the translation is the cheap part:**

| Work | Notes |
|---|---|
| Native Spanish puzzle bank | ~550 puzzles, **authored in Spanish**, not translated. Spanish compounds (*sacacorchos*, *paraguas*, *cumpleaños*) and common collocations. |
| Spanish lexicon + frequency corpus | wordfreq covers `es`; Datamuse has a 500k-term Spanish vocabulary (`v=es`) — but note its `rel_*` relations are **English-only**, so the uniqueness check needs a different approach for Spanish |
| Spanish-speaking reviewer | The 10% human sample can't be done by a non-speaker |
| `es.json` translation | The genuinely cheap part |

**Open questions to answer at the time:**

- Are streaks global or per-locale once two banks exist? (`systems/i18n.md` §6)
- Does the Spanish daily schedule share an epoch with English, or run independently?
- Is the mechanic even viable in Spanish, or does it need to become semantic association (*sol / arena / ola* → *playa*)? **Validate this with 20 hand-written Spanish puzzles before committing to a bank.**

**Trigger to revisit:** English content pipeline proven and running smoothly, and evidence of Spanish-speaking demand.

---

## V2 — Hug Club subscription

**Decision:** deferred. Products not created; entitlement and archive-lock logic **are** built in v1.

**Why it was cut:** its main value is full archive access, and at launch the archive is empty. A subscription worth nothing on day one is bad value and bad for review sentiment.

**Trigger to ship:** 90+ days of accumulated archive, or a back-dated seeded archive that gives it day-one value.

**Cost when picked up:** create the RevenueCat products, add the storefront entry, un-stub `hasClub()`. Days, not weeks — that's the point of building the logic now.

---

## V2 — Cloud backup / sync

**Decision:** not in v1. Frontend-only, anonymous, no accounts.

**Why it matters later:** uninstalling loses streak, stats, and solve history permanently (purchases restore fine via RevenueCat). A user who reinstalls after two years loses everything except what they paid for. This is the single strongest argument against the no-backend stance.

**Cheapest version:** iOS `NSUbiquitousKeyValueStore` — near-free, no account, no server. Android has no clean equivalent, which is why this wasn't done in v1.

---

## Cut from onboarding — theme personalisation

**Decision:** removed. Was Step 4 of the original 7.

**Why:** its only job was personalising shop recommendations. With the welcome offer moved to the second visit and Hug Club deferred, there was nothing left for it to personalise, and it made onboarding longer for no user benefit.

**Reversible:** if pack merchandising later needs it, the step is small and the storage key (`prefs.themePicks`) is trivially re-added.

---

## Considered and rejected — analytics

**Decision:** none beyond Expo Insights installs. Not deferred — **rejected**.

**Why:** a deliberate product stance. Makes the privacy policy short and true, eliminates consent/GDPR work, and is a real differentiator for a product positioned on warmth.

**Accepted costs:** puzzle difficulty can never be corrected by data; onboarding and offer conversion are invisible; A/B testing is off the table. The replacement is direct user conversation — which has to actually happen, not just be intended. See `plans/01-prd.md` §9.3.
