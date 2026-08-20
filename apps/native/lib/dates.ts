/**
 * Local-calendar date maths. No React Native imports, on purpose — this is the
 * one part of the daily loop that can be exercised in plain Node, and the
 * clock rules are the part most worth exercising.
 *
 * Everything here works in `YYYY-MM-DD` local strings rather than `Date`
 * objects. The product's timezone decision is device-local midnight
 * (`systems/content-pipeline.md` §5), and a `Date` passed around between
 * modules is one `toISOString()` away from quietly becoming UTC.
 */

/**
 * Today as a local `YYYY-MM-DD`.
 *
 * Built from the local getters rather than `toISOString()`, which converts to
 * UTC first and hands back yesterday's date for anyone west of Greenwich after
 * their evening.
 */
export function localDate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whole days from `a` to `b`. Negative if `b` is earlier. */
export function daysBetween(a: string, b: string): number {
  const parse = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    // UTC noon, so a DST shift in either date cannot round the difference off
    // by a day. Only the difference is ever used, never the absolute instant.
    return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12);
  };
  return Math.round((parse(b) - parse(a)) / 86_400_000);
}

/** `YYYY-MM-DD` plus n days, still local-calendar. */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return localDate(new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + n));
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function weekdayName(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return WEEKDAYS[new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1).getDay()] ?? '';
}

/** "Tuesday 19 August" — the eyebrow under the header. */
export function longDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const at = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  return `${WEEKDAYS[at.getDay()] ?? ''} ${at.getDate()} ${MONTHS[at.getMonth()] ?? ''}`;
}

/**
 * `'7:00'` → `'07:00'`. The onboarding time row is written the way a person
 * says a time; storage keeps one canonical `HH:mm` so Settings and storage can
 * compare strings without either knowing about the other's formatting.
 */
export function normaliseTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return time;
  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
}
