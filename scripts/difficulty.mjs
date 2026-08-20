/**
 * ── The difficulty model ──────────────────────────────────────────────────
 * Scores one Missing-Link puzzle for how hard it is to *solve*, on a
 * continuous 0–100 scale. Shared by `build-levels.mjs` (which sorts the bank
 * with it) and `level-check.mjs` (which asserts the result is a real ramp).
 *
 * ── Why the old model was wrong ───────────────────────────────────────────
 * The first version scored word **frequency**: common answer and common clues
 * meant easy. It rated `book`, `side`, `time`, `line`, `back` and `work` as
 * difficulty 1 — the easiest tier — and put `book` at level 1, where the owner
 * could not solve it.
 *
 * Frequency is not merely a weak signal here. For the answer slot it is
 * partly **inverted**. `time` is one of the hundred commonest nouns in English
 * and one of the worst possible answers: it is abstract, it forms scores of
 * compounds, and knowing `___table`, `some___` and `life___` does not make you
 * picture anything. `snowball` does. The thing that makes a Missing-Link
 * puzzle easy is not that its words are common, it is that its three compounds
 * are **familiar as objects** and point at the same picture.
 *
 * ── What actually drives difficulty, in rough order of weight ─────────────
 *  1. **Slot position mixing.** `__ CASE / NOTE __ / __ MARK` asks the player
 *     to hold two different sentence frames at once. Three clues on the same
 *     side is one frame learned once. This was worth −0.4 in the old model,
 *     which is roughly a tenth of what it is worth in the hand.
 *  2. **Compound familiarity.** Is `snowball` a thing you have seen a thousand
 *     times, or is `moonbeam` a word you would recognise but never reach for?
 *  3. **Semantic transparency.** A `honeymoon` is not a kind of moon. Opaque
 *     compounds are unreachable by meaning, so the player has to arrive by
 *     letters, which is a different and much harder game.
 *  4. **Answer concreteness.** A picturable physical noun converges. An
 *     abstract or grammatical one does not.
 *  5. **Function words as clues.** `on`, `out`, `up`, `some`, `mid` combine
 *     with everything and mean nothing on their own, so they eliminate almost
 *     no candidates.
 *  6. **Answer promiscuity.** `back`, `out`, `side`, `line` and `set` sit in
 *     hundreds of compounds. Three clues do not narrow a hub word.
 *  7. Length and distinct-letter count — real, but small.
 *
 * ── The honest limitation ─────────────────────────────────────────────────
 * Features 2, 3 and 4 are **authored word lists**, not measurements. That is
 * the same class of proxy the old `COMMON` set was, and it deserves the same
 * suspicion. Two things make it defensible where the old one was not:
 *
 * · The lists encode the property that actually matters (is this compound a
 *   household object) rather than a property that correlates with it badly
 *   (is this word frequent).
 * · A word **missing** from a list is scored as "unknown", not as "hard".
 *   The old model charged +1.8 for absence, which is why fifty perfectly
 *   ordinary kitchen levels came out as difficulty 5 the moment the bank grew
 *   past the list.
 *
 * The real fix is corpus frequency for every answer, clue and compound.
 * `scripts/fetch-corpus.mjs` fetches exactly that from Datamuse into
 * `scripts/corpus-cache.json`, and `frequencyFor()` below prefers the cache
 * over the authored tiers whenever it exists. Until someone runs it, the
 * authored lists are the calibration — and the cache is additive, so running
 * it later cannot make anything worse.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

// ── Corpus cache (optional) ────────────────────────────────────────────────

/**
 * `{ [word]: zipf }` from `fetch-corpus.mjs`, or `{}`.
 *
 * Zipf is a log10 scale: 7 is `the`, 5 is `water`, 3 is `moonbeam`, 1 is
 * essentially unattested. It is the right shape for this because a difference
 * of one Zipf point is a factor of ten in how often a player has met the word,
 * which is much closer to how recognition actually behaves than a raw count.
 */
export const CORPUS = (() => {
  const path = join(HERE, 'corpus-cache.json');
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8')).zipf ?? {};
  } catch {
    return {};
  }
})();

export const HAS_CORPUS = Object.keys(CORPUS).length > 0;

// ── Authored lists ─────────────────────────────────────────────────────────

/**
 * Picturable physical things. A four-year-old could point at one.
 *
 * This is the answer-slot list, and it is the one that matters most: a puzzle
 * whose answer is on this list has a target the player can converge *towards*,
 * rather than a word they can only arrive at by elimination.
 */
