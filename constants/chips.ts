import { AnswerState } from '@/types';
import { colors } from './tokens';

// Single source of truth for the answer chips shown on the question screen
// and the onboarding mode preview. Colors come strictly from tokens so the
// chip palette is themeable in one place.

export type ChipDef = {
  state: AnswerState;
  label: string;
  color: string;
  borderColor: string;
  bg: string;
};

const FOCUS = { color: colors.chipFocusText, borderColor: colors.chipFocusBorder, bg: colors.chipFocusBg };
const DRIFT = { color: colors.chipDriftText, borderColor: colors.chipDriftBorder, bg: colors.chipDriftBg };
const PAUSE = { color: colors.textDim,       borderColor: colors.chipNeutralBorder, bg: colors.chipNeutralBg };

// Active (goal) mode — framed around staying on task
export const ACTIVE_CHIPS: ChipDef[] = [
  { state: 'focus', label: 'В фокусе',  ...FOCUS },
  { state: 'drift', label: 'Отвлёкся', ...DRIFT },
  { state: 'pause', label: 'Пауза',     ...PAUSE },
];

// Passive (mindfulness) mode — framed around presence
export const PASSIVE_CHIPS: ChipDef[] = [
  { state: 'focus', label: 'В моменте', ...FOCUS },
  { state: 'drift', label: 'Унесло',    ...DRIFT },
  { state: 'pause', label: 'Пауза',     ...PAUSE },
];
