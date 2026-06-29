import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { colors, typography, radii } from '@/constants/tokens';
import { springs } from '@/constants/motion';
import { EclipseMark } from '@/components/EclipseMark';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { GradientBackground } from '@/components/GradientBackground';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StepDots } from '@/components/StepDots';
import { useApp } from '@/context/AppContext';

export default function A4Start() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const resolvedMode = mode === 'active' ? 'active' : 'passive';
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (loading) return;
    setLoading(true);
    await completeOnboarding(resolvedMode);
    if (resolvedMode === 'active') {
      router.replace('/(tabs)/goal');
    } else {
      router.replace('/(tabs)');
    }
  };

  const isActive = resolvedMode === 'active';

  // Continuity entrance: the eclipse mark "arrives" from the size it had on
  // the welcome screen (96) and settles into its resting size (80) — a
  // shared-element feel. (Reanimated 4 dropped the real sharedTransitionTag API.)
  const markScale = useSharedValue(96 / 80);
  useEffect(() => {
    markScale.value = withSpring(1, springs.soft);
  }, []);
  const markStyle = useAnimatedStyle(() => ({ transform: [{ scale: markScale.value }] }));

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.content}>
          <FadeSlideIn delay={0} style={styles.heroSection}>
            <Reanimated.View style={markStyle}>
              <EclipseMark size={80} />
            </Reanimated.View>
            <Text style={styles.readyLabel}>Готово</Text>
          </FadeSlideIn>

          <FadeSlideIn delay={120}>
            <Text style={styles.title}>
              {isActive
                ? `Vigil будет следить\nза твоим фокусом.`
                : `Vigil будет возвращать\nтебя в настоящее.`}
            </Text>
          </FadeSlideIn>

          <FadeSlideIn delay={240} style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryIcon}>
                <Feather name={isActive ? 'target' : 'wind'} size={16} color={colors.teal} />
              </View>
              <View style={styles.summaryText}>
                <Text style={styles.summaryTitle}>
                  {isActive ? 'Фокус на цели' : 'Просто осознанность'}
                </Text>
                <Text style={styles.summaryDesc}>
                  {isActive
                    ? 'Ставь цель с утра — вопросы помогут её удержать.'
                    : 'Вопросы в течение дня возвращают тебя в момент.'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <View style={styles.summaryIcon}>
                <Feather name="settings" size={16} color={colors.teal} />
              </View>
              <Text style={styles.summaryNote}>
                Частоту и режим всегда можно сменить в настройках.
              </Text>
            </View>
          </FadeSlideIn>
        </View>

        <FadeSlideIn delay={360} style={styles.footer}>
          <StepDots total={4} active={3} />

          <PrimaryButton
            label={isActive ? 'Поставить цель и начать' : 'Начать'}
            icon="arrow-right"
            loadingLabel="Запускаю…"
            loading={loading}
            onPress={handleStart}
          />

          {isActive && (
            <Pressable
              onPress={async () => {
                if (loading) return;
                setLoading(true);
                await completeOnboarding('passive');
                router.replace('/(tabs)');
              }}
              style={styles.skipGoalBtn}
              accessibilityRole="button"
            >
              <Text style={styles.skipGoalText}>Начать без цели</Text>
            </Pressable>
          )}
        </FadeSlideIn>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
  },
  heroSection: {
    alignItems: 'center',
    gap: 16,
  },
  readyLabel: {
    ...typography.overline,
    color: colors.teal,
    letterSpacing: 2,
  },
  title: {
    ...typography.h1,
    color: colors.textBright,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: colors.glassBgSubtle,
    borderWidth: 1,
    borderColor: colors.glassBorderDim,
    borderRadius: radii.xl,
    padding: 18,
    gap: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  summaryText: { flex: 1, gap: 3 },
  summaryTitle: {
    ...typography.h4,
    color: colors.text,
  },
  summaryDesc: {
    ...typography.bodySm,
    color: colors.textDim,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBg,
  },
  summaryNote: {
    ...typography.bodySm,
    color: colors.textMuted,
    flex: 1,
    marginTop: 6,
  },
  footer: { gap: 12 },
  skipGoalBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipGoalText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
