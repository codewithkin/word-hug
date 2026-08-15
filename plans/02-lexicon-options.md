# Lexicon & Frequency Corpus — Options and Recommendation

**Date:** 2026-08-10
**Status:** ✅ **Resolved — Datamuse only.** Spike run and passing. See §8.
**Blocks:** nothing further

> **Outcome in one line:** the spike showed Datamuse alone does all three jobs.
> WordNet and wordfreq are **not needed**. No downloads, no Python, no API key,
> no licence question. Sections 2–6 below are retained as the reasoning trail.

---

## 1. What the validator actually needs

Three separate jobs, often conflated. Each may need a different source.

| Job | Question | Why it matters |
|---|---|---|
| **A. Compound existence** | Is `thunderstorm` a real word? Is `thunderstrike`? | Catches AI-invented compounds — the single most common failure |
| **B. Uniqueness** | Does any *other* word also pair with all three clues? | A puzzle with two valid answers is broken and infuriating |
| **C. Frequency** | How common are `wood`, `firewood`, `woodland`? | Drives difficulty (1–5) and rejects obscure clues |

Job B is the hard one. It requires enumerating candidate answers, not just checking one — you need to ask "what words commonly follow FIRE?" and intersect three such sets.

**Critical framing: every one of these runs at build time, in CI, on a developer machine.** The shipped app contains ~750 puzzles — short factual word triples — and no corpus, no word list, no lookup table. This matters enormously for licensing (§4).

---

## 2. The options

### For Job A — compound existence

| Source | Licence | Covers compounds? | Verdict |
|---|---|---|---|
| **WordNet 3.0/3.1** (Princeton) | Permissive, OSI-approved, commercial use explicitly allowed with attribution | Yes — ~155k lemmas including multi-word entries (`thunderstorm`, `fire_escape`) | ✅ **Strong** |
| **Wiktionary** via wiktextract / kaikki.org | CC-BY-SA 4.0 | Yes, and far more modern than WordNet | ✅ Good secondary |
| **SCOWL / hunspell en_US** | MIT-style, permissive | Single words only, no phrases | ⚠️ Partial — no phrase support |
| **ENABLE / dwyl `english-words`** | Public domain / unlicensed | Yes but *too* permissive — full Scrabble vocabulary | ❌ Would accept obscure junk as valid |

**Note on Scrabble lists:** they are the intuitive choice and the wrong one. A Scrabble dictionary says `zorse` and `qanat` are words. For a cozy game where the answer must feel *obvious in hindsight*, an over-permissive lexicon is worse than a restrictive one — it lets bad puzzles through and generates false uniqueness collisions.

### For Job B — uniqueness search

| Source | Licence / terms | Fit | Verdict |
|---|---|---|---|
| **Datamuse API** `rel_bga` / `rel_bgb` | Free, no key, 100k req/day until 2027-01-01; key required after; attribution requested | **Purpose-built.** `rel_bga=fire` returns words that frequently follow "fire"; `rel_bgb` returns frequent predecessors. Intersecting three of these *is* the uniqueness check. | ✅ **Strong, with caveats** |
| **Google Books Ngrams (2-grams)** | "May be freely used for any purpose", acknowledgement appreciated | Full offline bigram frequency. No API dependency. | ✅ Good, much more work |
| **Derive from WordNet + brute force** | — | Enumerate every lemma, test all three concatenations. Slow but tractable at 155k lemmas. | ⚠️ Workable fallback, misses phrases |

### For Job C — frequency and difficulty

| Source | Licence | Verdict |
|---|---|---|
| **wordfreq** (Python, rspeer) | Code Apache 2.0; **data CC-BY-SA 4.0** | ✅ **Strong.** `zipf_frequency('word','en')` on a clean 0–8 log scale — ideal for deriving a 1–5 difficulty. Covers `en` and `es`. |
| **SUBTLEX-US** | Free, academic + commercial by permission | Bundled inside wordfreq already |
| **Google Books Ngrams (1-grams)** | Free for any purpose | Fine, but wordfreq already blends this plus 7 other sources |

