import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { colors, fonts, typography } from '@/constants/tokens';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { GlassCard } from '@/components/GlassCard';
import { GradientBackground } from '@/components/GradientBackground';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StepDots } from '@/components/StepDots';
import { useApp } from '@/context/AppContext';

export default function A3Permissions() {
  const insets = useSafeAreaInsets();
  const { updateSettings } = useApp();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const resolvedMode = mode === 'active' ? 'active' : 'passive';

  const goNext = () => {
    router.push({ pathname: '/onboarding/start', params: { mode: resolvedMode } });
  };

  const handleEnable = async () => {
    await updateSettings({ notificationsEnabled: true });
    goNext();
  };

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.content}>
          <FadeSlideIn delay={0}>
            <Text style={styles.title}>Без уведомлений{'\n'}Vigil молчит.</Text>
          </FadeSlideIn>

          <FadeSlideIn delay={140}>
            <GlassCard style={styles.notifCard}>
              <View style={styles.notifHeader}>
                <View style={styles.notifIcon}>
                  <Feather name="anchor" size={16} color={colors.teal} />
                </View>
                <View style={styles.notifMeta}>
                  <Text style={styles.notifApp}>Vigil</Text>
                  <Text style={styles.notifTime}>сейчас</Text>
                </View>
              </View>
              <Text style={styles.notifQuestion}>
                Где сейчас твои мысли — в прошлом, настоящем или будущем?
              </Text>
            </GlassCard>
          </FadeSlideIn>

          <FadeSlideIn delay={260}>
            <Text style={styles.body}>
              Вопросы приходят как уведомления.{'\n'}Это основной способ, которым приложение тебе помогает.
            </Text>
          </FadeSlideIn>
        </View>

        <FadeSlideIn delay={360} style={styles.footer}>
          <StepDots total={4} active={2} />
          <PrimaryButton label="Включить уведомления" onPress={handleEnable} />
          <Pressable
            onPress={goNext}
            style={styles.laterBtn}
            accessibilityRole="button"
            accessibilityLabel="Позже"
          >
            <Text style={styles.laterText}>Позже</Text>
          </Pressable>
        </FadeSlideIn>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  content: { flex: 1, justifyContent: 'center', gap: 28 },
  title: {
    ...typography.h1,
    color: colors.textBright,
    textAlign: 'center',
  },
  notifCard: {
    gap: 10,
    padding: 16,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.tealBgStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifMeta: { gap: 1 },
  notifApp: {
    ...typography.labelSm,
    color: colors.text,
  },
  notifTime: {
    ...typography.caption,
    color: colors.textMuted,
  },
  notifQuestion: {
    ...typography.bodyLg,
    fontFamily: fonts.serif,
    color: colors.text,
    lineHeight: 22,
  },
  body: {
    ...typography.bodyLg,
    color: colors.textDim,
    lineHeight: 22,
    textAlign: 'center',
  },
  footer: { gap: 12 },
  laterBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  laterText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
