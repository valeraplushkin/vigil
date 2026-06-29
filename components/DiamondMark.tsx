import React from 'react';
import { View } from 'react-native';

import { colors } from '@/constants/tokens';

interface Props {
  size?: number;
  color?: string;
}

export function DiamondMark({ size = 12, color }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        backgroundColor: color ?? colors.teal,
        borderRadius: Math.round(size * 0.2),
        transform: [{ rotate: '45deg' }],
      }}
    />
  );
}
