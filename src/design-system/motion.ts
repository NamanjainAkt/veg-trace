/**
 * VegTrace Motion Tokens
 * App-wide animation vocabulary: durations, springs, easings, stagger.
 * Pairs with PressableScale / FadeSlideIn components. UI animations flow
 * through Reanimated (CSS transitions or shared values) — never core Animated.
 */

export const motion = {
  press: 120,
  fast: 150,
  base: 220,
  slow: 300,
  reveal: 380,
  stagger: 35,
  scanBeam: 1600,
} as const;

/** Reanimated spring presets (dampingRatio/duration form, v4 API). */
export const springs = {
  settle: { duration: 250, dampingRatio: 1 },
  snap: { duration: 250, dampingRatio: 0.8 },
  reveal: { duration: 350, dampingRatio: 0.85 },
} as const;

export const PRESS_SCALE = 0.97;
export const ROW_SCALE = 0.985;

export const staggerDelay = (index: number, base: number = motion.stagger): number =>
  index * base;
