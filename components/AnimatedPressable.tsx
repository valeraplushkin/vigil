import React from 'react';
import { GestureResponderEvent, Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { springs } from '@/constants/motion';

interface Props {
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  scale?: number;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'text' | 'none';
}

export function AnimatedPressable({
  onPress,
  onLongPress,
  disabled,
  style,
  children,
  scale = 0.96,
  accessibilityLabel,
  accessibilityRole = 'button',
}: Props) {
  const pressed = useSharedValue(false);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(pressed.value ? scale : 1, springs.snappy),
      },
    ],
  }));

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onLongPress={onLongPress}
      onPressIn={() => { if (!disabled) pressed.value = true; }}
      onPressOut={() => { pressed.value = false; }}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
    >
      <Animated.View style={[animStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}