const CONCRETE = new Set(
  `ball bird boat bone book bowl box bread brick bridge broom brush bug cake car card cat
   chain chair cheese clock cloud coat corn cow crab cup dog door duck egg eye farm feather
   finger fire fish flower fork fox frog fruit garden gate glass goose grape grass hair hammer
   hand hat head heart hill hook horn horse house ice jar key knife ladder lamp leaf leg
   letter lock log mail milk moon mouse mud nail nest net nose nut oil page paint pan paper
   pea pen pencil pie pig pillow pin pipe plate pot rabbit rain rat ring river road rock
   roof root rope rose salt sand saw sea seed sheep shell ship shoe shop skin sky snow soap
   sock spoon star stone stove straw string sugar sun table tail tea tent thumb tie tooth
   torch towel tree truck wall watch water wave wheel window wing wolf wood wool worm yard`
    .split(/\s+/)
    .filter(Boolean)
);

/**
 * Grammatical words and bare particles. Terrible clues, terrible answers.
 *
 * `out`, `over`, `down` and `back` are all currently *answers* in the free
 * bank. They are legitimate puzzles and they stay — they just belong at level
 * 44, not level 4, which is the whole point of scoring them honestly.
 */
const FUNCTION_WORDS = new Set(
  `a an the on off in out up down over under after before by for from to with
   some any no not all both each every other another same such more most less
   least much many few own so than then there here now just only very back
   mid main super semi anti non pre post multi self`
    .split(/\s+/)
    .filter(Boolean)
);

/**
 * Words that combine with almost anything.
 *
 * Three clues narrow a normal word to one candidate. They do not narrow a hub:
 * `___ground`, `back___` and `___pack` leave the player with a dozen live
 * options, and being told the category does not help either.
 */
const HUB_WORDS = new Set(
  `back out over under down up side line time work way set man house ground land
   board case point end run off on top head hand light water air field house
   room life word play book house form part place hold`
    .split(/\s+/)
    .filter(Boolean)
);

/**
 * Compounds a person meets constantly, written solid.
 *
 * The single strongest easiness signal in the model. A puzzle whose three
 * compounds are all on this list is solvable by recognition alone, which is
 * exactly what the opening levels need to be.
 *
 * Only genuinely household items are here. When in doubt it was left off —
 * absence scores as "unknown" rather than "hard", so a false omission costs a
 * puzzle a little sharpness in its rating, while a false inclusion would put
 * something unsolvable at level 2.
 */
const FAMILIAR_COMPOUNDS = new Set(
  `snowball snowflake snowman snowfall snowstorm snowdrift
   sunflower sunshine sunrise sunset sunlight sunburn sunglasses
   rainbow raincoat raindrop rainfall rainstorm
   seafood seashore seaside seashell seaweed seasick
   football footprint footstep footpath foothill
   starfish starlight stardust
   birdcage birdsong birdbath birdhouse
   eyeball eyebrow eyelash eyelid
   airport airplane airline airbag
   moonlight moonbeam moonwalk
   keyboard keyhole keychain keyring
   headache headlight headphone headband headline
   cupcake cupboard
   milkshake milkman milkmaid
   fishbowl fishhook fishnet fishtank goldfish catfish
   woodwork woodland woodpecker firewood
   housework household houseboat greenhouse lighthouse
   waterfall watermelon waterproof underwater
   cowboy cowgirl cowshed
   toothbrush toothpaste toothache
   bedroom bedtime bathroom bathtub
   doorbell doorway doorstep
   sandcastle sandpaper
   butterfly butterscotch
   pancake pandemonium
   popcorn cornfield
   railroad roadside roadblock crossroad
   notebook bookcase bookmark bookshelf bookworm
   handbag handshake handwriting handmade
   campfire fireplace fireworks firefly firetruck
   limestone stonewall cornerstone
   playground background underground
   postcard cardboard
   briefcase suitcase
   wristwatch watchdog
   crossword password wordplay
   homework workshop network
   scarecrow scarelight
   nightmare nightfall
   teapot teaspoon teacup
   rooftop rooftile
   horseshoe horseback
   lipstick candlestick
   fingerprint fingernail
   necklace neckline
   pillowcase
   windmill windshield
   flowerpot flowerbed
   treehouse treetop
   shoelace shoebox
   raincloud thundercloud
   backpack backyard backbone
   downstairs downtown countdown
   outside outbreak blackout
   overcoat overhead leftover
   bathmat roommate
   highway gateway sideway
   mankind postman snowman
   boyfriend girlfriend friendship
   sidewalk

   newspaper wallpaper paperback paperclip
   mailbox sandbox
   blackbird stopwatch
   ballroom teacup catfish barefoot
   midnight daylight
   landmark mainland
   lifeline
   limestone cornerstone railroad
   houseboat greenhouse lighthouse
   campfire fireplace fireworks
   woodland woodwork`
    .split(/\s+/)
    .filter(Boolean)
);