**Caveat on wordfreq:** it is **sunset**. Data is a snapshot through ~2021 and will not be updated. For our purpose — how common is the English word "wood" — that is completely fine. Language does not shift fast enough for it to matter.

**Caveat on wordfreq's licence:** the author explicitly refuses CSV export of the data, because CSV strips attribution and breaks CC-BY-SA. We must use the library as a library. That is what we want anyway.

---

## 3. Recommended stack

Three tools, each doing the job it is best at.

```
Job A  compound existence  →  WordNet 3.1  (+ Wiktionary as a second opinion)
Job B  uniqueness search   →  Datamuse rel_bga / rel_bgb
Job C  frequency/difficulty→  wordfreq (Python)
```

### Why this combination

- **WordNet is the safest licence in the set** — permissive, OSI-approved, explicitly commercial-friendly, and redistributable. If anything ever *does* need to ship in the app, this is the one that can.
- **Datamuse turns Job B from a research problem into an HTTP request.** `rel_bga` and `rel_bgb` are literally "words that frequently follow / precede this word," computed over a 550k-term vocabulary that includes multi-word expressions. This is the exact shape of the Missing Link mechanic. It is also excellent for *generating* candidates, not just validating them — intersect the follower sets of three words and you get answer candidates directly.
- **wordfreq's Zipf scale maps cleanly onto difficulty.** Zipf 6 = once per thousand words, Zipf 3 = once per million. A difficulty band is a Zipf range, which makes §3.2's difficulty curve objective rather than vibes.

### Suggested difficulty mapping (to be tuned on the pilot batch)

| Difficulty | Zipf of the answer word | Feel |
|---|---|---|
| 1 | ≥ 5.0 | Everyday word, instant |
| 2 | 4.5 – 5.0 | Common |
| 3 | 4.0 – 4.5 | Familiar but needs a beat |
| 4 | 3.5 – 4.0 | Reachable, satisfying |
| 5 | 3.0 – 3.5 | Genuinely hard |
| — | < 3.0 | **Reject** — too obscure for this product |

---

## 4. The licensing question, answered

**All three tools run at build time. None of their data ships in the app.**

The app binary contains ~750 puzzle objects: three clue words, an answer, a difficulty integer, a category key. These are short factual statements, not extracts from any corpus. Using a CC-BY-SA dataset to *check* that "thunderstorm" is a word does not make the resulting puzzle a derivative work of that dataset, any more than using a spell-checker makes a novel a derivative of the dictionary.

This means:

- **wordfreq's CC-BY-SA ShareAlike obligation is not triggered** — we never redistribute the data
- **Wiktionary's CC-BY-SA likewise** — build-time reference only
- **WordNet is redistributable anyway**, so it is the safe fallback if any of this reasoning is ever challenged
- **Datamuse's "customer-facing application" clause** is about apps that call the API at runtime. Ours does not — the shipped app makes zero Datamuse requests.

**Recommended posture despite the above:**

1. Add a **credits/acknowledgements section** in Settings (or on the marketing site) naming WordNet, wordfreq, and Datamuse. It costs one screen, it is polite, and it forecloses the argument entirely.
2. Send Datamuse a short note describing the build-time usage. Their terms invite it, they are friendly, and a two-sentence email removes ambiguity permanently.
3. Keep all corpus files in `packages/content/scripts/lexicon/` and **gitignore anything with a ShareAlike licence** so it never lands in a distributed artefact by accident.

> ⚠️ This is my reading of the licences, not legal advice. The stack chosen is deliberately the conservative one — WordNet's permissive licence is doing the heavy lifting precisely so that this reasoning never has to be tested. If the app ever ships a corpus at runtime, revisit properly.

---

