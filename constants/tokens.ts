// ─── VIGIL DESIGN TOKENS ──────────────────────────────────────────────────────
//
// Single source of truth for colors, typography, spacing, and radii.
// Import from here — never hardcode design values in components or screens.
//
// Usage:
//   import { colors, fonts, typography, spacing, layout, radii } from '@/constants/tokens';
//   StyleSheet.create({ card: { backgroundColor: colors.glassBg, ...typography.body } })

// ─── COLORS ───────────────────────────────────────────────────────────────────

export const colors = {
  // ── Backgrounds ─────────────────────────────────────────
  bg:       '#2B393C', // main screen background
  bgLight:  '#3D5258', // gradient start / elevated panels
  bgDeep:   '#192830', // EclipseMark disk / deepest surface
  bgInk:    '#1C2D30', // text on primary-colored surfaces (buttons)

  // ── Text (base hex: #ECE5D8 = rgb 236,229,216) ──────────
  text:       '#ECE5D8',                  // primary readable text
  textBright: '#F2ECE0',                  // hero headings — slightly brighter
  textDim:    'rgba(236,229,216,0.65)',   // secondary / supportive text
  textMuted:  'rgba(236,229,216,0.45)',   // captions, section labels, placeholders
  textFaint:  'rgba(236,229,216,0.30)',   // decorative dividers, empty dots — non-textual only
  textDisabled: 'rgba(236,229,216,0.55)', // disabled button labels — readable but clearly inactive
  placeholder:  'rgba(236,229,216,0.42)',  // input placeholders — visible but recessive

  // ── Teal family ─────────────────────────────────────────
  teal:          '#8FB0B6',               // core teal — icons, accents, chip borders
  tealBtn:       '#93B3B9',               // primary button background
  tealBright:    '#9DC2C8',               // highlighted numeric values (bigPct, focusBig)
  tealDeep:      '#88ADB3',               // chart bars (non-today), subtle teal
  tealBg:        'rgba(143,176,182,0.12)',// subtle teal surface (secondary button, ring)
  tealBgStrong:  'rgba(143,176,182,0.20)',// teal surface with emphasis (tone active, badge)
  tealBorder:    'rgba(143,176,182,0.30)',// teal border / separator
  tealCorona:    'rgba(143,176,182,0.70)',// EclipseMark corona glow

  // ── Sand family ─────────────────────────────────────────
  sand:          '#AA895F',               // warm sand — drift accents, icons
  sandBg:        'rgba(170,137,95,0.15)', // subtle sand surface
  sandBgStrong:  'rgba(170,137,95,0.22)', // drift chip selected bg
  sandBorder:    'rgba(170,137,95,0.45)', // sand chip border
  sandArc:       'rgba(170,137,95,0.55)', // EclipseMark arc

  // ── Glass card system ────────────────────────────────────
  glassBg:        'rgba(236,229,216,0.08)', // standard card background
  glassBgDim:     'rgba(236,229,216,0.05)', // dimmer card variant
  glassBgSubtle:  'rgba(236,229,216,0.06)', // chip / input unselected bg
  glassBgHover:   'rgba(236,229,216,0.15)', // selected neutral states
  glassBorder:    'rgba(236,229,216,0.14)', // standard card border
  glassBorderDim: 'rgba(236,229,216,0.10)', // dimmer border / input bg

  // ── Semantic ─────────────────────────────────────────────
  destructive:       '#8C6060',
  destructiveBorder: 'rgba(140,96,96,0.50)',

  // ── Ambient glows (GradientBackground blobs) ────────────
  glowTeal: 'rgba(143,176,182,0.12)',
  glowSand: 'rgba(170,137,95,0.10)',

  // ── Answer chips (question + onboarding mode preview) ───
  // Slightly brighter than the teal/sand accents — chip labels sit on
  // tinted fills and need extra punch to read. Pause reuses textDim.
  chipFocusText:    '#B8D2D6',
  chipDriftText:    '#D9B98C',
  chipFocusBorder:  'rgba(143,176,182,0.50)',
  chipDriftBorder:  'rgba(170,137,95,0.50)',
  chipNeutralBorder:'rgba(236,229,216,0.25)',
  chipFocusBg:      'rgba(143,176,182,0.18)',
  chipDriftBg:      'rgba(170,137,95,0.22)',
  chipNeutralBg:    'rgba(236,229,216,0.07)',

  // ── Structural overlays (not themeable accents) ─────────
  scrim:    'rgba(0,0,0,0.18)',     // inset segmented-control track
  backdrop: 'rgba(18,32,34,0.82)',  // full-screen modal backdrop
  shadow:   '#000',                 // elevation shadow color
  transparent: 'transparent',       // explicit no-fill (animations, gradients)

  // ── Shimmer (skeleton loaders) ──────────────────────────
  shimmerBase:      'rgba(236,229,216,0.09)',
  shimmerHighlight: 'rgba(236,229,216,0.15)',
} as const;

