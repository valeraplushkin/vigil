import React, { useEffect } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Feather } from '@expo/vector-icons';

import { colors, fonts, radii, typography } from '@/constants/tokens';
import { springs, durations } from '@/constants/motion';

const MILESTONE_DATA: Record<number, { title: string; sub: string }> = {
  3:   { title: 'Три дня подряд',      sub: 'Маленький ритм — начало большой привычки.' },
  7:   { title: 'Неделя практики',     sub: 'Семь дней осознанности. Это уже паттерн.' },
  14:  { title: 'Две недели',          sub: 'Ты удерживаешь внимание две недели. Непросто.' },
  30:  { title: 'Месяц осознанности',  sub: 'Тридцать дней — и это стало частью тебя.' },
  60:  { title: 'Два месяца',          sub: 'Два месяца без пропуска. Редкая последовательность.' },
  100: { title: 'Сто дней',            sub: 'Сто дней — не практика, а образ жизни.' },
};

interface Props {
  milestone: number | null;
  onDismiss: () => void;
}

export function MilestoneModal({ milestone, onDismiss }: Props) {
  const cardScale = useSharedValue(0.6);
  const cardOpacity = useSharedValue(0);
  const fireScale = useSharedValue(1);

  useEffect(() => {
    if (milestone !== null) {
      cardScale.value = withSpring(1, springs.bouncy);
      cardOpacity.value = withTiming(1, { duration: durations.normal });
      fireScale.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 600, easing: Easing.out(Easing.quad) }),
          withTiming(0.95, { duration: 500, easing: Easing.in(Easing.quad) }),
          withTiming(1.0,  { duration: 300 }),
        ),
        -1,
        false,
      );
    } else {
      cardScale.value = 0.6;
      cardOpacity.value = 0;
      fireScale.value = 1;
    }
  }, [milestone]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const fireStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fireScale.value }],
  }));

  if (milestone === null) return null;

  const data = MILESTONE_DATA[milestone] ?? {
    title: `${milestone} дней подряд`,
    sub: 'Исключительная последовательность.',
  };

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <View style={styles.center} pointerEvents="box-none">
          <Animated.View style={[styles.card, cardStyle]} pointerEvents="box-none">
            <Pressable onPress={() => {}} style={styles.cardInner}>
              <Animated.View style={[styles.fireMark, fireStyle]}>
                <Feather name="award" size={56} color={colors.sand} />
              </Animated.View>

              <View style={styles.daysRow}>
                <Text style={styles.daysNum}>{milestone}</Text>
                <Text style={styles.daysLabel}>дней</Text>
              </View>

              <Text style={styles.title}>{data.title}</Text>
              <Text style={styles.sub}>{data.sub}</Text>

              <Pressable
                style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
                onPress={onDismiss}
              >
                <Text style={styles.btnText}>Продолжать</Text>
              </Pressable>
            </Pressable>
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  center: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.bgLight,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.sandBorder,
    overflow: 'hidden',
  },
  cardInner: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 28,
    gap: 0,
  },
  fireMark: {
    marginBottom: 12,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 6,
  },
  daysNum: {
    // Celebration hero number — bespoke size, outside the type scale by design.
    fontFamily: fonts.serifBold,
    fontSize: 56,
    color: colors.sand,
    lineHeight: 64,
  },
  daysLabel: {
    ...typography.h2,
    color: colors.textDim,
    lineHeight: 28,
  },
  title: {
    ...typography.h2,
    color: colors.textBright,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 28,
  },
  sub: {
    ...typography.body,
    color: colors.textDim,
    textAlign: 'center',
    marginBottom: 28,
  },
  btn: {
    backgroundColor: colors.sand,
    borderRadius: radii.full,
    paddingVertical: 14,
    paddingHorizontal: 36,
    alignItems: 'center',
  },
  btnText: {
    ...typography.button,
    color: colors.bgInk,
  },
});