/**
 * Compounds whose meaning is not the sum of their parts.
 *
 * A `honeymoon` is not a moon; a `deadline` is not a line. These cannot be
 * reached by thinking about the picture, only by recognising the string, so
 * they are much harder than their familiarity suggests — `honeymoon` is a very
 * common word and a very hard clue. Scored separately from familiarity for
 * exactly that reason.
 */
const OPAQUE_COMPOUNDS = new Set(
  `honeymoon deadline outline online offline lifetime sometime overtime
   understand outstanding withstand background overlook outlook
   bullseye highlight limelight spotlight moonshine
   nightcap nightlife brainstorm bandwagon
   breakfast handsome mainland shortcut
   password overhead leftover offhand`
    .split(/\s+/)
    .filter(Boolean)
);

// ── Frequency ──────────────────────────────────────────────────────────────

/**
 * Zipf frequency for a word: the cache if it has one, else an authored tier.
 *
 * The tiers are coarse on purpose. They exist to stop the model treating
 * "not in my list" as "vanishingly rare", which is the failure that broke the
 * previous version. An unknown word gets 3.5 — squarely mid-range, so absence
 * moves the score barely at all.
 */
const TIER_A = new Set(
  `the be to of and a in that have it for on with as you do at this but by from they we
   water fire wood house home time man day night sun moon star sky sea land road book
   hand head foot eye ball dog cat fish bird tree snow rain wind car door key box cup
   milk bread cake egg paper card game work play room bed bath side line back out over`
    .split(/\s+/)
    .filter(Boolean)
);

export function frequencyFor(word) {
  const cached = CORPUS[word];
  if (typeof cached === 'number') return cached;
  if (TIER_A.has(word)) return 5.2;
  if (CONCRETE.has(word)) return 4.4;
  if (FUNCTION_WORDS.has(word)) return 5.8;
  return 3.5;
}

// ── Compounds ──────────────────────────────────────────────────────────────

/**
 * The three solid words a puzzle makes.
 *
 * `position: 'before'` means the **clue** comes before the answer, so
 * `note` + `book` → `notebook`. `'after'` puts the answer first:
 * `book` + `case` → `bookcase`. Getting this backwards silently inverts every
 * familiarity lookup in the model, which is why it is one function and not
 * three inlined template strings.
 */
export function compoundsOf({ answer, words }) {
  return words.map((w) => (w.position === 'before' ? w.text + answer : answer + w.text));
}

// ── The score ──────────────────────────────────────────────────────────────

/**
 * 0–100, higher is harder. Continuous, deliberately.
 *
 * The old model returned an integer 1–5, which put 18 of the 50 free levels in
 * a single tie broken **alphabetically**. That is how `ball`, `book` and `cake`
 * ended up in the opening ten: not because they were the easiest, but because
 * b and c sort early. A continuous score means the sort has real information
 * all the way down and every tie-break is a genuine comparison.
 */
