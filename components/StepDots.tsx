import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { View, StyleSheet } from 'react-native';

import { colors, radii } from '@/constants/tokens';
import { springs, durations } from '@/constants/motion';

interface Props {
  total: number;
  active: number;
}

function Dot({ isActive }: { isActive: boolean }) {
  const width = useSharedValue(isActive ? 20 : 6);
  const opacity = useSharedValue(isActive ? 1 : 0.28);

  useEffect(() => {
    width.value = withSpring(isActive ? 20 : 6, springs.snappy);
    opacity.value = withTiming(isActive ? 1 : 0.28, { duration: durations.normal });
  }, [isActive]);

  const animStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animStyle]} />;
}

export function StepDots({ total, active }: Props) {
  return (
    <View
      style={styles.row}
      accessibilityLabel={`Шаг ${active + 1} из ${total}`}
      accessibilityRole="progressbar"
    >
      {Array.from({ length: total }).map((_, i) => (
        <Dot key={i} isActive={i === active} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.text,
  },
});
