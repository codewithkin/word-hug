import type { Metadata } from 'next';

import { LAST_UPDATED, SITE } from '@/lib/site';

/**
 * ── The privacy policy ────────────────────────────────────────────────────
 * Required at a public, stable URL by both Google Play and the App Store, and
 * linked from `apps/native/app/settings.tsx`.
 *
 * ── This describes what the app actually does ─────────────────────────────
 * Not a template. Every claim below was checked against the code, and the
 * checks are worth repeating whenever this changes:
 *
 * · "stored only on your device" — `apps/native/lib/storage/` is MMKV, two
 *   local instances, no network writes anywhere.
 * · "no analytics" — `expo-insights` was removed in session 8b, and PRD §10
 *   says there is no analytics pipeline and never will be.
 * · "no account" — there is no sign-in screen and no user record.
 * · RevenueCat is the one third party that receives anything, and only when a
 *   purchase or a restore happens.
 * · Notifications are scheduled on the device by `lib/notifications.ts`. There
 *   is no push server, so no device token ever leaves the phone.
 *
 * ⚠️ **Ads are not mentioned because there are none yet.** The owner intends
 * to add them. An ad SDK collects an advertising identifier and is a material
 * change: this page, the Play Data Safety form and the App Store privacy
 * nutrition labels all have to be updated *before* an ad-enabled build is
 * submitted, not after.
 *
 * Not legal advice. It is an honest description of the software written by the
 * people who built it, and a lawyer should read it before launch.
 */

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${SITE.name} handles your data. Short version: it stays on your device.`,
  alternates: { canonical: '/privacy' },
};

export default function Privacy() {
  return (
    <article className="prose-wh mx-auto max-w-2xl px-5 py-16">
      <h1 className="mb-2 text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
      <p className="mb-10 text-sm text-muted-foreground">Last updated {LAST_UPDATED}</p>

      <div className="mb-10 rounded-2xl border border-border bg-card p-6 shadow-chunky">
        <p className="!mb-0 text-card-foreground">
          <strong>The short version.</strong> {SITE.name} has no accounts and no sign-in. Your
          puzzles, streak, coins and settings are stored on your phone and nowhere else. We do not
          run analytics, we do not track you, and we do not sell anything to anybody. The only time
          data leaves your device is when you buy something, and then it goes to the app store and
          our payments provider so the purchase can work.
        </p>
      </div>

      <h2>Who we are</h2>
      <p>
        {SITE.name} is made by {SITE.publisher}. If you want to ask about anything on this page,
        write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a> and a person will reply.
      </p>

      <h2>What stays on your device</h2>
      <p>
        Everything the game knows about you is written to local storage on your phone. It is not
        backed up to us, it is not synced between devices, and we cannot read it. That includes:
      </p>
      <ul>
        <li>Which puzzles and levels you have solved, and when</li>
        <li>Your current and longest streak</li>
        <li>Your coin balance and which hints you have used</li>
        <li>Which packs you own</li>
        <li>Your settings — sound, haptics, and your reminder time</li>
      </ul>
      <p>
        Deleting the app deletes all of it. There is no copy anywhere else, which also means we
        cannot restore it for you if you lose your phone.
      </p>

      <h2>What we do not collect</h2>
      <p>
        We think this list is more useful than the one above, so it is deliberately specific.{' '}
        {SITE.name} does not collect, store or transmit:
      </p>
      <ul>
        <li>Your name, email address, phone number or date of birth</li>
        <li>Your location, at any precision</li>
        <li>Your contacts, photos, camera, microphone or files</li>
        <li>Your advertising identifier</li>
        <li>Analytics or usage events of any kind — there is no analytics SDK in the app</li>
        <li>Crash reports</li>
      </ul>
      <p>
        There is no account to create, so there is nothing to log in to and no password to lose.
      </p>

      <h2>Purchases</h2>
      <p>
        The daily puzzle and the first fifty levels are free. If you choose to buy a level pack or
        a handful of hint coins, the purchase is handled by <strong>Apple</strong> or{' '}
        <strong>Google</strong> depending on your phone, and processed through{' '}
        <strong>RevenueCat</strong>, which tells the app what you own.
      </p>
      <p>
        We never see your card. Apple and Google do not give it to us. What RevenueCat receives is
        a randomly generated identifier for your installation and the receipt for the purchase —
        enough to confirm you paid and to restore your packs if you reinstall. That identifier is
        not linked to your name or your email, because we do not have either.
      </p>
      <ul>
        <li>
          RevenueCat&apos;s privacy policy:{' '}
          <a href="https://www.revenuecat.com/privacy" rel="noopener noreferrer" target="_blank">
            revenuecat.com/privacy
          </a>
        </li>
        <li>
          Apple and Google handle payment data under their own policies, which apply to the store
          you bought from.
        </li>
      </ul>
      <p>
        Hint coins are consumable. Because they are spent on your device rather than held on a
        server, reinstalling the app restores your packs but not your unspent coins. We would
        rather say that here than have you find out.
      </p>

      <h2>Reminders</h2>
      <p>
        If you turn on the daily reminder, the app asks your phone to show you a notification at
        the time you picked. That schedule lives on your phone. There is no push server, we never
        receive a device token, and we cannot send you anything you did not ask for.
      </p>
      <p>
        You can turn reminders off in the app&apos;s settings, or in your phone&apos;s own
        notification settings, at any time.
      </p>

      <h2>Word lookups</h2>
      <p>
        The puzzles are bundled inside the app, so playing needs no connection at all. We check our
        own word list against a public dictionary service while writing puzzles, but that happens
        on our machines before release — your phone never sends a word anywhere.
      </p>

      <h2>Children</h2>
      <p>
        {SITE.name} is suitable for all ages and contains no chat, no user-generated content, no
        social features and no way for one player to reach another. Because we collect no personal
        information from anybody, we collect none from children either.
      </p>
      <p>
        The app does contain optional purchases. If you are a parent, your phone&apos;s built-in
        purchase controls will restrict them.
      </p>

      <h2>This website</h2>
      <p>
        {SITE.domain} is a static site with no analytics, no cookies and no tracking pixels. Our
        hosting provider keeps standard server logs, which may include your IP address, for
        security and reliability.
      </p>

      <h2>Your rights</h2>
      <p>
        Under the UK GDPR, the EU GDPR and similar laws elsewhere, you have the right to see, correct
        and delete the personal data a company holds about you. We hold none, so there is nothing to
        request — but the practical version of &quot;delete my data&quot; here is uninstalling the
        app, which removes everything.
      </p>
      <p>
        If you would like to make a request or a complaint anyway, write to{' '}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. In the UK you also have the right to
        complain to the Information Commissioner&apos;s Office.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes in a way that matters — new data collected, a new third party
        involved, advertising added — the date at the top will change and the app&apos;s release
        notes will say so. We will not quietly widen it.
      </p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
      </p>
    </article>
  );
}