## 5. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Datamuse free tier changes** — key required from 2027-01-01 | Medium | Build-time only, so an outage never affects users. Get a key when required. Cache all responses to disk so a validation re-run costs zero requests. |
| **Datamuse rate limit** during bulk generation | Low | 100k/day; ~1,500 candidates × ~6 queries ≈ 9k requests. Comfortably inside. Cache anyway. |
| **wordfreq is unmaintained** | Low | Data is a 2021 snapshot; English word frequency is stable. Pin the version. |
| **WordNet is dated (2006)** and misses modern compounds | Medium | Use Wiktionary as a second opinion before rejecting. Better to be conservative — a rejected good puzzle costs nothing, an accepted bad one ships. |
| **Validator is Python, repo is TypeScript** | Low | Run the lexicon step as a Python script that emits a JSON allowlist; the TS validator consumes that. Keeps the toolchain boundary clean. |

---

## 6. Spike — what actually happened

Built as `scripts/puzzle-check.mjs`. Zero dependencies, Node 18+, ~300 lines.

### Result: the stack collapsed to one tool

| Job | Planned | Actual |
|---|---|---|
| Compound existence | WordNet download | `sp=<term>&qe=sp&md=f` |
| Uniqueness | Datamuse `rel_bga`/`rel_bgb` | `sp=*<clue>` / `sp=<clue>*` — **better** |
| Frequency & difficulty | wordfreq (Python) | `md=f` metadata flag |

**WordNet and wordfreq are not needed.** No downloads, no Python in the monorepo, no CC-BY-SA data anywhere near the repo, no licence analysis required. §4 is now moot.

### Three findings

**1. `rel_bga`/`rel_bgb` were the wrong tool. Wildcard search is the right one.**

`rel_bgb=storm` returns bigram predecessors ranked by frequency — and the top ten are `the, a, by, of, to, and…`. Usable only after heavy stopword filtering.

`sp=*storm` instead enumerates every *word* ending in "storm" with a frequency on each. That is precisely the compound-puzzle question, asked directly. Same for `sp=fire*` in the other direction. One request per clue, no filtering heuristics.

**2. Existence is not the gate. Frequency is.**

`thunderstrike` **is in the dictionary** — Wiktionary gives it three definitions, marked "now rare." Any existence-based check accepts it. What rejects it:

| Signal | `thunderstorm` | `thunderstrike` |
|---|---|---|
| `f:` (per million) | 0.821043 | 0.000000 |
| `spellcor:` tag | absent | `spellcor:thunderstroke` |

The `spellcor:` tag means Datamuse could not find the term and spell-corrected to reach it — a strong secondary signal that the word is not really in use.

**This invalidates the original plan's premise.** A WordNet or Wiktionary lookup would have passed `thunderstrike` and shipped the exact bug the validator exists to prevent.

**3. Frequency is split across spellings.**

`airstrike` is `f:0.011`; `air strike` is `f:0.254`. Same word, counted separately by Google Books, and the joined form alone falls under any sensible floor. Compounds must be looked up in all three spellings — joined, spaced, hyphenated — and summed.

The joined spelling is also what distinguishes a compound from a phrase: `hunger strike` is common but `hungerstrike` is not a word, so it is a phrase and does not qualify. This gives a clean, cheap rule (see §7).

### Both controls behave correctly

**Negative control — the spec's own flagship example:**

```
FIRE / STORM / STRIKE → THUNDER          REJECT
  thunderfire    f=0.0000   spell-corrected
  thunderstorm   f=0.8210   pass
  thunderstrike  f=0.0000   spell-corrected
  uniqueness: 1 candidate pairs with "strike" → intersection empty
```

Two of the three compounds in the published spec are not words.

**Positive control:**

```
FIRE / WORK / LAND → WOOD                ACCEPT
  firewood       f=1.7224   pass
  woodwork       f=0.7970   pass
  woodland       f=2.9026   pass
  uniqueness: 46 ∩ 69 ∩ 205 → {wood}     exactly one answer
  difficulty: 2/5 (common), zipf 4.65
```

A validator that rejects everything is worthless, so this second run mattered more than the first. It accepts a good puzzle, finds exactly one valid answer out of hundreds of candidates, and derives a difficulty that matches intuition.

