import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/constants/tokens';
import { useReduceMotion } from '@/hooks/useReduceMotion';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  glows?: boolean;
}

// A single ambient glow blob that wanders very slowly. Each axis loops on its
// own (desynced) period, so the two blobs drift independently — a soft
// parallax that keeps the background feeling alive without ever drawing
// attention. Honors the system "reduce motion" setting.
function Blob({
  style,
  dx,
  dy,
  scaleTo,
  durX,
  durY,
  durS,
  enabled,
}: {
  style: StyleProp<ViewStyle>;
  dx: number;
  dy: number;
  scaleTo: number;
  durX: number;
  durY: number;
  durS: number;
  enabled: boolean;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const s = useSharedValue(1);

  useEffect(() => {
    if (!enabled) return;
    const ease = Easing.inOut(Easing.ease);
    // reverse=true ping-pongs each axis, so the blob eases out and back forever
    tx.value = withRepeat(withTiming(dx, { duration: durX, easing: ease }), -1, true);
    ty.value = withRepeat(withTiming(dy, { duration: durY, easing: ease }), -1, true);
    s.value = withRepeat(withTiming(scaleTo, { duration: durS, easing: ease }), -1, true);
  }, [enabled]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: s.value }],
  }));

  return <Animated.View pointerEvents="none" style={[style, animStyle]} />;
}

export function GradientBackground({ children, style, glows = true }: Props) {
  const animate = !useReduceMotion();

  return (
    <LinearGradient
      colors={[colors.bgLight, colors.bg]}
      start={{ x: 0.3, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={[styles.gradient, style]}
    >
      {glows && (
        <>
          <Blob
            style={styles.glowTealTopRight}
            dx={-24} dy={18} scaleTo={1.08}
            durX={26000} durY={21000} durS={17000}
            enabled={animate}
          />
          <Blob
            style={styles.glowSandBottomLeft}
            dx={20} dy={-16} scaleTo={1.06}
            durX={31000} durY={24000} durS={19000}
            enabled={animate}
          />
        </>
      )}
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  glowTealTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.glowTeal,
  },
  glowSandBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.glowSand,
  },
});
