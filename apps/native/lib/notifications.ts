import { Platform } from 'react-native';

import { puzzleForDate } from '@/lib/puzzles';
import { addDays, getReminder, localDate } from '@/lib/storage';

/**
 * ── The daily nudge ───────────────────────────────────────────────────────
 * The only notification Word Hug ever sends, and the only place that talks to
 * `expo-notifications`. Onboarding step 4 promises "That's the only thing we
 * ever send. No streak warnings, no offers" — this file is what makes that
 * sentence true, so anything added here has to be checked against it first.
 *
 * ── Session 8 ─────────────────────────────────────────────────────────────
 * Two changes, and the promise above survived both.
 *
 * · The body is no longer a placeholder. It names the day's three clue words,
 *   which needed the puzzle bank to exist and needed the scheduler to stop
 *   being a single repeating trigger. See `WINDOW_DAYS`.
 * · **There is no "your hearts are full" reminder, and there must never be
 *   one.** The energy system was removed partly because it existed to end
 *   sessions; a notification telling someone their meter refilled is that same
 *   mechanic reaching out of the app to do it. It would also be a second kind
 *   of notification, which breaks the sentence quoted above outright.
 *
 * ── Why every call is behind a lazy import ────────────────────────────────
 * `expo-notifications` is a native module. It is absent on web, and absent in
 * any JS-only environment the app is loaded in. A permission prompt, or a
 * reminder, failing must never be the reason someone cannot get past
 * onboarding — so the module is imported at the point of use and every
 * function here resolves to a benign value rather than throwing.
 *
 * ── Three things that are required and easy to miss ───────────────────────
 * 1. **Android needs a channel.** On Android 8+ a notification posted to a
 *    channel that was never created is dropped silently by the OS. There is
 *    no error, no warning, and nothing appears — it reads as "notifications
 *    are broken" rather than "no channel".
 * 2. **Android 13+ needs a runtime permission.** `POST_NOTIFICATIONS` is
 *    declared in `expo-notifications`' own manifest and arrives in the app
 *    through the Gradle manifest merge, so it does not appear in
 *    `android/app/src/main/AndroidManifest.xml` — but it still has to be
 *    granted at runtime, which is what ALLOW does.
 * 3. **The channel has to exist before the permission is asked**, so that the
 *    reminder has somewhere to land the moment consent is given.
 * ──────────────────────────────────────────────────────────────────────────
 */

/** The one channel. Its name is user-visible in Android's own settings. */
export const DAILY_CHANNEL_ID = 'daily-nudge';

/**
 * Every reminder this app schedules is `word-hug-daily-<ISO date>`.
 *
 * A shared prefix rather than one fixed id, because there is no longer one
 * repeating reminder — see `scheduleDailyNudge`. Cancelling means "cancel
 * everything of ours", which is a prefix scan, and that is deliberately
 * narrower than `cancelAllScheduledNotificationsAsync()`: this app should
 * never cancel a notification it did not schedule.
 */
const NUDGE_PREFIX = 'word-hug-daily-';

/**
 * How many days ahead to arm.
 *
 * ── Why a window and not one repeating trigger ────────────────────────────
 * The design has the notification name the day's three clue words — "SUN,
 * MOON and DAY. What hugs all three?" — and that is the whole difference
 * between a reminder someone opens and one they swipe away. A single OS DAILY
 * trigger cannot do it: it fires the same static string forever, which is why
 * the body here was the placeholder "Today's three words are up." for five
 * sessions.
 *
 * So each day gets its own dated notification with its own real words, and the
 * window is re-armed every time the app opens.
 *
 * Fourteen is a compromise between two failure modes. Too short and someone
 * who plays on Sundays stops being reminded; too long and the app is holding
 * dozens of pending notifications against iOS's 64-per-app limit, which drops
 * the *oldest* silently once exceeded. Two weeks of lapse means someone who
 * has not opened the app in a fortnight stops being nudged — which is the
 * right behaviour for this product anyway. Rule 1 covers the notification tray
 * too: an app that keeps tapping the shoulder of someone who left is not cozy.
 */
