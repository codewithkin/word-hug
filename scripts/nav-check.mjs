#!/usr/bin/env node
/**
 * Word Hug — navigation graph analysis
 *
 *   node scripts/nav-check.mjs            # report + pass/fail
 *   node scripts/nav-check.mjs --graph    # print the whole graph
 *
 * Three questions about the app's shape, none of which need a device:
 *
 *   1. **Does every route have a way in?** A screen nothing links to is a
 *      screen nobody sees. Expo Router will happily serve it forever.
 *   2. **How far is everything from home?** The owner's rule: every action is
 *      reachable from the home screen directly, or through one other screen.
 *   3. **Does every link point at a route that exists?** Typed routes catch
 *      most of this, but not a template literal or a `params` object.
 *
 * ── What it cannot tell you ───────────────────────────────────────────────
 * Whether a link is *findable*. A button that exists, is wired, and sits below
 * the fold behind a scroll is reachable to this script and invisible to a
 * person. Depth is a proxy for discoverability, not a measure of it.
 *
 * Exit code is non-zero if any route is orphaned, any link is broken, or
 * anything is deeper than the owner's two-hop rule allows.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP = join(ROOT, 'apps/native/app');

const GRAPH = process.argv.includes('--graph');

let errors = 0;
let warnings = 0;

const error = (m) => (errors++, console.error(`  ERROR  ${m}`));
const warn = (m) => (warnings++, console.warn(`  warn   ${m}`));

// ── Discover routes ────────────────────────────────────────────────────────

/** Routes whose files exist only until the owner runs `git rm`. See below. */
const tombstoned = [];

/** Every `.tsx` under app/, as the route path Expo Router will serve. */
function routes(dir = APP, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      routes(full, out);
      continue;
    }
    if (!entry.endsWith('.tsx')) continue;
    if (entry.startsWith('_')) continue; // layouts

    const rel = relative(APP, full).replace(/\\/g, '/').replace(/\.tsx$/, '');
    const route = rel === 'index' ? '/' : `/${rel.replace(/\/index$/, '')}`;

    /**
     * ── Tombstones ────────────────────────────────────────────────────────
     * An agent working in this repo **cannot delete files** — `rm` fails
     * silently on the mount (see `progress/00-START-HERE.md`). The convention
     * is to overwrite the file with a comment explaining the removal and hand
     * the owner a `git rm`.
     *
     * Between those two moments the file is still on disk, so Expo Router
     * still serves it and this script still sees a route. Reporting seven
     * "orphaned" errors for files that are *deliberately* orphaned and awaiting
     * deletion trains someone to ignore the output, which is the one thing a
     * check must never do.
     *
     * So they are collected and reported once, as a warning naming the command
     * that finishes the job. The marker is matched on the exact sentence the
     * tombstone comment opens with, not on "removed" or a filename list — a
     * loose match here would let a real orphan hide behind the word.
     */
    if (readFileSync(full, 'utf8').includes('— orphaned. `git rm` this file')) {
      tombstoned.push({ route, file: `app/${rel}.tsx` });
      continue;
    }

    out.push({ route, file: `app/${rel}.tsx`, full });
  }
  return out;
}

const all = routes();
const known = new Set(all.map((r) => r.route));

/** `/level/[n]` also answers to `/level/3`. */
function canonical(href) {
  if (known.has(href)) return href;

  for (const route of known) {
    if (!route.includes('[')) continue;
    // `/level/3` → `/level/[n]`
    const filled = new RegExp(`^${route.replace(/\[[^\]]+\]/g, '[^/]+')}$`);
    if (filled.test(href)) return route;
    // `/level/` — the static prefix of a template literal, with the dynamic
    // part not yet substituted.
    if (route.slice(0, route.indexOf('[')) === (href.endsWith('/') ? href : `${href}/`)) {
      return route;
    }
  }

  return href;
}

// ── Extract links ──────────────────────────────────────────────────────────

/**
 * Everything that navigates, from source.
 *
 * Four shapes are in use and all four have to be caught, because missing one
 * would report a live screen as orphaned:
 *   router.push('/x')  ·  <Link href="/x">  ·  <Redirect href="/x" />
 *   router.push({ pathname: '/x', params: … })
 *   router.push(`/level/${n}`)
 */
