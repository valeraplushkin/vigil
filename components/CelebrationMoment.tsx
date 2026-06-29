import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors, fonts, radii, typography } from '@/constants/tokens';
import { springs, durations } from '@/constants/motion';

// ─── Particles ────────────────────────────────────────────────────────────────

const N = 12;
const ANGLES = Array.from({ length: N }, (_, i) => (i / N) * Math.PI * 2);
const RADII  = [56, 70, 58, 80, 64, 72, 60, 78, 54, 68, 74, 62];

function Particle({ index }: { index: number }) {
  const angle  = ANGLES[index];
  const target = RADII[index % RADII.length];
  const delay  = 80 + index * 28;

  const dist    = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale   = useSharedValue(0.4);

  useEffect(() => {
    dist.value = withDelay(delay,
      withTiming(target, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
    opacity.value = withDelay(delay,
      withSequence(
        withTiming(1, { duration: 90 }),
        withDelay(320, withTiming(0, { duration: 480, easing: Easing.in(Easing.quad) })),
      ),
    );
    scale.value = withDelay(delay, withSpring(1, springs.soft));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: dist.value * Math.cos(angle) },
      { translateY: dist.value * Math.sin(angle) },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const isSand    = index % 3 === 1;
  const isCircle  = index % 4 === 3;

  return (
    <Animated.View
      style={[
        styles.particle,
        isCircle  ? styles.particleCircle  : styles.particleDiamond,
        isSand    ? styles.particleSand    : styles.particleTeal,
        style,
      ]}
    />
  );
}

// ─── Score badge ──────────────────────────────────────────────────────────────

interface LabelSet { title: string; body: string }

function getLabels(pct: number): LabelSet {
  if (pct >= 0.9) return { title: 'В потоке',       body: 'Редкое состояние. Ты был здесь весь день.' };
  if (pct >= 0.8) return { title: 'Отличный день',  body: 'Ты провёл этот день с вниманием.' };
  return                  { title: 'Хороший день',  body: 'Больше половины минуток — в фокусе.' };
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  focusPct: number; // 0.0 – 1.0
}

export function CelebrationMoment({ focusPct }: Props) {
  const ringScale   = useSharedValue(0.55);
  const glowOpacity = useSharedValue(0);
  const badgeTY     = useSharedValue(14);
  const badgeOp     = useSharedValue(0);
  const textOp      = useSharedValue(0);

  useEffect(() => {
    ringScale.value   = withSpring(1, springs.bouncy);
    glowOpacity.value = withSequence(
      withDelay(60,  withTiming(0.65, { duration: 380 })),
      withDelay(200, withTiming(0.18, { duration: 700, easing: Easing.out(Easing.quad) })),
    );
    badgeTY.value     = withDelay(260, withSpring(0, springs.gentle));
    badgeOp.value     = withDelay(260, withTiming(1, { duration: durations.normal }));
    textOp.value      = withDelay(360, withTiming(1, { duration: durations.slow }));
  }, []);

  const ringStyle  = useAnimatedStyle(() => ({ transform: [{ scale: ringScale.value }] }));
  const glowStyle  = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: badgeTY.value }],
    opacity: badgeOp.value,
  }));
  const textStyle  = useAnimatedStyle(() => ({ opacity: textOp.value }));

  const pct = Math.round(focusPct * 100);
  const { title, body } = getLabels(focusPct);

  return (
    <>
      {/* Ring + particles */}
      <View style={styles.ringWrap}>
        {/* Outer glow corona */}
        <Animated.View style={[styles.glowRing, glowStyle]} />

        {/* Main ring */}
        <Animated.View style={[styles.ring, ringStyle]}>
          <View style={styles.diamond} />
        </Animated.View>

        {/* Particle origin pinned to center of ringWrap */}
        <View style={styles.particleOrigin}>
          {Array.from({ length: N }, (_, i) => <Particle key={i} index={i} />)}
        </View>
      </View>

      {/* Score badge */}
      <Animated.View style={[styles.badge, badgeStyle]}>
        <Text style={styles.pctNum}>{pct}</Text>
        <Text style={styles.pctUnit}>%</Text>
        <Text style={styles.pctLabel}> в фокусе</Text>
      </Animated.View>

      {/* Title + body */}
      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </Animated.View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const RING_SIZE = 120;
const GLOW_SIZE = 174;

const styles = StyleSheet.create({
  ringWrap: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Zero-size anchor pinned to the exact center of ringWrap — particles translate outward from here
  particleOrigin: {
    position: 'absolute',
    top: GLOW_SIZE / 2,
    left: GLOW_SIZE / 2,
    width: 0,
    height: 0,
  },
  glowRing: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: colors.tealCorona,
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    backgroundColor: colors.tealBgStrong,
    borderWidth: 1.5,
    borderColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamond: {
    width: 34,
    height: 34,
    backgroundColor: colors.teal,
    borderRadius: 8,
    transform: [{ rotate: '45deg' }],
  },

  // Particles — negative margin centers the 8×8 shape on the zero-size origin anchor
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
  },
  particleDiamond: {
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  particleCircle: {
    borderRadius: 4,
  },
  particleTeal: {
    backgroundColor: colors.tealBright,
  },
  particleSand: {
    backgroundColor: colors.sand,
  },

  // Score badge
  badge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.sandBg,
    borderWidth: 1,
    borderColor: colors.sandBorder,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 0,
  },
  pctNum: {
    ...typography.numLg,
    fontFamily: fonts.serifBold,
    color: colors.sand,
    lineHeight: 30,
  },
  pctUnit: {
    ...typography.button,
    color: colors.sand,
    lineHeight: 28,
  },
  pctLabel: {
    ...typography.body,
    color: colors.textDim,
    lineHeight: 28,
  },

  // Title + body
  textBlock: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...typography.h1,
    color: colors.textBright,
    textAlign: 'center',
  },
  body: {
    ...typography.bodyLg,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 22,
  },
});
