/** Reusable editorial grammar. All durations are seconds; planners convert at project FPS. */
export const REEL_TEMPLATE = {
  id: 'crimson-cutout-v2',
  people: { treatment: 'cutout-only', minSeconds: 1.45, tailSeconds: .35 },
  captions: { treatment: 'expressive' as const, maxWords: 3, baseSize: 94, heroSize: 138, supportingSize: 68 },
  motion: { minCueGapSeconds: 10, baseScale: 1.055, punchScale: 1.20, panScale: 1.12, panPixels: 28, attackSeconds: .23, recoverySeconds: 2.8 },
  transitions: { minGapSeconds: 14, durationSeconds: .24, color: '#C8102E' },
  sound: { minGapSeconds: 12, whooshVolume: .13, impactVolume: .16 },
} as const;
