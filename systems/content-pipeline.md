# System: Content Pipeline

**Owner of:** the puzzle data model, authoring workflow, validation, bundling, daily selection, and OTA delivery.
**Status:** Draft

---

## 1. Data model

```ts
type PuzzleId = string;              // stable, never reused: "d-0184", "p-kitchen-07"

type Puzzle = {
  id: PuzzleId;
  answer: string;                    // canonical, lowercase
  accepted: string[];                // additional accepted forms (plurals, variants)
  words: [Word, Word, Word];
  difficulty: 1 | 2 | 3 | 4 | 5;
  category: string;                  // i18n key for the Category Nudge
  locale: 'en';                      // see §7
  tags?: string[];                   // theme tags for pack assignment
};

type Word = {
  text: string;                      // displayed uppercase, stored lowercase
  position: 'before' | 'after';      // relative to the answer — never shown to the player
};
```

**Invariants:**

- `id` is permanent. Renaming or reusing an id corrupts every user's solve history.
- `answer` is lowercase; the UI uppercases for display.
- `accepted` never includes the canonical answer (it's implied).
- At least one word must be `before` and one `after` where the theme allows — puzzles where all three sit on the same side are valid but flatter, and should be a minority.

### Example

```json
{
  "id": "d-0001",
  "answer": "wood",
  "accepted": [],
  "words": [
    { "text": "fire",  "position": "before" },
    { "text": "work",  "position": "after"  },
    { "text": "land",  "position": "after"  }
  ],
  "difficulty": 1,
  "category": "category.material",
  "locale": "en",
  "tags": ["fireside"]
}
```

---

## 2. Where content lives

New workspace package so content is versioned and validated independently of the app:

```
packages/content/
  src/
    puzzles/
      daily.json          // ordered — index = day offset
      tutorial.json
      packs/
        cozy-kitchen.json
        garden-stroll.json
        fireside-read.json
        cup-of-comfort.json
        around-the-world.json
    manifest.json         // { version, counts, checksums }
    index.ts              // typed exports
  scripts/
    validate.ts           // the quality gate (§4)
    lexicon/              // reference word list + frequency data
  package.json
```

`apps/native` imports `@word-hug/content`. Metro bundles the JSON into the binary, so a fresh offline install is fully playable.

---

## 3. Authoring workflow

**Puzzles are AI-generated, machine-validated, and human spot-reviewed.**

### 3.1 Build order

The validator is built **before** any puzzles are generated. This is not a preference. An LLM generating Missing Link puzzles produces confident, plausible, wrong output at volume — `thunderstrike` is in the original spec because it *reads* like a word. Without the gate, bad puzzles enter the bank faster than a human can find them.

```
1. Build packages/content/scripts/validate.ts and the lexicon  ← first
2. Tune the generation prompt against the validator on a 50-puzzle pilot
3. Generate in batches of ~100
4. Validate; discard failures; log failure reasons
5. Lucky reviews a random 10% of survivors
6. Commit; bump manifest version
```

### 3.2 Generation

Batches of ~100. Each batch is given: a target difficulty distribution, a theme (for packs) or "general" (for daily), and the full list of answers already used, to suppress repetition.

**Expected yield: 50–70% after the first few batches.** Budget ~1,500 candidates to land 750 shipped puzzles. The failure log is the tuning signal — if 40% are failing uniqueness, the prompt needs to ask for more constrained clue sets.

### 3.2.1 Screen clue words first

Clue productivity — how many words form a compound with it — varies by two orders of magnitude and is measurable with a single query per word:

| Clue | Candidates |
|---|---|
| `strike` | 1 |
| `storm` | 11 |
| `fire` | 46 |
| `work` | 69 |
| `land` | 205 |

Too few and no answer can satisfy all three clues. Too many and collisions become likely. **Score every candidate clue word before generation and keep only the moderately productive ones.** Maintain a blocklist of dead clues (STRIKE is already on it). This is the cheapest available lever on the rejection rate.

### 3.3 Known LLM failure modes

The validator exists specifically to catch these. Listed so nobody is surprised by the rejection rate:

| Failure | Description | Caught by |
|---|---|---|
| **Invented compounds** | Asserts `thunderstrike` is a word | Lexicon check |
| **Multiple valid answers** | Doesn't notice a second word fits all three clues | Uniqueness search |
| **Self-rated difficulty** | "Difficulty 2" is a guess with no grounding | Frequency-derived override |
| **Global repetition** | The same answers and shapes recur across hundreds of puzzles | Duplicate-answer check across the whole bank |
| **Regionalism blindness** | Mixes `carpark` and `parking lot` freely | Regionalism flag list |
| **Phrase stretching** | "fire sale" is fine, "fire opinion" is not | Frequency floor on the resulting compound/phrase |

### 3.4 Human review

Lucky reviews a random 10% of every batch that survives validation. Reviewing is not for correctness — the validator handles that — but for **feel**: is this puzzle satisfying? Is the category nudge helpful without giving it away? Is the difficulty honest?

With no analytics in the product (PRD §10), this review is the **only** human judgement applied to content before it reaches users. Do not skip it under schedule pressure.

### 3.5 Commit gate

1. `pnpm --filter @word-hug/content validate` runs the quality gate.
2. Validation failures block the commit (pre-commit hook + CI).
3. On merge, `manifest.json` version is bumped and checksums regenerated.

---

## 4. The quality gate

`validate.ts` rejects a puzzle if any check fails:

| Check | Rule |
|---|---|
| **Compound validity** | For each word, `answer+word` or `word+answer` (per `position`) must exist in the reference lexicon, or be a whitelisted two-word phrase |
| **Uniqueness** | No other lexicon entry satisfies all three words. If one exists, it must be added to `accepted` or the puzzle is rejected. |
| **Source frequency** | Each source word is above a frequency floor — no obscure words as clues |
| **Answer frequency** | The answer is a common word |
| **Obscure compound** | Every resulting compound is above a lower frequency floor. *This check would reject the original spec's `thunderstrike` example.* |
| **Regionalism** | Compounds flagged as region-specific (`carpark`, `torch`) are rejected or flagged for review |
| **Id uniqueness** | No duplicate ids across all files |
| **Id stability** | Ids present in the previous manifest still exist and have unchanged `answer` |
| **Completeness** | `difficulty`, `category`, `position` on all three words are populated |
| **Category key exists** | `category` resolves in `en.json` |
| **Duplicate answers** | Reject if the same answer already exists anywhere in the bank |
| **Difficulty override** | Recompute difficulty from answer + compound frequency; reject if the generator's self-rating is off by more than 1 |

**Difficulty is derived, not declared.** The generator's self-rating is treated as a hint only. Since there is no analytics feedback loop (PRD §9.3), the rating must come from objective frequency data or it will never be corrected.

**Lexicon:** a permissively licensed English word list plus a frequency corpus (e.g. a wordfreq-derived table). Bundled into `packages/content/scripts/lexicon/`, not shipped in the app.

**Stack: Datamuse only.** Proven by the spike — see `plans/02-lexicon-options.md` §6.

| Job | Query |
|---|---|
| Compound existence | `sp=<term>&qe=sp&md=f` — plus the `spellcor:` tag as a "not really a word" signal |
| Uniqueness | `sp=*<clue>` or `sp=<clue>*`, intersected across all three clues |
| Frequency & difficulty | `md=f` → occurrences per million → `zipf = log10(f) + 3` |

No WordNet download, no wordfreq, no Python, no API key, no licence question. Build-time only; responses cached to `.cache/datamuse/`.

Difficulty from the answer's Zipf: 1 = ≥5.0, 2 = 4.5–5.0, 3 = 4.0–4.5, 4 = 3.5–4.0, 5 = 3.0–3.5, **below 3.0 rejected**.

### The critical rule: frequency, not existence

`thunderstrike` **is in the dictionary** — Wiktionary defines it, marked "now rare." An existence check accepts it. Only frequency rejects it (`f:0.000000` vs `thunderstorm`'s `0.821`). Any validator built on a word list alone would have shipped the exact bug it exists to prevent.

### Compounds, not phrases

A pairing qualifies only if the **joined spelling is real**. When it is, all spellings are summed (`airstrike` 0.011 + `air strike` 0.254). When it isn't, it's a phrase and is rejected (`hunger strike` is common; `hungerstrike` is not a word).

Consequence: some clue words are disqualified wholesale. Every compound ending in `strike` is below the floor, so STRIKE cannot be used at all. Expect the validator to rule out clue words, not just puzzles.

---

## 5. Daily selection

**Bundle order defines the schedule.** `daily.json` is an ordered array; index = day offset.

```
dayIndex = daysBetween(EPOCH, today)
puzzle   = bank.daily[dayIndex]
```

- `EPOCH` is a fixed launch date constant, identical for every user. It is **not** the user's install date — that would give two users different puzzles on the same day and break any future sharing or word-of-mouth ("did you get today's?").
- `today` is device-local calendar date, clamped by the high-water-mark guard in `systems/storage-persistence.md` §5.
- The archive uses the same function in reverse: a date maps to exactly one puzzle, forever.

**Because the schedule is index-based, the daily bank is append-only.** Inserting a puzzle in the middle shifts every subsequent day and rewrites history. The validator enforces this by checking that the previous manifest's daily array is a prefix of the new one.

### Difficulty curve

The bank is authored so that `dayIndex % 7` lands on the intended weekday difficulty (PRD §3.2). The validator checks the curve and warns on deviation greater than ±1.

### Timezone

**Decided: device-local midnight.** A user who crosses timezones may see a date boundary shift; the high-water guard prevents them gaining more than one extra puzzle. Accepted — the alternative (UTC) means a user in Sydney gets "today's" puzzle at 10am, which breaks the morning-coffee ritual the product is built on.

---

## 6. OTA content updates

### Manifest

```json
{
  "version": 12,
  "minAppVersion": "1.0.0",
  "counts": { "daily": 545, "packs": 150, "club": 52 },
  "checksums": { "daily": "sha256-…" }
}
```

### Flow

1. On app foreground, if `bank.lastCheckedAt` is older than 24h, fetch the manifest.
2. If `manifest.version > bank.version` and `minAppVersion` is satisfied, fetch the delta payload.
3. Validate the payload client-side: schema parse + checksum + append-only check against the local bank.
4. Merge into `wh.content` → `bank.overlay`. Resolution at read time is `overlay` layered over `bundled`, keyed by id.
5. Write the new `bank.version`. Update `lastCheckedAt` regardless of outcome.

### Rules

- **Additive only.** OTA never deletes a puzzle and never changes the `answer` of an existing id.
- **Silent failure.** Offline, timeout, malformed payload, checksum mismatch → log, keep the current bank, show nothing to the user. The core loop never depends on this succeeding.
- **No blocking.** The check never gates app launch or the daily screen render.
- **Delivery mechanism:** either an `expo-updates` bundle (simplest, ships content with a JS update) or a static JSON endpoint on a CDN. The static-JSON route is preferred — it decouples content releases from app releases entirely and avoids shipping a JS bundle just to add puzzles.

> Note: this supersedes the original spec's claim of "no content delivery network needed." A static file host is now part of the architecture.

---

## 7. Localisation of content

`Puzzle.locale` exists so a second language can be added without a schema change. It is `'en'` for every puzzle in v1.

The mechanic does not survive translation (see `plans/00-spec-critique.md` §2). A Spanish bank would be **authored natively in Spanish**, not translated — different words, different compounds, a different daily order. Two banks, two schedules, one app.

**Deferred to v2** — see `plans/99-backlog.md`.

It would need its own Spanish lexicon and frequency corpus, and a Spanish-speaking reviewer for the 10% sample. wordfreq covers `es`, and Datamuse has a 500k-term Spanish vocabulary (`v=es`) — but **Datamuse's `rel_*` relations are English-only**, so the uniqueness check has no direct Spanish equivalent and needs a different design. The generation step is the cheap part; validation and review infrastructure is the cost.

Until that bank exists, the app must not offer a language whose puzzles do not exist. The content system exposes `availableLocales()` derived from the bank, and Settings offers only those.

---

## 8. Running dry

If `dayIndex >= bank.daily.length`:

1. Show the warm "you've caught up" state.
2. Enter the evergreen loop: `bank.daily[(dayIndex - length) % evergreenSet.length]`, drawn from a curated high-quality subset, clearly labelled as a replay.
3. Solves in the evergreen loop count for streaks but are recorded with `source: 'archive'` so stats stay honest.

This should never be reached in production. Treat "days of daily bank remaining" as a tracked operational number, with content topped up via OTA well before the buffer runs out.

---

## 9. Open questions

- **Tune `MIN_COMPOUND_F`** (currently 0.05) against a hand-built set of known-good and known-bad puzzles. This single number decides the accept/reject rate and is the loosest knob in the pipeline.
- Does "compounds only, no phrases" leave enough addressable bank for 750 puzzles? Revisit after the pilot.
- Do pack puzzles need their own difficulty curve, or is a pack allowed to be uniformly gentle?
- Should the evergreen replay set be hand-curated or auto-selected by difficulty and age?
- What is the real first-batch yield? Revisit the 1,500-candidate budget after the 50-puzzle pilot.

> With no analytics, nobody will report that the daily bank ran dry. Put a calendar reminder against the bank's end date rather than relying on noticing.
