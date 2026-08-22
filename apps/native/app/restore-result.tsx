import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Chunky, ChunkyPressable } from '@/components/chunky';
import { Sheet } from '@/components/sheet';
import { PACKS } from '@/content/packs';
import { restore } from '@/lib/purchases';
import { getOwnedPacks } from '@/lib/storage';

/**
 * ── Overlay G · Restore result ────────────────────────────────────────────
 * Session 7. No design file — assembled from the sheet, the tokens and the
 * manners of overlays B and C.
 *
 * Two outcomes and one screen, because "we found nothing" is not an error and
 * must not look like one. A person who taps Restore having never bought
 * anything has done nothing wrong; a person who reinstalled and got their
 * packs back deserves a plain sentence, not a celebration.
 *
 * ── The line that had to change (session 8) ───────────────────────────────
 * This said "Your coins came back too — the full amount you bought, whatever
 * you had spent." That was the plan in `systems/storage-persistence.md` §7,
 * written before RevenueCat was wired, and it assumed coins could be rebuilt
 * from transaction history.
 *
 * They cannot. Coins are a RevenueCat **virtual currency**, and virtual
 * currency is explicitly *not* transferable on restore — it belongs to the
 * customer record, and a reinstall creates a new anonymous one. Packs come
 * back. Coins do not.
 *
 * So the screen now says what actually happens. A restore screen that promises
 * a balance the player then does not have is the single worst place in the app
 * to be caught lying, because it is the screen someone opens when they already
 * suspect they have lost something they paid for.
 *
 * Getting coins to survive a reinstall needs real accounts, which is a much
 * larger decision than this file.
 */
export default function RestoreResult() {
  /**
   * The restore runs when the screen opens, not when a button is pressed.
   *
   * Reaching this route *is* the request — the shop's "Restore purchases" row
   * pushed here. A second confirmation step would be asking someone to say yes
   * twice to the same question.
   */
  const [busy, setBusy] = useState(true);
  const [owned, setOwned] = useState<string[]>(getOwnedPacks);

  useEffect(() => {
    let live = true;
    void restore().then(() => {
      if (!live) return;
      setOwned(getOwnedPacks());
      setBusy(false);
    });
    return () => {
      live = false;
    };
  }, []);

  const names = PACKS.filter((p) => owned.includes(p.id)).map((p) => p.name);
  const found = names.length > 0;

  return (
    <Sheet onDismiss={() => router.back()}>
      <Text className="font-wh-bold text-wh-h3 text-wh-clue-text">
        {busy ? 'Checking…' : found ? 'Your packs are back' : 'Nothing to restore'}
      </Text>

      <Text className="font-wh-regular text-[15px] leading-[22px] text-wh-chip-text">
        {busy
          ? 'Asking the store what you have bought before.'
          : found
            ? 'Unlocked again, on this device. Coins are the one thing a restore cannot bring back — they are spent from this device rather than held by the store.'
            : "We couldn't find any previous purchases on this account. Nothing is lost — the daily puzzle and the first fifty levels are free either way."}
      </Text>

      {found ? (
        <View className="gap-[9px]">
          {names.map((name) => (
            <View
              key={name}
              className="flex-row items-center gap-3 rounded-[18px] bg-wh-surface-inset px-[14px] py-[13px] dark:bg-wh-answer-tile-active"
            >
              <Chunky
                offset={3}
                shadowVar="--color-wh-accent-shadow"
                className="h-[30px] w-[30px] items-center justify-center rounded-wh-sm bg-wh-accent"
              >
                <Text className="font-wh-bold text-wh-base text-wh-on-accent">✓</Text>
              </Chunky>
              <Text className="flex-1 font-wh-bold text-[15.5px] text-wh-clue-text">{name}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <ChunkyPressable
        offset={4}
        shadowVar={found ? '--color-wh-primary-shadow' : '--color-wh-surface-shadow'}
        /**
         * A successful restore lands on the pack list, not back wherever the
         * restore came from. The shop hides owned packs, so returning there
         * sent someone hunting for the pack they had just been told was
         * restored, finding only unowned ones with buy buttons — and buying
         * the wrong one. The list shows every pack, owned ones wearing their
         * progress pill, which is the receipt this screen just promised.
         */
        onPress={() => (found ? router.replace('/packs') : router.back())}
        accessibilityRole="button"
        accessibilityLabel={found ? 'Done. See your packs.' : 'Close'}
        className={
          found
            ? 'h-[58px] items-center justify-center rounded-[19px] bg-wh-primary'
            : 'h-[58px] items-center justify-center rounded-[19px] bg-wh-surface'
        }
      >
        <Text
          className={
            found
              ? 'font-wh-bold text-wh-xl text-wh-on-primary'
              : 'font-wh-bold text-wh-xl text-wh-text-muted dark:text-wh-pill-text'
          }
        >
          {found ? 'Done' : 'Close'}
        </Text>
      </ChunkyPressable>
    </Sheet>
  );
}