export function scoreOf(puzzle) {
  const { answer, words } = puzzle;
  const compounds = compoundsOf(puzzle);
  let s = 0;
  const why = [];

  const note = (points, label) => {
    if (points === 0) return;
    s += points;
    why.push(`${points > 0 ? '+' : ''}${points.toFixed(1)} ${label}`);
  };

  // ── 1. Position mixing ───────────────────────────────────────────────────
  // The biggest single lever on the opening levels.
  const sides = new Set(words.map((w) => w.position));
  if (sides.size > 1) {
    const before = words.filter((w) => w.position === 'before').length;
    // A 2–1 split is one odd clue out. A 3-way split is impossible with three
    // clues, so 2–1 is the only mixed shape there is; it still costs a lot.
    note(14, `mixed slot positions (${before} before, ${3 - before} after)`);
  }

  // ── 2. Compound familiarity ──────────────────────────────────────────────
  const familiar = compounds.filter((c) => FAMILIAR_COMPOUNDS.has(c)).length;
  note(-13 * familiar, `${familiar} household compound${familiar === 1 ? '' : 's'}`);
  // Never having met any of the three is the real "I am stuck" condition.
  if (familiar === 0) note(10, 'no compound is a household word');

  // ── 3. Opacity ───────────────────────────────────────────────────────────
  const opaque = compounds.filter((c) => OPAQUE_COMPOUNDS.has(c)).length;
  note(11 * opaque, `${opaque} compound${opaque === 1 ? '' : 's'} not reachable by meaning`);

  // ── 4. Answer concreteness ───────────────────────────────────────────────
  if (FUNCTION_WORDS.has(answer)) note(20, 'answer is a grammatical word');
  else if (!CONCRETE.has(answer)) note(9, 'answer is not a picturable thing');
  else note(-6, 'answer is a picturable thing');

  // ── 5. Function-word clues ───────────────────────────────────────────────
  const fnClues = words.filter((w) => FUNCTION_WORDS.has(w.text)).length;
  note(9 * fnClues, `${fnClues} clue${fnClues === 1 ? '' : 's'} is a grammatical word`);

  // ── 6. Promiscuity ───────────────────────────────────────────────────────
  if (HUB_WORDS.has(answer)) note(8, 'answer combines with almost anything');
  const hubClues = words.filter((w) => HUB_WORDS.has(w.text) && !FUNCTION_WORDS.has(w.text)).length;
  note(3 * hubClues, `${hubClues} clue${hubClues === 1 ? '' : 's'} combines with almost anything`);

  // ── 7. Clue obscurity ────────────────────────────────────────────────────
  // Zipf below 3 is a word most players have met a handful of times. Charged
  // per clue and capped, because one odd clue is a puzzle and three is a wall.
  for (const w of words) {
    const z = frequencyFor(w.text);
    if (z < 3.0) note(6, `clue "${w.text}" is rare`);
    else if (z < 3.4) note(2.5, `clue "${w.text}" is uncommon`);
  }

  // ── 8. Shape ─────────────────────────────────────────────────────────────
  if (answer.length >= 7) note(5, 'long answer');
  else if (answer.length === 6) note(2.5, 'six letters');
  else if (answer.length <= 3) note(3, 'very short answer — many neighbours');

  const distinct = new Set(answer).size;
  if (distinct < answer.length) note(-2, 'a repeated letter narrows the keyboard');

  // Centre on ~35 so an average puzzle lands mid-scale and the extremes have
  // room, then clamp. The clamp is a display concern; the sort uses the raw
  // value, so two puzzles pinned at 100 still order correctly against each
  // other via `rawScore`.
  const raw = 35 + s;
  return { score: Math.max(0, Math.min(100, raw)), raw, why, compounds, familiar, mixed: sides.size > 1 };
}

/**
 * The 1–5 band shown on the level node.
 *
 * Fixed cut-points rather than quintiles of the current bank: a player's sense
 * of "this one was a 4" should not shift because fifty pack levels were added
 * around it. Bands are wide because the number is decoration — the ordering is
 * the product.
 */
export function bandOf(score) {
  if (score <= 18) return 1;
  if (score <= 32) return 2;
  if (score <= 48) return 3;
  if (score <= 66) return 4;
  return 5;
}

// ── The on-ramp gate ───────────────────────────────────────────────────────

/**
 * Is this puzzle fit to be one of the first few levels?
 *
 * Candy Crush's opening is not "the easiest levels we happened to generate" —
 * it is a hand-cut tutorial that cannot be failed. These are the hard gates a
 * puzzle must clear to sit in the on-ramp, checked separately from the score
 * so that a puzzle cannot sneak in on a good total while failing something
 * that actually stops a beginner dead.
 *
 * Returns the reasons it is unfit, so the build can say which gate failed
 * rather than just refusing.
 */
export function onRampFailures(puzzle) {
  const { answer, words } = puzzle;
  const { familiar, mixed } = scoreOf(puzzle);
  const out = [];

  if (mixed) out.push('clues are on different sides of the answer');
  if (familiar < 3) out.push(`only ${familiar}/3 compounds are household words`);
  if (!CONCRETE.has(answer)) out.push(`answer "${answer}" is not a picturable thing`);
  if (answer.length > 6) out.push(`answer "${answer}" is ${answer.length} letters`);

  for (const w of words) {
    if (FUNCTION_WORDS.has(w.text)) out.push(`clue "${w.text}" is a grammatical word`);
  }
  for (const c of compoundsOf(puzzle)) {
    if (OPAQUE_COMPOUNDS.has(c)) out.push(`"${c}" cannot be reached by meaning`);
  }

  return out;
}

export const LISTS = { CONCRETE, FUNCTION_WORDS, HUB_WORDS, FAMILIAR_COMPOUNDS, OPAQUE_COMPOUNDS };