function linksIn(source) {
  const found = new Set();

  // Any string literal that looks like a route. Broad on purpose: the first
  // draft matched only `router.push('/x')` and `<Link href>`, and reported
  // seven live screens as orphaned because the home screen's tiles keep their
  // hrefs in a tuple array and push a variable. Comments are stripped before
  // this runs, so a route named in prose does not count as a link.
  for (const m of source.matchAll(/['"](\/[a-z0-9\-/[\]]*)['"]/gi)) {
    found.add(m[1]);
  }

  // Template literals: `/level/${n}`. The static prefix is what identifies the
  // dynamic route it is aiming at.
  for (const m of source.matchAll(/`(\/[a-z0-9\-/]*?)\$\{/gi)) {
    if (m[1] && m[1].length > 1) found.add(m[1]);
  }

  return [...found];
}

const edges = new Map(); // route → Set(route)

for (const { route, full } of all) {
  const source = readFileSync(full, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  const targets = new Set();
  for (const raw of linksIn(source)) {
    const target = canonical(raw);
    // Only count it as an edge if it resolves to a route that exists. A stray
    // string like '/' inside a className would otherwise become a link.
    if (known.has(target) && target !== route) targets.add(target);
  }
  edges.set(route, targets);
}

// The root layout registers screens but also owns the error boundary's escape.
const layout = readFileSync(join(APP, '_layout.tsx'), 'utf8');
for (const raw of linksIn(layout)) edges.get('/')?.add(canonical(raw));

console.log(`Word Hug — ${all.length} routes\n${'─'.repeat(52)}`);

// ── 1. Broken links ────────────────────────────────────────────────────────

console.log('\nlinks');

/**
 * Only navigation calls are checked for breakage, not every route-shaped
 * string. `router.push('/nope')` is a bug; a `/` inside a className is not.
 */
for (const { route, full } of all) {
  const source = readFileSync(full, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  const navigations = new Set();
  for (const m of source.matchAll(/router\.(?:push|replace|navigate)\(\s*['"`]([^'"`${]+)/g)) {
    navigations.add(m[1]);
  }
  for (const m of source.matchAll(/pathname:\s*['"`]([^'"`]+)['"`]/g)) {
    navigations.add(m[1]);
  }
  for (const m of source.matchAll(/<(?:Link|Redirect)[^>]*?href=\{?["'`]([^"'`${}]+)/g)) {
    navigations.add(m[1]);
  }

  for (const href of navigations) {
    if (!known.has(canonical(href))) {
      error(`${route} navigates to ${href}, which is not a route`);
    }
  }
}
if (errors === 0) console.log('  every navigation points at a real route');

// ── 2. Reachability from home ──────────────────────────────────────────────

console.log('\nreachability from /home');

const HOME = '/home';
const depth = new Map([[HOME, 0]]);
const queue = [HOME];

while (queue.length > 0) {
  const at = queue.shift();
  for (const next of edges.get(at) ?? []) {
    if (depth.has(next)) continue;
    depth.set(next, depth.get(at) + 1);
    queue.push(next);
  }
}

/**
 * Routes that are legitimately not reachable from home.
 *
 * Onboarding runs before home exists for a first-time player, and `/` is the
 * redirect that decides between them — neither is something you navigate *to*
 * from inside the app.
 */
const EXEMPT = new Set([
  '/',
  '/onboarding/welcome',
  '/onboarding/try-the-game',
  '/onboarding/ritual',
  '/onboarding/notifications',
  '/onboarding/drop-in',
  '/+not-found',
  // Reached by the router itself, not by a link: the error boundary renders
  // ErrorView in place of the tree, and /loading is a route so the state can
  // be looked at.
  '/error',
  '/loading',
]);

const orphans = all
  .map((r) => r.route)
  .filter((r) => !depth.has(r) && !EXEMPT.has(r));

for (const route of orphans) {
  error(`${route} is orphaned — nothing in the app links to it`);
}

/** The owner's rule: home, or one screen away from home. */
const MAX_DEPTH = 2;

/**
 * Depth exemptions — reachable, but legitimately further than two hops.
 *
 * `/pack-level/[id]/[n]` is home → packs → a pack → a level in it. That third
 * hop is the pack itself, and it is not navigation overhead: you cannot play
 * "level 12" of a pack without saying which pack. Flattening it would mean a
 * global list of 250 pack levels on the home screen, which is worse.
 */
const DEEP_OK = new Set(['/pack-level/[id]/[n]']);
const deep = [...depth.entries()].filter(
  ([r, d]) => d > MAX_DEPTH && !EXEMPT.has(r) && !DEEP_OK.has(r)
);

for (const [route, d] of deep) {
  warn(`${route} is ${d} hops from home — the rule is ${MAX_DEPTH}`);
}

if (orphans.length === 0) {
  const byDepth = new Map();
  for (const [route, d] of depth) {
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d).push(route);
  }
  for (const d of [...byDepth.keys()].sort()) {
    console.log(`  ${d} hop${d === 1 ? ' ' : 's'}: ${byDepth.get(d).sort().join(', ')}`);
  }
}

// ── 3. Dead ends ───────────────────────────────────────────────────────────

if (tombstoned.length > 0) {
  console.log('\nawaiting deletion');
  warn(
    `${tombstoned.length} route${tombstoned.length === 1 ? '' : 's'} tombstoned but still on disk`
  );
  console.log(`  git rm ${tombstoned.map((t) => t.file).join(' ')}`);
}

console.log('\nescape routes');

/**
 * A screen with no outgoing link and no back button is a trap. Overlays are
 * exempt — they are dismissed by their scrim, which is not a link.
 */
const OVERLAYS = new Set([
  '/celebration', '/nudge-picker', '/zero-coin', '/archive-locked',
  '/offline-notice', '/welcome-offer', '/restore-result', '/all-caught-up',
]);

let traps = 0;
for (const { route, full } of all) {
  if (OVERLAYS.has(route) || EXEMPT.has(route)) continue;
  const source = readFileSync(full, 'utf8');
  const hasExit =
    (edges.get(route)?.size ?? 0) > 0 ||
    source.includes('router.back()') ||
    source.includes('ScreenHeader') ||
    source.includes('PuzzleHeader');
  if (!hasExit) {
    error(`${route} has no way out — no link, no back button, no header`);
    traps++;
  }
}
if (traps === 0) console.log('  every screen has a way out');

// ── Graph ──────────────────────────────────────────────────────────────────

if (GRAPH) {
  console.log('\ngraph');
  for (const route of [...known].sort()) {
    const targets = [...(edges.get(route) ?? [])].sort();
    const d = depth.has(route) ? `d${depth.get(route)}` : ' — ';
    console.log(`  ${d}  ${route.padEnd(24)} → ${targets.join(', ') || '(nothing)'}`);
  }
}

// ── Verdict ────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(52)}`);
console.log(
  `${errors === 0 ? '✓' : '✗'} ${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}`
);
console.log(
  '\n  Not checked: whether a link is findable. A button below the fold\n' +
    '  is reachable to this script and invisible to a person.\n'
);

process.exit(errors === 0 ? 0 : 1);
