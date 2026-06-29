// Named spring configurations for Reanimated withSpring
export const springs = {
  // Large elements, slow reveals (cards entering, modals)
  gentle:  { damping: 24, stiffness: 160, mass: 1.0 },
  // General UI elements — balanced feel
  default: { damping: 22, stiffness: 220, mass: 0.8 },
  // Small elements, fast feedback (buttons, chips, icons)
  snappy:  { damping: 20, stiffness: 300, mass: 0.6 },
  // Slight overshoot for celebration moments
  bouncy:  { damping: 14, stiffness: 260, mass: 0.8 },
  // Tactile press-bump peak (chips, tone/mode rows scaling up)
  pop:     { damping: 9,  stiffness: 310, mass: 0.5 },
  // Return to rest after a bump
  settle:  { damping: 15, stiffness: 210, mass: 0.7 },
  // Slow soft entrances / settles (rings, toasts, growing bars, particles)
  soft:    { damping: 14, stiffness: 160, mass: 0.9 },
} as const;

// Named durations for withTiming (ms)
export const durations = {
  fast:   150,
  normal: 280,
  slow:   420,
} as const;

// Stagger intervals between sibling animations (ms)
export const staggers = {
  fast:   40,
  normal: 60,
  slow:   90,
} as const;

// Slide distances for enter animations (dp)
export const distances = {
  small:  10,
  normal: 18,
  large:  28,
} as const;
