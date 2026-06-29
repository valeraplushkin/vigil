import { router } from 'expo-router';
import React, { useState } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts, radii, typography } from '@/constants/tokens';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { ACTIVE_CHIPS, PASSIVE_CHIPS } from '@/constants/chips';
import { AnswerState } from '@/types';
import { DiamondMark } from '@/components/DiamondMark';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { GlassCard } from '@/components/GlassCard';
import { GradientBackground } from '@/components/GradientBackground';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StepDots } from '@/components/StepDots';

type OnboardingMode = 'passive' | 'active';

const PASSIVE_QUESTION = 'Ты сейчас в моменте или мысли где-то ещё?';
const ACTIVE_QUESTION = 'Ты сейчас работаешь над тем, что важнее всего?';

export default function S2ModePreview() {
  const insets = useSafeAreaInsets();

  // mode: drives the selector UI (updates immediately on tap)
  const [mode, setMode] = useState<OnboardingMode>('passive');
  // displayMode: drives card content (updates after fade-out)
  const [displayMode, setDisplayMode] = useState<OnboardingMode>('passive');
  const [selectedChip, setSelectedChip] = useState<AnswerState | null>(null);

  const cardOpacity = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({ opacity: cardOpacity.value }));

  const switchMode = (newMode: OnboardingMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setSelectedChip(null);
    cardOpacity.value = withTiming(0, { duration: 130 });
    setTimeout(() => {
      setDisplayMode(newMode);
      cardOpacity.value = withTiming(1, { duration: 220 });
    }, 140);
  };

  const chips = displayMode === 'passive' ? PASSIVE_CHIPS : ACTIVE_CHIPS;
  const question = displayMode === 'passive' ? PASSIVE_QUESTION : ACTIVE_QUESTION;

  const handleNext = () => {
    router.push({ pathname: '/onboarding/permissions', params: { mode } });
  };

  const handleSkip = () => {
    router.push({ pathname: '/onboarding/start', params: { mode } });
  };

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.skipRow}>
          <Pressable onPress={handleSkip} accessibilityLabel="Пропустить онбординг">
            <Text style={styles.skip}>Пропустить</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <FadeSlideIn delay={0}>
            <Text style={styles.title}>Как хочешь{'\n'}использовать Vigil?</Text>
            <Text style={styles.subtitle}>Можно сменить в любой момент в настройках.</Text>
          </FadeSlideIn>

          {/* Mode selector */}
          <FadeSlideIn delay={100}>
            <View style={styles.modeRow}>
              <Pressable
                style={[styles.modeCard, mode === 'passive' && styles.modeCardActive]}
                onPress={() => switchMode('passive')}
                accessibilityRole="radio"
                accessibilityState={{ selected: mode === 'passive' }}
                accessibilityLabel="Просто осознанность"
              >
                <View style={[styles.modeIconWrap, mode === 'passive' && styles.modeIconWrapActive]}>
                  <Feather name="wind" size={18} color={mode === 'passive' ? colors.bgInk : colors.teal} />
                </View>
                <Text style={[styles.modeName, mode === 'passive' && styles.modeNameActive]}>
                  Осознанность
                </Text>
                <Text style={[styles.modeDesc, mode === 'passive' && styles.modeDescActive]}>
                  Вопросы в моменте
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modeCard, mode === 'active' && styles.modeCardActive]}
                onPress={() => switchMode('active')}
                accessibilityRole="radio"
                accessibilityState={{ selected: mode === 'active' }}
                accessibilityLabel="Фокус на цели"
              >
                <View style={[styles.modeIconWrap, mode === 'active' && styles.modeIconWrapActive]}>
                  <Feather name="target" size={18} color={mode === 'active' ? colors.bgInk : colors.teal} />
                </View>
                <Text style={[styles.modeName, mode === 'active' && styles.modeNameActive]}>
                  Фокус на цели
                </Text>
                <Text style={[styles.modeDesc, mode === 'active' && styles.modeDescActive]}>
                  Вопросы по задаче
                </Text>
              </Pressable>
            </View>
          </FadeSlideIn>

          {/* Interactive demo */}
          <FadeSlideIn delay={200} style={styles.demoSection}>
            <Animated.View style={cardStyle}>
              <GlassCard style={styles.demoCard}>
                <View style={styles.demoBadge}>
                  <DiamondMark />
                  <Text style={styles.demoBadgeText}>Минутка</Text>
                </View>

                <Text style={styles.demoQuestion}>{question}</Text>

                <View style={styles.demoChips}>
                  {chips.map(chip => {
                    const isSelected = selectedChip === chip.state;
                    return (
                      <Pressable
                        key={chip.state}
                        onPress={() => setSelectedChip(chip.state)}
                        accessibilityRole="radio"
                        accessibilityLabel={chip.label}
                        accessibilityState={{ selected: isSelected }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? chip.bg : colors.glassBgSubtle,
                            borderColor: isSelected ? chip.borderColor : colors.glassBorderDim,
                          },
                        ]}
                      >
                        <Text style={[styles.chipText, { color: isSelected ? chip.color : colors.textDim }]}>
                          {chip.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </GlassCard>
            </Animated.View>

            <Text style={styles.demoHint}>
              {selectedChip
                ? 'Хороший выбор. Это только пример — ничего не записывается.'
                : 'Нажми любой вариант, чтобы попробовать.'}
            </Text>
          </FadeSlideIn>
        </View>

        <FadeSlideIn delay={340} style={styles.footer}>
          <StepDots total={4} active={1} />
          <PrimaryButton label="Дальше" onPress={handleNext} />
        </FadeSlideIn>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  skipRow: { alignItems: 'flex-end', marginBottom: 8 },
  skip: { ...typography.body, color: colors.textMuted },

  content: { flex: 1, gap: 20, justifyContent: 'center' },

  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },

  modeRow: { flexDirection: 'row', gap: 10 },
  modeCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: colors.glassBgSubtle,
    borderWidth: 1,
    borderColor: colors.glassBorderDim,
  },
  modeCardActive: {
    backgroundColor: colors.tealBgStrong,
    borderColor: colors.tealBorder,
  },
  modeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconWrapActive: {
    backgroundColor: colors.teal,
  },
  modeName: {
    ...typography.h4,
    color: colors.textDim,
    textAlign: 'center',
  },
  modeNameActive: {
    color: colors.text,
  },
  modeDesc: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  modeDescActive: {
    color: colors.textDim,
  },

  demoSection: { gap: 12 },
  demoCard: {
    gap: 16,
    padding: 20,
  },
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  demoBadgeText: {
    ...typography.bodySm,
    color: colors.textDim,
  },
  demoQuestion: {
    ...typography.h3,
    fontFamily: fonts.serif,
    color: colors.textBright,
    lineHeight: 27,
  },
  demoChips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipText: {
    ...typography.bodySm,
  },
  demoHint: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'center',
    minHeight: 38,
  },

  footer: { gap: 20 },
});
