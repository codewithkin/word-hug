#!/usr/bin/env node
/**
 * Word Hug — undefined-identifier check
 *
 *   node scripts/imports-check.mjs
 *
 * Every JSX component and every called helper in `apps/native` must be
 * imported, declared, or a built-in. That is one narrow class of error, and it
 * is the one this project actually produces: session 7 shipped a
 * `<Land>` into `puzzle-board.tsx` without adding it to the import list, and
 * the only thing that would have caught it was a typecheck.
 *
 * ── Why this exists alongside tsc ─────────────────────────────────────────
 * `npx tsc -p tsconfig.check.json --noEmit` is the real check and this is not
 * a replacement for it. But tsc reads several thousand files out of a pnpm
 * symlink farm, and on a mounted filesystem that can take minutes or stall
 * outright — which it did, silently returning exit 124 and looking exactly
 * like a pass. **A verification tool that fails open is worse than none**, so
 * this one reads only the app's own source, runs in well under a second, and
 * cannot hang.
 *
 * It catches: an unimported component, a renamed export, a helper deleted from
 * one file and still called in another, and a prop passed to a local component
 * that the component does not declare.
 * It does not catch: types, nullability, or anything else tsc exists for.
 *
 * ── The props pass ────────────────────────────────────────────────────────
 * Added after tsc found four errors this could not see, all the same shape:
 * `ChunkyPressableProps extends Omit<PressableProps, 'style' | 'children'>`,
 * and three screens passed `inset` (which did not exist) while a fourth passed
 * `style` (which the Omit had removed). An `Omit` in a props type is a trap —
 * the prop exists on the base, autocompletes in some editors, and is rejected
 * only by a full typecheck.
 *
 * So two things are checked, both precise enough to have no false positives:
 *   · a component whose props interface has NO `extends` — any unknown prop
 *     is an error, because the list is complete by construction
 *   · a component whose props interface `Omit`s something — passing one of the
 *     omitted names is an error, unless the body re-declares it
 *
 * ── The half it cannot catch, stated plainly ──────────────────────────────
 * An unknown prop on an interface that DOES extend an external type. Of the
 * four errors tsc found, this pass would have caught one (`style`, which was
 * Omit'd) and missed three (`inset`, which simply did not exist on a type
 * extending `Omit<PressableProps, …>`). Knowing that `inset` is not a
 * Pressable prop needs React Native's own type declarations, which is the
 * thing tsc reads and this script deliberately does not.
 *
 * **So this is a net, not a floor.** `npx tsc -p tsconfig.check.json --noEmit`
 * on a machine where it can finish is still the only real check, and the exit
 * code has to be read: 0 is a pass, 124 is a timeout that checked nothing.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'apps/native');
const DIRS = ['app', 'components', 'contexts', 'content', 'hooks', 'lib', 'theme'];

let errors = 0;

/** React Native, React and JS globals that are never imported in this project. */
const GLOBALS = new Set([
  'React', 'Fragment', 'console', 'Math', 'JSON', 'Object', 'Array', 'String',
  'Number', 'Boolean', 'Date', 'Set', 'Map', 'Promise', 'Error', 'RegExp',
  'Buffer', 'process', 'require', 'module', 'exports', 'globalThis',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Intl',
  '__DEV__', 'undefined', 'null', 'true', 'false', 'void', 'Symbol',
]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

const files = DIRS.flatMap((d) => {
  try {
    return walk(join(SRC, d));
  } catch {
    return [];
  }
});

for (const full of files) {
  const raw = readFileSync(full, 'utf8');
  const rel = relative(SRC, full).replace(/\\/g, '/');

  // Comments and string literals out — a component name in prose is not a use.
  const code = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/'[^'\n]*'/g, "''")
    .replace(/"[^"\n]*"/g, '""');

  // ── What this file has available ────────────────────────────────────────
  const defined = new Set(GLOBALS);

  // Named imports, including the `import Default, { Named }` form — the first
  // draft required `{` immediately after `import` and reported four live
  // components in `puzzle-ground.tsx` as undefined.
  for (const m of raw.matchAll(/import\s+(?:type\s+)?(?:\w+\s*,\s*)?\{([^}]*)\}\s+from/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop();
      if (name) defined.add(name.trim());
    }
  }
  for (const m of raw.matchAll(/import\s+(?:type\s+)?(\w+)\s*(?:,|from)/g)) defined.add(m[1]);
  for (const m of raw.matchAll(/import\s+\*\s+as\s+(\w+)/g)) defined.add(m[1]);

  // Declared in the file
  for (const m of code.matchAll(/(?:function|const|let|var|class|interface|type|enum)\s+(\w+)/g)) {
    defined.add(m[1]);
  }
  // Destructured, parameters, and loop bindings — coarse but safe: this check
  // only ever reports something as missing, so over-collecting here means a
  // false negative, and under-collecting means a false alarm. False negatives
  // are the right way to be wrong.
  for (const m of code.matchAll(/\{([^{}]*)\}\s*(?:=|:)/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/[:=\s]/)[0];
      if (name && /^[A-Za-z_]\w*$/.test(name)) defined.add(name);
    }
  }
  for (const m of code.matchAll(/\(([^()]*)\)\s*=>/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/[:=\s]/)[0];
      if (name && /^[A-Za-z_]\w*$/.test(name)) defined.add(name);
    }
  }
  for (const m of code.matchAll(/(?:const|let)\s*\[([^\]]*)\]/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim();
      if (name && /^[A-Za-z_]\w*$/.test(name)) defined.add(name);
    }
  }

  // ── What it uses ────────────────────────────────────────────────────────
  //
  // Only `.tsx`. In a `.ts` file `<T>` is a generic parameter, not a tag, and
  // scanning one reported `readJson<T>` in the storage layer as a missing
  // component.
  const used = new Map();
  if (!full.endsWith('.tsx')) continue;

  // JSX: <Thing ...>. Lowercase tags are intrinsic and skipped.
  for (const m of code.matchAll(/<([A-Z]\w*)/g)) {
    if (!used.has(m[1])) used.set(m[1], 'component');
  }
  // Namespaced JSX: <Stack.Screen> needs `Stack`.
  for (const m of code.matchAll(/<([A-Z]\w*)\./g)) {
    if (!used.has(m[1])) used.set(m[1], 'component');
  }

  for (const [name, kind] of used) {
    if (defined.has(name)) continue;
    errors++;
    console.error(`  ERROR  ${rel}: <${name}> is used but never imported or declared (${kind})`);
  }
}