const WINDOW_DAYS = 14;

/** The amber the notification icon is tinted with (`app.json`, same value). */
const NUDGE_COLOR = '#FFB020';

type NotificationsModule = typeof import('expo-notifications');

/**
 * Resolves the native module, or `null` where it does not exist.
 * Every caller in this file treats `null` as "notifications are not available
 * here", which is a normal state and never an error.
 */
async function load(): Promise<NotificationsModule | null> {
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

/**
 * Called once at startup from `app/_layout.tsx`.
 *
 * Creates the Android channel and decides what happens when a nudge arrives
 * while the app is already open.
 */
export async function initNotifications(): Promise<void> {
  const Notifications = await load();
  if (!Notifications) return;

  try {
    /**
     * A reminder to come and play, arriving while you are already playing, is
     * noise — you are here. So a nudge received in the foreground is recorded
     * in the tray and not thrown over the screen (rule 3: never interrupt the
     * solve). It is still listed, so nothing is lost if it arrives seconds
     * before the app is backgrounded.
     */
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: false,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(DAILY_CHANNEL_ID, {
        name: 'Daily nudge',
        description: 'One reminder a day, at the time you chose.',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: NUDGE_COLOR,
        showBadge: false,
      });
    }
  } catch {
    // A channel that could not be created means the reminder will not show.
    // It does not mean the app should not start.
  }
}

export type PermissionOutcome = 'granted' | 'denied' | 'unavailable';

/**
 * What ALLOW does.
 *
 * Asks only when there is something to ask: a person who has already granted
 * permission is not prompted again, and one who has denied it at the OS level
 * cannot be re-prompted by us — `canAskAgain` is false and the OS silently
 * returns the existing answer. Both cases return honestly so the caller can
 * tell "yes" from "no", but **no caller should treat `denied` as a failure**.
 * The flow must not dead-end on a refusal.
 */
