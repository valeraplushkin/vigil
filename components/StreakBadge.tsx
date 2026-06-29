import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Badge } from '@/components/Badge';
import { springs, durations } from '@/constants/motion';

interface Props {
  count: number;
}

// Animated wrapper around the shared <Badge> — bumps on a new streak day.
export function StreakBadge({ count }: Props) {
  const scale = useSharedValue(count > 0 ? 1 : 0);
  const prevCount = useSharedValue(count);

  useEffect(() => {
    if (count > 0 && prevCount.value === 0) {
      scale.value = withSpring(1, springs.bouncy);
    } else if (count === 0) {
      scale.value = withTiming(0, { duration: durations.fast });
    } else if (count > prevCount.value) {
      scale.value = withSpring(1.25, springs.snappy, () => {
        scale.value = withSpring(1, springs.gentle);
      });
    }
    prevCount.value = count;
  }, [count]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value > 0 ? 1 : 0,
  }));

  if (count === 0) return null;

  return (
    <Animated.View style={animStyle}>
      <Badge variant="sand" icon="award" label={count} />
    </Animated.View>
  );
}
