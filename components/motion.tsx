import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { StyleProp, View, ViewStyle } from 'react-native';

import { distances, durations, springs, staggers } from '@/constants/motion';

// ─── FadeIn ──────────────────────────────────────────────────────────────────
// Slide up + fade. The default building block for card/section entrances.

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export function FadeIn({
  children,
  delay = 0,
  distance = distances.normal,
  style,
}: FadeInProps) {
  const opacity = useSharedValue(0);
  const ty = useSharedValue(distance);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: durations.normal, easing: Easing.out(Easing.quad) }),
    );
    ty.value = withDelay(delay, withSpring(0, springs.default));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

// ─── ScaleIn ─────────────────────────────────────────────────────────────────
// Scale + fade. Use for prominent cards (chart, report mainCard, accepted ring).

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  from?: number;
  style?: StyleProp<ViewStyle>;
}

export function ScaleIn({
  children,
  delay = 0,
  from = 0.93,
  style,
}: ScaleInProps) {
  const scale = useSharedValue(from);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, springs.default));
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: durations.normal, easing: Easing.out(Easing.quad) }),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

// ─── Stagger ─────────────────────────────────────────────────────────────────
// Wraps each child in FadeIn with auto-incremented delay.
// Null/undefined/false children are filtered out automatically.
// Use `gap` to add spacing between staggered items.

interface StaggerProps {
  children: React.ReactNode;
  // ms between each child's animation start
  stagger?: number;
  // ms before the first child starts
  initialDelay?: number;
  // passed to each FadeIn (px)
  distance?: number;
  // layout style for the outer container
  style?: StyleProp<ViewStyle>;
  // style passed to each FadeIn wrapper (e.g. alignSelf: 'flex-start' in row layouts)
  childStyle?: StyleProp<ViewStyle>;
}

export function Stagger({
  children,
  stagger: interval = staggers.normal,
  initialDelay = 0,
  distance = distances.normal,
  style,
  childStyle,
}: StaggerProps) {
  const valid = React.Children.toArray(children);

  return (
    <View style={style}>
      {valid.map((child, i) => (
        <FadeIn
          key={i}
          delay={initialDelay + i * interval}
          distance={distance}
          style={childStyle}
        >
          {child as React.ReactNode}
        </FadeIn>
      ))}
    </View>
  );
}