export async function requestNotificationPermission(): Promise<PermissionOutcome> {
  const Notifications = await load();
  if (!Notifications) return 'unavailable';

  try {
    // The channel first: consent is worth nothing if there is nowhere to post.
    await initNotifications();

    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return 'granted';
    if (!existing.canAskAgain) return 'denied';

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted ? 'granted' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/**
 * The line someone reads on their lock screen.
 *
 * "BOW, COAT and DROP. What hugs all three?" — the puzzle itself, in the
 * notification. This is the version the design asked for and the reason the
 * scheduler below is a window rather than a repeat.
 *
 * Note what it does **not** say. No streak count, no "don't break your run",
 * no "you haven't played in 3 days", no day number. Onboarding step 4 promises
 * "That's the only thing we ever send. No streak warnings, no offers", and a
 * streak number in the body is a streak warning whether or not it is phrased
 * as one — the whole point of putting it there would be the pang.
 */
function nudgeBody(puzzle: { words: { text: string }[] }): string {
  const [a, b, c] = puzzle.words.map((w) => w.text.toUpperCase());
  return `${a}, ${b} and ${c}. What hugs all three?`;
}

/**
 * Arms the next two weeks of reminders, replacing whatever was armed before.
 *
 * Each day gets its own dated notification carrying that day's real clue
 * words. Returns false when there is no permission or no module — the caller
 * is not expected to do anything beyond not claiming a reminder was set.
 *
 * ── Why this is safe to call often ────────────────────────────────────────
 * It cancels ours first and re-derives the whole window, so calling it on
 * every launch, on every settings change, and twice in a row all produce the
 * same end state. That idempotence is doing real work: `app/settings.tsx`
 * already notes that its effect can run twice.
 *
 * ── What happens at the end of the bank ───────────────────────────────────
 * `puzzleForDate` returns null past the last puzzle, and those days are
 * skipped rather than filled with a generic line. A notification promising
 * three words on a morning when the app has none is the app lying to get
 * someone to open it, and they would find `/caught-up` waiting. The reminders
 * simply stop, quietly, which is the honest version of running out of content.
 */
export async function scheduleDailyNudge(hour: number, minute: number): Promise<boolean> {
  const Notifications = await load();
  if (!Notifications) return false;

  try {
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return false;

    await cancelDailyNudge();

    const now = new Date();
    let armed = 0;

    for (let offset = 0; offset < WINDOW_DAYS; offset++) {
      const date = addDays(localDate(), offset);
      const puzzle = puzzleForDate(date);
      if (!puzzle) continue;

      const [y, m, d] = date.split('-').map(Number);
      // Local time by construction: the player picked "09:00" and means nine
      // in the morning where they are, not nine UTC.
      const when = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1, hour, minute, 0, 0);

      // Today's slot has usually already passed by the time the app is opened.
      // Scheduling it anyway makes some OS versions fire immediately, which is
      // a notification for the app you are currently looking at.
      if (when.getTime() <= now.getTime()) continue;

      await Notifications.scheduleNotificationAsync({
        identifier: `${NUDGE_PREFIX}${date}`,
        content: {
          title: 'Word Hug',
          body: nudgeBody(puzzle),
          data: { kind: 'daily-nudge', date },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
          channelId: DAILY_CHANNEL_ID,
        },
      });

      armed++;
    }

    return armed > 0;
  } catch {
    return false;
  }
}

/**
 * Turning the reminder off in Settings, and the first half of re-scheduling.
 *
 * Scans the pending list for our prefix instead of cancelling everything.
 * `cancelAllScheduledNotificationsAsync` would be one line and would also
 * cancel anything a future feature schedules — and, on a shared Expo dev
 * client, notifications belonging to another project entirely.
 */
export async function cancelDailyNudge(): Promise<void> {
  const Notifications = await load();
  if (!Notifications) return;

  try {
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      pending
        .filter((n) => n.identifier.startsWith(NUDGE_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch {
    // Nothing scheduled, or no permission to read the list. Either way there
    // is nothing to clean up and nothing worth telling anyone about.
  }
}

/**
 * Re-arms the window on launch, if the player asked for reminders.
 *
 * ── Why this has to exist ─────────────────────────────────────────────────
 * A window is only ever two weeks long. Without something that refills it,
 * reminders would work for a fortnight after onboarding and then stop for
 * everyone, permanently — a failure that is completely invisible in testing
 * because the window is longer than any test.
 *
 * Reads the stored preference rather than taking arguments so `_layout` does
 * not need to know how the reminder is configured.
 */
export async function refreshDailyNudges(): Promise<void> {
  const { enabled, time } = getReminder();
  if (!enabled) return;

  const at = parseTime(time);
  if (!at) return;

  await scheduleDailyNudge(at.hour, at.minute);
}

/**
 * Sends a tap on the reminder to the puzzle it was about.
 *
 * Without this a notification saying "BOW, COAT and DROP" opens the level map,
 * and the player has to go and find the thing they were just shown. Returns an
 * unsubscribe function; `null` when notifications are unavailable.
 *
 * Only ever routes to `/daily` — the payload carries a date, but the daily
 * screen resolves its own puzzle from the clamped `effectiveToday()`, and
 * letting a notification override that would hand anyone with a clock a way
 * past the tamper guard.
 */
export async function onNudgeTapped(go: () => void): Promise<(() => void) | null> {
  const Notifications = await load();
  if (!Notifications) return null;

  try {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const kind = response.notification.request.content.data?.kind;
      if (kind === 'daily-nudge') go();
    });
    return () => sub.remove();
  } catch {
    return null;
  }
}

/**
 * Parses the `'9:00'` strings the onboarding time row is built from.
 *
 * Returns null rather than a guess: a malformed time should leave the reminder
 * alone, not schedule one for midnight.
 */
export function parseTime(time: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
}
