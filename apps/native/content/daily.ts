import type { Puzzle } from '@/lib/puzzles';

/**
 * ── The daily bank ────────────────────────────────────────────────────────
 * Implements the data model in `systems/content-pipeline.md` §1.
 *
 * **BUNDLE ORDER IS THE SCHEDULE** (§5). `dayIndex` indexes straight into this
 * array, so it is **append-only**: inserting a puzzle in the middle shifts
 * every later day and rewrites the history of everyone who has played. Add to
 * the end. Never reorder. Never reuse an `id`.
 *
 * ── What this bank is and is not ──────────────────────────────────────────
 * Six weeks of hand-written puzzles, enough to play the loop through and to
 * see the difficulty curve turn over twice. It is **not validated content.**
 * `scripts/puzzle-check.mjs` exists precisely because the two things a human
 * cannot do by eye are the uniqueness search (is there a *second* word that
 * hugs all three clues?) and the frequency-derived difficulty rating — and the
 * PRD is explicit that difficulty must come from data rather than a guess
 * (§3.2). Every `difficulty` below is a placeholder set to fit the weekly
 * curve, not a measurement.
 *
 * Run before this ships:
 *
 *   node scripts/puzzle-check.mjs --answer wood --clues fire:before,work:after,land:after
 *
 * ── The curve ─────────────────────────────────────────────────────────────
 * PRD §3.2: Mon 1–2, Tue 2, Wed 2–3, Thu 3, Fri 3–4, Sat 4, Sun 2–3. `EPOCH`
 * is a Monday, so `dayIndex % 7` is the weekday and the array is written in
 * blocks of seven following that shape. Sunday steps back down deliberately —
 * the week ends gently rather than at its hardest.
 */