**The pipeline is proven. Generation can start.**

### Two things the runs revealed

**STRIKE is not a viable clue word at all.** Every single-word compound ending in it — `airstrike`, `counterstrike`, `restrike`, `flystrike` — is below the floor, and the common ones (`hunger strike`, `general strike`) are phrases. Expect the validator to disqualify clue words wholesale, not just individual puzzles. Maintaining a running blocklist of dead clue words will save generation budget.

**Clue productivity varies enormously and should steer generation.**

| Clue | Candidates that pair with it |
|---|---|
| `strike` | 1 |
| `storm` | 11 |
| `fire` | 46 |
| `work` | 69 |
| `land` | 205 |

Too few candidates and no answer can satisfy all three clues. Too many and collisions become likely. **The sweet spot is moderate productivity**, and this is measurable before a puzzle is even written — one query per clue word. A pre-pass that scores every candidate clue by productivity would cut the rejection rate substantially.

---

## 7. Rule: compounds, plus spelling variants, not phrases

Decided during the spike.

| Form | Counts? | Why |
|---|---|---|
| `firewood` | ✅ | Joined compound |
| `airstrike` + `air strike` | ✅ summed | Joined form is real, so the spaced form is a variant of one word |
| `hunger strike` | ❌ | `hungerstrike` is not a word — this is a phrase |

**Rule:** a pairing qualifies only if the **joined spelling exists**; when it does, all spellings' frequencies are summed.

Rationale: the satisfaction in Missing Link comes from the answer *clicking*. `firewood / woodwork / woodland` clicks. Three things that can precede a noun do not, and free phrases multiply the ways a second answer can fit — ambiguity being the expensive failure for a product promising no frustration.

Cost: shrinks the addressable bank and disqualifies clue words like STRIKE. **Revisit if pilot yield is too low** — this is the loosest knob in the pipeline and the easiest to reverse.

> Note the original spec says "compound words **or phrases**." This narrows that deliberately. PRD §2.1 should be updated to match.

---

## 8. Settled

- ✅ Stack: **Datamuse only**
- ✅ No API key needed until 2027-01-01; build-time use only, so a key change can never affect users
- ✅ Node, not Python — no toolchain split
- ✅ Responses cached to `.cache/datamuse/`, gitignored; re-validation costs zero requests
- ✅ 15 requests for a fresh puzzle, measured → ~11k for a 750-puzzle bank, against a 100k/day limit
- ✅ Caching confirmed working — the second run of the same puzzle cost 6 requests instead of 16

Still worth doing: add a credits line naming Datamuse (their terms request acknowledgement), and send them a short note describing the build-time usage.

---

## 9. What is still unproven

Two controls is a smoke test, not calibration. Before bulk generation:

**`MIN_COMPOUND_F` has never been tested near its boundary.** Every compound in the passing run cleared it by more than an order of magnitude — `woodwork` 0.797, `firewood` 1.72, `woodland` 2.90 against a floor of 0.05. Every failing compound was 0.0000. Nothing has landed in the 0.02–0.2 band where the threshold actually decides. Until a puzzle sits near the line, the floor is an untested guess.

**Needed:** a ~20-puzzle calibration set with deliberately marginal cases, run as a batch, with the accept/reject boundary inspected by hand.

**Also unproven:** the real yield rate. The 30–50% rejection estimate is a guess. Only a first generated batch will show it, and it determines whether 750 puzzles costs 1,500 candidates or 3,000.

---

## Sources

- [WordNet — License and Commercial Use, Princeton University](https://wordnet.princeton.edu/license-and-commercial-use)
- [WordNet License — Open Source Initiative](https://opensource.org/license/wordnet)
- [rspeer/wordfreq — GitHub](https://github.com/rspeer/wordfreq)
- [wordfreq — PyPI](https://pypi.org/project/wordfreq/)
- [Datamuse API documentation and terms](https://www.datamuse.com/api/)