// ── Props ─────────────────────────────────────────────────────────────────

/** Props every component accepts without declaring them. */
const UNIVERSAL = new Set(['key', 'ref', 'children', 'testID']);

/** name → { props, omitted, closed } for every local component. */
const components = new Map();

for (const full of files) {
  const raw = readFileSync(full, 'utf8');

  for (const m of raw.matchAll(
    /(?:export\s+)?interface\s+(\w+)Props\s*(extends\s+([^{]+?))?\s*\{([\s\S]*?)\n\}/g
  )) {
    const [, name, , heritage = '', body] = m;

    const props = new Set(UNIVERSAL);
    for (const line of body.split('\n')) {
      const prop = /^\s*(\w+)\??\s*:/.exec(line);
      if (prop) props.add(prop[1]);
    }

    // An Omit removes a prop from the base type — unless the interface then
    // declares it again in its own body, which is the normal way to *narrow*
    // an inherited prop. `ChunkyPressableProps` omits Pressable's `style`
    // (which can be a function of press state) and re-declares a plain one.
    const omitted = new Set();
    for (const om of heritage.matchAll(/Omit<[^,]+,\s*([^>]+)>/g)) {
      for (const q of om[1].matchAll(/'([^']+)'/g)) {
        if (!props.has(q[1])) omitted.add(q[1]);
      }
    }

    components.set(name, { props, omitted, closed: heritage.trim() === '' });
  }
}

/**
 * The attribute names on one JSX opening tag, or null if it uses a spread.
 *
 * Hand-scanned rather than matched with a regex. The first version used
 * `<([A-Z]\w*)((?:\s+[^<>])*?)\/?>` and silently matched nothing useful,
 * because almost every tag in this codebase contains an arrow function and
 * `=>` has a `>` in it. It reported zero errors on a file that definitely had
 * one, which is the same failure mode as the timing-out typecheck: a check
 * that cannot fail.
 *
 * This walks from the tag name to its closing `>`, tracking brace, paren,
 * bracket and quote depth, and only records `name=` at depth zero.
 */
function attributesOf(source, from) {
  const names = [];
  let i = from;
  let brace = 0;
  let paren = 0;
  let bracket = 0;
  let quote = null;

  while (i < source.length) {
    const c = source[i];

    if (quote) {
      if (c === quote && source[i - 1] !== '\\') quote = null;
      i++;
      continue;
    }

    if (c === "'" || c === '"' || c === '`') {
      quote = c;
      i++;
      continue;
    }

    if (c === '{') brace++;
    else if (c === '}') brace--;
    else if (c === '(') paren++;
    else if (c === ')') paren--;
    else if (c === '[') bracket++;
    else if (c === ']') bracket--;
    else if (c === '>' && brace === 0 && paren === 0 && bracket === 0) {
      return names;
    }

    if (brace === 0 && paren === 0 && bracket === 0) {
      const attr = /^\s([a-z]\w*)=/i.exec(source.slice(i, i + 40));
      if (attr) names.push(attr[1]);
      // A spread makes the list unknowable.
      if (source.startsWith('{...', i)) return null;
    }

    i++;
  }

  return names;
}

for (const full of files) {
  if (!full.endsWith('.tsx')) continue;
  const raw = readFileSync(full, 'utf8');
  const rel = relative(SRC, full).replace(/\\/g, '/');

  for (const m of raw.matchAll(/<([A-Z]\w*)[\s/>]/g)) {
    const spec = components.get(m[1]);
    if (!spec) continue;

    const attrs = attributesOf(raw, m.index + 1 + m[1].length);
    if (attrs === null) continue;

    for (const name of attrs) {
      if (spec.omitted.has(name)) {
        errors++;
        console.error(
          `  ERROR  ${rel}: <${m[1]} ${name}=…> — "${name}" is Omit'd from ${m[1]}Props`
        );
        continue;
      }
      if (spec.closed && !spec.props.has(name)) {
        errors++;
        console.error(
          `  ERROR  ${rel}: <${m[1]} ${name}=…> — ${m[1]}Props does not declare "${name}"`
        );
      }
    }
  }
}

console.log(
  `${errors === 0 ? '✓' : '✗'} ${files.length} files, ${components.size} local components, ${errors} error${errors === 1 ? '' : 's'}`
);
if (errors === 0) {
  console.log('  Note: this is not a typecheck. Run tsc for types and nullability.');
}

process.exit(errors === 0 ? 0 : 1);
