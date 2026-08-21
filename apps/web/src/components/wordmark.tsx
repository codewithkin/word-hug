/**
 * The Word Hug logo, in HTML.
 *
 * `WORD` in four small pale tiles above `HUG` in three large amber ones, each
 * tile individually rotated. The rotations are copied from
 * `apps/native/components/wordmark.tsx` and are **not** decorative noise —
 * they are the mark. Averaging them, or alternating them evenly, kills the
 * hand-placed feel that is the whole point.
 *
 * Rebuilt rather than exported as an image so it stays crisp at any size, and
 * so a colour change in the app can be mirrored here by editing two classes
 * instead of re-cutting a PNG.
 */

const WORD = [
  { letter: 'W', rotate: -5 },
  { letter: 'O', rotate: 3 },
  { letter: 'R', rotate: -2 },
  { letter: 'D', rotate: 5 },
];

const HUG = [
  { letter: 'H', rotate: 4 },
  { letter: 'U', rotate: -3 },
  { letter: 'G', rotate: 5 },
];

export function Wordmark({ compact = false }: { compact?: boolean }) {
  const small = compact ? 'h-6 w-6 text-[13px]' : 'h-9 w-9 text-lg';
  const large = compact ? 'h-9 w-9 text-xl' : 'h-16 w-16 text-4xl';

  return (
    <div className={compact ? 'flex flex-col gap-[3px]' : 'flex flex-col gap-3'}>
      <div className={compact ? 'flex gap-[3px]' : 'flex gap-2'}>
        {WORD.map(({ letter, rotate }) => (
          <span
            key={letter}
            style={{ transform: `rotate(${rotate}deg)` }}
            /* The pale tiles are the *answer tile* colour, not `card`. In light
               both are white so it makes no difference; in dark they differ and
               the mark would quietly go flat. */
            className={`${small} inline-flex shrink-0 items-center justify-center rounded-[6px] bg-card font-extrabold text-foreground shadow-chunky`}
          >
            {letter}
          </span>
        ))}
      </div>

      <div className={compact ? 'flex gap-[3px]' : 'flex gap-2'}>
        {HUG.map(({ letter, rotate }) => (
          <span
            key={letter}
            style={{ transform: `rotate(${rotate}deg)` }}
            className={`${large} inline-flex shrink-0 items-center justify-center rounded-[10px] bg-primary font-extrabold text-primary-foreground shadow-chunky-primary`}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}
