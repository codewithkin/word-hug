import { Text, View } from 'react-native';

import { Chunky } from '@/components/chunky';
import { Appear } from '@/components/motion';

/**
 * The Word Hug logo: WORD in small pale tiles above HUG in large amber ones,
 * every tile tilted a degree or two.
 *
 * Built from `designs/extracted/04-welcome-{light,dark}.html` and
 * `01-loading-{light,dark}.html`, which draw it identically apart from the gap
 * between the two rows (12px on Welcome, 14px on Loading). It also appears at
 * a smaller size on the splash asset, which is a PNG rather than a screen.
 *
 * Two things worth not "tidying":
 *
 * · The rotations are per-tile and asymmetric — -5, 3, -2, 5 then 4, -3, 5.
 *   Averaging them, or alternating them evenly, kills the hand-made feel that
 *   is the entire point of the mark.
 * · The WORD tiles are the ANSWER TILE colours, not `surface`. In light both
 *   are white so it makes no difference; in dark the answer tile is #4A3193
 *   and `surface` is #33206B, and the mark would quietly go flat.
 */

const WORD = [
  { letter: 'W', rotate: '-5deg' },
  { letter: 'O', rotate: '3deg' },
  { letter: 'R', rotate: '-2deg' },
  { letter: 'D', rotate: '5deg' },
] as const;

const HUG = [
  { letter: 'H', rotate: '4deg' },
  { letter: 'U', rotate: '-3deg' },
  { letter: 'G', rotate: '5deg' },
] as const;

export interface WordmarkProps {
  /** Gap between the two rows. 12 on Welcome, 14 on Loading. */
  gap?: number;
  /**
   * Whether the tiles arrive one after another. The Welcome screen introduces
   * the mark, so it assembles; the Loading screen is already mid-thought and
   * the dots below it are the only thing that should move.
   */
  animate?: boolean;
  /** Extra delay before the first tile, in ms. */
  delay?: number;
}

export function Wordmark({ gap = 12, animate = false, delay = 0 }: WordmarkProps) {
  return (
    <View className="items-center" style={{ gap }}>
      <View className="flex-row" style={{ gap: 7 }}>
          {WORD.map(({ letter, rotate }, i) => {
            const tile = (
              <Chunky
                offset={4}
                shadowVar="--color-wh-answer-tile-shadow"
                className="h-[58px] w-[50px] items-center justify-center rounded-[15px] bg-wh-answer-tile"
                style={{ transform: [{ rotate }] }}
              >
                <Text className="font-wh-bold text-[30px] text-wh-answer-tile-text">{letter}</Text>
              </Chunky>
            );

            return animate ? (
              <Appear key={letter} index={i} delay={delay} rise={10}>
                {tile}
              </Appear>
            ) : (
              <View key={letter}>{tile}</View>
            );
          })}
      </View>

      <View className="flex-row" style={{ gap: 8 }}>
          {HUG.map(({ letter, rotate }, i) => {
            const tile = (
              <Chunky
                offset={5}
                shadowVar="--color-wh-primary-shadow"
                className="h-[70px] w-[62px] items-center justify-center rounded-[18px] bg-wh-primary"
                style={{ transform: [{ rotate }] }}
              >
                <Text className="font-wh-bold text-[38px] text-wh-on-primary">{letter}</Text>
              </Chunky>
            );

            return animate ? (
              <Appear key={letter} index={i} delay={delay + 140} rise={10}>
                {tile}
              </Appear>
            ) : (
              <View key={letter}>{tile}</View>
            );
          })}
      </View>
    </View>
  );
}
