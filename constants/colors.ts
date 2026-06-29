// Backward-compatibility shim for hooks/useColors and any other
// legacy consumers that import this file. New code should import
// directly from '@/constants/tokens'.
import { colors as c, radii } from './tokens';

const colorSchema = {
  light: {
    text:                 c.text,
    tint:                 c.teal,
    background:           c.bg,
    backgroundLight:      c.bgLight,
    foreground:           c.text,
    card:                 c.glassBg,
    cardForeground:       c.text,
    cardBorder:           c.glassBorder,
    primary:              c.tealBtn,
    primaryForeground:    c.bgInk,
    secondary:            c.glassBg,
    secondaryForeground:  c.text,
    muted:                c.glassBg,
    mutedForeground:      c.textMuted,
    accent:               c.teal,
    accentForeground:     c.bgInk,
    sand:                 c.sand,
    sandLight:            c.sandBg,
    tealLight:            c.tealBg,
    cream:                c.text,
    creamDim:             c.textDim,
    creamMuted:           c.textMuted,
    creamVeryMuted:       c.textFaint,
    destructive:          c.destructive,
    destructiveForeground: c.text,
    border:               c.glassBorder,
    input:                c.glassBorderDim,
    glowTeal:             c.glowTeal,
    glowSand:             c.glowSand,
  },
  radius: radii.xl,
} as const;

export default colorSchema;
