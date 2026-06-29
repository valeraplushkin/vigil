import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

import { colors, typography } from '@/constants/tokens';
import { springs } from '@/constants/motion';

interface Props {
  onComplete: () => void;
}

// Brief celebratory moment when a goal is marked done: a teal check pops in,
// holds, then fades. Auto-dismisses (or on tap). Shared by the goal summary
// and the home goal-hero long-press.
export function GoalDoneBurst({ onComplete }: Props) {
  const backdrop = useSharedValue(0);
  const ring = useSharedValue(0.4);
  const check = useSharedValue(0);

  const dismiss = () => {
    backdrop.value = withTiming(0, { duration: 240 }, finished => {
      if (finished) runOnJS(onComplete)();
    });
  };

  useEffect(() => {
    backdrop.value = withTiming(1, { duration: 160 });
    ring.value = withSpring(1, springs.bouncy);
    check.value = withDelay(110, withSpring(1, springs.bouncy));
    const t = setTimeout(dismiss, 1300);
    return () => clearTimeout(t);
  }, []);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: ring.value }], opacity: backdrop.value }));
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: check.value }] }));

  return (
    <Animated.View style={[styles.backdrop, backdropStyle]}>
      <Pressable style={styles.fill} onPress={dismiss}>
        <Animated.View style={[styles.ring, ringStyle]}>
          <Animated.View style={checkStyle}>
            <Feather name="check" size={44} color={colors.bgInk} />
          </Animated.View>
        </Animated.View>
        <Text style={styles.label}>Цель закрыта</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backdrop,
    zIndex: 20,
  },
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  ring: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.tealBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...typography.h2, color: colors.textBright },
});