// ─── FONT FAMILIES ────────────────────────────────────────────────────────────

export const fonts = {
  serif:        'Lora_400Regular',
  serifBold:    'Lora_700Bold',
  sans:         'Inter_400Regular',
  sansMedium:   'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
} as const;

// ─── TYPOGRAPHY SCALE ─────────────────────────────────────────────────────────
// Spread into StyleSheet objects:
//   title: { ...typography.h1, color: colors.textBright }
//
// Font sizes are intentionally fixed — screen context determines which scale to use.

export const typography = {
  // Hero / brand display
  display:  { fontFamily: fonts.serifBold,    fontSize: 36, lineHeight: 44, letterSpacing: 4 },

  // Screen headings (Lora serif)
  h1:       { fontFamily: fonts.serif,         fontSize: 28, lineHeight: 38 },
  h2:       { fontFamily: fonts.serif,         fontSize: 22, lineHeight: 30 },

  // Section headings (Inter semibold)
  h3:       { fontFamily: fonts.sansSemiBold,  fontSize: 17, lineHeight: 24 },
  h4:       { fontFamily: fonts.sansSemiBold,  fontSize: 14, lineHeight: 20 },

  // Body text
  bodyLg:   { fontFamily: fonts.sans,          fontSize: 16, lineHeight: 26 },
  body:     { fontFamily: fonts.sans,          fontSize: 14, lineHeight: 21 },
  bodySm:   { fontFamily: fonts.sans,          fontSize: 13, lineHeight: 19 },

  // UI labels
  button:   { fontFamily: fonts.sansMedium,    fontSize: 16, letterSpacing: 0.2 },
  label:    { fontFamily: fonts.sansMedium,    fontSize: 14, lineHeight: 20 },
  labelSm:  { fontFamily: fonts.sansMedium,    fontSize: 13, lineHeight: 18 },

  // Metadata / captions
  caption:  { fontFamily: fonts.sans,          fontSize: 12, lineHeight: 17 },
  overline: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },

  // Large numeric displays
  numXl:    { fontFamily: fonts.sansMedium,    fontSize: 38, lineHeight: 48 },
  numLg:    { fontFamily: fonts.serif,         fontSize: 26, lineHeight: 34 },
} as const;

// ─── SPACING ──────────────────────────────────────────────────────────────────
// 4 px base grid. Access: spacing[3] = 12, spacing[4] = 16, etc.

export const spacing = {
  0.5: 2,
  1:   4,
  1.5: 6,
  2:   8,
  2.5: 10,
  3:   12,
  3.5: 14,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  10:  40,
  12:  48,
} as const;

// Semantic layout shortcuts — use for screen-level dimensions
export const layout = {
  screenPadding: 20, // horizontal inset for all screen content
  cardPadding:   16, // default GlassCard internal padding
  cardGap:       12, // gap between cards in a ScrollView
  sectionGap:    24, // gap between major screen sections
} as const;

// ─── DYNAMIC TYPE / FONT SCALING ─────────────────────────────────────────────
// Spread onto <Text> props: <Text {...a11y.heading} style={...}>
//
// body    — long-form readable content; scales up to 1.5× system size
// heading — titles and hero text; scales up to 1.35×
// ui      — chrome (buttons, tabs, chips); scales up to 1.2× to prevent overflow
// fixed   — decorative only (version numbers, icon annotations); never scales

export const a11y = {
  body:    { maxFontSizeMultiplier: 1.5  } as const,
  heading: { maxFontSizeMultiplier: 1.35 } as const,
  ui:      { maxFontSizeMultiplier: 1.2  } as const,
  fixed:   { allowFontScaling: false      } as const,
} as const;

// ─── BORDER RADIUS ────────────────────────────────────────────────────────────

export const radii = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   22,  // GlassCard default
  full: 999, // pills, chips, circular buttons
} as const;