export const DAILY_BANK: Puzzle[] = [
  // ── Week 1 ───────────────────────────────────────────────────────────────
  { id: 'd-0001', answer: 'wood', accepted: [], difficulty: 1, category: 'category.material',
    words: [{ text: 'fire', position: 'before' }, { text: 'work', position: 'after' }, { text: 'land', position: 'after' }] },
  { id: 'd-0002', answer: 'snow', accepted: [], difficulty: 2, category: 'category.weather',
    words: [{ text: 'ball', position: 'after' }, { text: 'flake', position: 'after' }, { text: 'man', position: 'after' }] },
  { id: 'd-0003', answer: 'fire', accepted: [], difficulty: 2, category: 'category.element',
    words: [{ text: 'camp', position: 'before' }, { text: 'works', position: 'after' }, { text: 'place', position: 'after' }] },
  { id: 'd-0004', answer: 'house', accepted: [], difficulty: 3, category: 'category.home',
    words: [{ text: 'green', position: 'before' }, { text: 'boat', position: 'after' }, { text: 'light', position: 'before' }] },
  { id: 'd-0005', answer: 'water', accepted: [], difficulty: 3, category: 'category.element',
    words: [{ text: 'fall', position: 'after' }, { text: 'melon', position: 'after' }, { text: 'under', position: 'before' }] },
  { id: 'd-0006', answer: 'stone', accepted: [], difficulty: 4, category: 'category.material',
    words: [{ text: 'lime', position: 'before' }, { text: 'wall', position: 'after' }, { text: 'corner', position: 'before' }] },
  { id: 'd-0007', answer: 'sun', accepted: [], difficulty: 3, category: 'category.sky',
    words: [{ text: 'flower', position: 'after' }, { text: 'shine', position: 'after' }, { text: 'rise', position: 'after' }] },

  // ── Week 2 ───────────────────────────────────────────────────────────────
  { id: 'd-0008', answer: 'ball', accepted: [], difficulty: 1, category: 'category.play',
    words: [{ text: 'foot', position: 'before' }, { text: 'room', position: 'after' }, { text: 'snow', position: 'before' }] },
  { id: 'd-0009', answer: 'book', accepted: [], difficulty: 2, category: 'category.things',
    words: [{ text: 'case', position: 'after' }, { text: 'note', position: 'before' }, { text: 'mark', position: 'after' }] },
  { id: 'd-0010', answer: 'hand', accepted: [], difficulty: 2, category: 'category.body',
    words: [{ text: 'bag', position: 'after' }, { text: 'shake', position: 'after' }, { text: 'second', position: 'before' }] },
  { id: 'd-0011', answer: 'light', accepted: [], difficulty: 3, category: 'category.element',
    words: [{ text: 'day', position: 'before' }, { text: 'house', position: 'after' }, { text: 'moon', position: 'before' }] },
  { id: 'd-0012', answer: 'moon', accepted: [], difficulty: 3, category: 'category.sky',
    words: [{ text: 'light', position: 'after' }, { text: 'honey', position: 'before' }, { text: 'beam', position: 'after' }] },
  { id: 'd-0013', answer: 'shell', accepted: [], difficulty: 4, category: 'category.nature',
    words: [{ text: 'sea', position: 'before' }, { text: 'fish', position: 'after' }, { text: 'nut', position: 'before' }] },
  { id: 'd-0014', answer: 'fish', accepted: [], difficulty: 3, category: 'category.animals',
    words: [{ text: 'cat', position: 'before' }, { text: 'bowl', position: 'after' }, { text: 'gold', position: 'before' }] },

  // ── Week 3 ───────────────────────────────────────────────────────────────
  { id: 'd-0015', answer: 'foot', accepted: [], difficulty: 1, category: 'category.body',
    words: [{ text: 'ball', position: 'after' }, { text: 'print', position: 'after' }, { text: 'bare', position: 'before' }] },
  { id: 'd-0016', answer: 'rain', accepted: [], difficulty: 2, category: 'category.weather',
    words: [{ text: 'bow', position: 'after' }, { text: 'coat', position: 'after' }, { text: 'drop', position: 'after' }] },
  { id: 'd-0017', answer: 'star', accepted: [], difficulty: 2, category: 'category.sky',
    words: [{ text: 'fish', position: 'after' }, { text: 'light', position: 'after' }, { text: 'super', position: 'before' }] },
  { id: 'd-0018', answer: 'bird', accepted: [], difficulty: 3, category: 'category.animals',
    words: [{ text: 'black', position: 'before' }, { text: 'house', position: 'after' }, { text: 'song', position: 'after' }] },
  { id: 'd-0019', answer: 'night', accepted: [], difficulty: 3, category: 'category.time',
    words: [{ text: 'mare', position: 'after' }, { text: 'mid', position: 'before' }, { text: 'fall', position: 'after' }] },
  { id: 'd-0020', answer: 'bell', accepted: [], difficulty: 4, category: 'category.things',
    words: [{ text: 'blue', position: 'before' }, { text: 'boy', position: 'after' }, { text: 'door', position: 'before' }] },
  { id: 'd-0021', answer: 'cake', accepted: [], difficulty: 3, category: 'category.food',
    words: [{ text: 'pan', position: 'before' }, { text: 'cup', position: 'before' }, { text: 'walk', position: 'after' }] },

  // ── Week 4 ───────────────────────────────────────────────────────────────
  { id: 'd-0022', answer: 'milk', accepted: [], difficulty: 1, category: 'category.food',
    words: [{ text: 'shake', position: 'after' }, { text: 'butter', position: 'before' }, { text: 'man', position: 'after' }] },
  { id: 'd-0023', answer: 'road', accepted: [], difficulty: 2, category: 'category.places',
    words: [{ text: 'rail', position: 'before' }, { text: 'side', position: 'after' }, { text: 'block', position: 'after' }] },
  { id: 'd-0024', answer: 'key', accepted: [], difficulty: 2, category: 'category.things',
    words: [{ text: 'board', position: 'after' }, { text: 'hole', position: 'after' }, { text: 'turn', position: 'before' }] },
  { id: 'd-0025', answer: 'horse', accepted: [], difficulty: 3, category: 'category.animals',
    words: [{ text: 'sea', position: 'before' }, { text: 'shoe', position: 'after' }, { text: 'race', position: 'before' }] },
  { id: 'd-0026', answer: 'head', accepted: [], difficulty: 3, category: 'category.body',
    words: [{ text: 'ache', position: 'after' }, { text: 'light', position: 'after' }, { text: 'over', position: 'before' }] },
  { id: 'd-0027', answer: 'cup', accepted: [], difficulty: 4, category: 'category.home',
    words: [{ text: 'cake', position: 'after' }, { text: 'tea', position: 'before' }, { text: 'board', position: 'after' }] },
  { id: 'd-0028', answer: 'box', accepted: [], difficulty: 3, category: 'category.things',
    words: [{ text: 'mail', position: 'before' }, { text: 'car', position: 'after' }, { text: 'sand', position: 'before' }] },

  // ── Week 5 ───────────────────────────────────────────────────────────────
  { id: 'd-0029', answer: 'berry', accepted: [], difficulty: 1, category: 'category.food',
    words: [{ text: 'blue', position: 'before' }, { text: 'straw', position: 'before' }, { text: 'black', position: 'before' }] },
  { id: 'd-0030', answer: 'side', accepted: [], difficulty: 2, category: 'category.places',
    words: [{ text: 'walk', position: 'after' }, { text: 'out', position: 'before' }, { text: 'road', position: 'before' }] },
  { id: 'd-0031', answer: 'time', accepted: [], difficulty: 2, category: 'category.time',
    words: [{ text: 'table', position: 'after' }, { text: 'some', position: 'before' }, { text: 'life', position: 'before' }] },
  { id: 'd-0032', answer: 'board', accepted: [], difficulty: 3, category: 'category.things',
    words: [{ text: 'card', position: 'before' }, { text: 'walk', position: 'after' }, { text: 'key', position: 'before' }] },
  { id: 'd-0033', answer: 'land', accepted: [], difficulty: 3, category: 'category.places',
    words: [{ text: 'main', position: 'before' }, { text: 'mark', position: 'after' }, { text: 'wood', position: 'before' }] },
  { id: 'd-0034', answer: 'ground', accepted: [], difficulty: 4, category: 'category.places',
    words: [{ text: 'back', position: 'before' }, { text: 'under', position: 'before' }, { text: 'work', position: 'after' }] },
  { id: 'd-0035', answer: 'card', accepted: [], difficulty: 3, category: 'category.things',
    words: [{ text: 'board', position: 'after' }, { text: 'post', position: 'before' }, { text: 'wild', position: 'before' }] },

  // ── Week 6 ───────────────────────────────────────────────────────────────
  { id: 'd-0036', answer: 'eye', accepted: [], difficulty: 1, category: 'category.body',
    words: [{ text: 'ball', position: 'after' }, { text: 'brow', position: 'after' }, { text: 'bulls', position: 'before' }] },
  { id: 'd-0037', answer: 'air', accepted: [], difficulty: 2, category: 'category.element',
    words: [{ text: 'port', position: 'after' }, { text: 'plane', position: 'after' }, { text: 'mid', position: 'before' }] },
  { id: 'd-0038', answer: 'line', accepted: [], difficulty: 2, category: 'category.things',
    words: [{ text: 'life', position: 'before' }, { text: 'on', position: 'before' }, { text: 'up', position: 'after' }] },
  { id: 'd-0039', answer: 'case', accepted: [], difficulty: 3, category: 'category.things',
    words: [{ text: 'brief', position: 'before' }, { text: 'suit', position: 'before' }, { text: 'work', position: 'after' }] },
  { id: 'd-0040', answer: 'watch', accepted: [], difficulty: 3, category: 'category.things',
    words: [{ text: 'wrist', position: 'before' }, { text: 'dog', position: 'after' }, { text: 'stop', position: 'before' }] },
  { id: 'd-0041', answer: 'fall', accepted: [], difficulty: 4, category: 'category.nature',
    words: [{ text: 'water', position: 'before' }, { text: 'rain', position: 'before' }, { text: 'out', position: 'after' }] },
  { id: 'd-0042', answer: 'paper', accepted: [], difficulty: 3, category: 'category.things',
    words: [{ text: 'news', position: 'before' }, { text: 'back', position: 'after' }, { text: 'wall', position: 'before' }] },
];
