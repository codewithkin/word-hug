import { Platform } from 'react-native';

/**
 * ── The daily nudge ───────────────────────────────────────────────────────
 * The only notification Word Hug ever sends, and the only place that talks to
 * `expo-notifications`. Onboarding step 4 promises "That's the only thing we
 * ever send. No streak warnings, no offers" — this file is what makes that
 * sentence true, so anything added here has to be checked against it first.
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
 * A stable identifier, so re-scheduling replaces the existing reminder rather
 * than stacking a second one behind it. Someone changing the time in Settings
 * three times should end the day with one reminder, not three.
 */
const DAILY_NOTIFICATION_ID = 'word-hug-daily-nudge';

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
 * Schedules the one daily reminder, replacing any previous one.
 *
 * The trigger is the OS's own DAILY type rather than a computed delay, so it
 * survives the app being killed and does not need the app to run to re-arm.
 * That matters here: the whole point is a nudge for someone who has *not*
 * opened the app.
 *
 * Returns false when there is no permission or no module — the caller is not
 * expected to do anything about it beyond not claiming a reminder was set.
 *
 * **The copy is a placeholder.** The design shows the notification naming the
 * day's three clue words ("SUN, MOON, DAY — what hugs them?"), which cannot be
 * written until the puzzle bank exists, and cannot be scheduled a day ahead
 * from a static string at all. Whatever replaces this has to keep the promise
 * made in onboarding: one nudge, no streak warning, nothing to lose.
 */
export async function scheduleDailyNudge(hour: number, minute: number): Promise<boolean> {
  const Notifications = await load();
  if (!Notifications) return false;

  try {
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return false;

    await cancelDailyNudge();

    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_NOTIFICATION_ID,
      content: {
        title: 'Word Hug',
        body: "Today's three words are up.",
        data: { kind: 'daily-nudge' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: DAILY_CHANNEL_ID,
      },
    });

    return true;
  } catch {
    return false;
  }
}

/** Turning the reminder off in Settings, and the first half of re-scheduling. */
export async function cancelDailyNudge(): Promise<void> {
  const Notifications = await load();
  if (!Notifications) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIFICATION_ID);
  } catch {
    // Nothing was scheduled under that identifier. That is the desired state.
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
