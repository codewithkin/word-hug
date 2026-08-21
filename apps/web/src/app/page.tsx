import { Wordmark } from '@/components/wordmark';
import { SITE } from '@/lib/site';

/**
 * ── The landing page ──────────────────────────────────────────────────────
 * This site exists because Google Play and the App Store require a public
 * privacy policy at a stable URL. The landing page is the thing that stops
 * that from looking like a legal drop-box.
 *
 * It is deliberately small. There are no store badges yet, because the app is
 * not on either store, and a badge linking nowhere is worse than no badge. Add
 * them at §"Get it on" below once the listings exist.
 *
 * ── The example is real ───────────────────────────────────────────────────
 * `SNOW` with ball, flake and man is level 4 of the free run. Using a real
 * puzzle rather than an invented one means anyone who plays after reading this
 * meets exactly what they were shown.
 */

const EXAMPLE = [
  { clue: 'ball', joined: 'snowball' },
  { clue: 'flake', joined: 'snowflake' },
  { clue: 'man', joined: 'snowman' },
];

const PROMISES = [
  {
    title: 'A new one every day',
    body: 'Free, always. The daily puzzle is never gated, never behind a subscription, and never costs a coin.',
  },
  {
    title: 'Fifty levels, at your pace',
    body: 'They start easy and climb. Nothing expires, nothing is missed, and nothing has to be done today.',
  },
  {
    title: 'No timer, no score, no way to lose',
    body: 'There is no clock, no life meter and no fail state. A wrong guess costs you nothing but the guess.',
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-5">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center gap-8 py-16 text-center sm:py-24">
        <Wordmark />

        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {SITE.tagline}
          </h1>
          <p className="mx-auto max-w-md text-lg text-muted-foreground">
            A cozy word puzzle. Find the one word that joins all three clues.
          </p>
        </div>
      </section>

      {/* ── The example ──────────────────────────────────────────────── */}
      <section className="pb-16">
        <p className="mb-4 text-center text-xs font-extrabold uppercase tracking-[0.18em] text-muted-foreground">
          Here is one
        </p>

        <div className="flex flex-col gap-3">
          {EXAMPLE.map(({ clue, joined }) => (
            <div
              key={clue}
              className="flex items-center justify-between rounded-2xl border border-border bg-card px-6 py-5 shadow-chunky"
            >
              <span className="text-2xl font-extrabold uppercase tracking-wide text-card-foreground">
                {clue}
              </span>
              {/* The dashed slot from the app's own clue card: the visual
                  promise that one word fills all three. */}
              <span
                aria-label={`the answer goes before ${clue}`}
                className="flex h-11 w-11 items-center justify-center rounded-xl border-[2.5px] border-dashed border-border text-xl font-extrabold text-muted-foreground"
              >
                ?
              </span>
            </div>
          ))}
        </div>

        <details className="mt-5 text-center">
          <summary className="cursor-pointer font-bold text-muted-foreground transition-colors hover:text-foreground">
            Show the answer
          </summary>
          <p className="mt-3 text-lg text-muted-foreground">
            <strong className="text-foreground">SNOW</strong> —{' '}
            {EXAMPLE.map((e) => e.joined).join(', ')}.
          </p>
        </details>
      </section>

      {/* ── What it is ───────────────────────────────────────────────── */}
      <section className="grid gap-4 pb-20 sm:grid-cols-3">
        {PROMISES.map(({ title, body }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-5 shadow-chunky">
            <h2 className="mb-2 font-extrabold text-card-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
