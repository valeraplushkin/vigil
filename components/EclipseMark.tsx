import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/tokens';

interface Props {
  size?: number;
  glowing?: boolean;
}

export function EclipseMark({ size = 80, glowing = false }: Props) {
  const s = size;
  return (
    <View style={{ width: s * 1.4, height: s * 1.2, alignItems: 'center', justifyContent: 'center' }}>
      {glowing && (
        <View style={[styles.glow, {
          width: s * 1.4,
          height: s * 1.4,
          borderRadius: s * 0.7,
          top: -s * 0.1,
        }]} />
      )}
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <View style={[styles.tealCorona, {
          width: s * 0.72,
          height: s * 0.22,
          borderRadius: s * 0.15,
          top: s * 0.1,
        }]} />
        <View style={[styles.disk, {
          width: s,
          height: s,
          borderRadius: s / 2,
        }]}>
          <View style={[styles.innerSheen, {
            width: s * 0.4,
            height: s * 0.15,
            borderRadius: s,
            top: s * 0.12,
            left: s * 0.12,
          }]} />
        </View>
        <View style={[styles.sandArc, {
          width: s * 0.55,
          height: s * 0.11,
          borderRadius: s,
          bottom: s * 0.08,
        }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    backgroundColor: colors.glowTeal,
  },
  tealCorona: {
    position: 'absolute',
    backgroundColor: colors.tealCorona,
    zIndex: 2,
  },
  disk: {
    backgroundColor: colors.bgDeep,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.tealBg,
  },
  innerSheen: {
    position: 'absolute',
    backgroundColor: colors.glowTeal,
    borderRadius: 100,
  },
  sandArc: {
    position: 'absolute',
    backgroundColor: colors.sandArc,
    zIndex: 2,
  },
});
