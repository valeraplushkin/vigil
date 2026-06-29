import { LinearGradient } from 'expo-linear-gradient';
import React, { createContext, useContext, useEffect } from 'react';
import { Dimensions, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, radii } from '@/constants/tokens';

const W = Dimensions.get('window').width;

type ShimmerValue = Animated.SharedValue<number>;
const ShimmerCtx = createContext<ShimmerValue | null>(null);

export function ShimmerProvider({ children }: { children: React.ReactNode }) {
  const tx = useSharedValue(-W);

  useEffect(() => {
    tx.value = withRepeat(
      withTiming(W, { duration: 1100, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  return <ShimmerCtx.Provider value={tx}>{children}</ShimmerCtx.Provider>;
}

interface BlockProps {
  height: number;
  width?: number | string;
  radius?: number;
  style?: ViewStyle;
}

export function ShimmerBlock({ height, width = '100%', radius = radii.sm, style }: BlockProps) {
  const tx = useContext(ShimmerCtx);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx ? tx.value : -W }],
  }));

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: colors.glassBgSubtle,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <LinearGradient
          colors={[
            colors.transparent,
            colors.shimmerBase,
            colors.shimmerHighlight,
            colors.shimmerBase,
            colors.transparent,
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ width: W, height: '100%' }}
        />
      </Animated.View>
    </View>
  );
}
