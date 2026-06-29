import React from 'react';
import { View } from 'react-native';

import { ShimmerBlock, ShimmerProvider } from '@/components/ShimmerBlock';
import { colors } from '@/constants/tokens';

const CARD_BORDER = { borderWidth: 1, borderColor: colors.glassBorderDim } as const;

export function HistorySkeleton() {
  return (
    <ShimmerProvider>
      {/* Chart card: header(34) + gap(18) + bars(172) + labels(29) + padding(32) ≈ 285 */}
      <ShimmerBlock height={285} radius={22} style={CARD_BORDER} />

      {/* Two stat cards */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ShimmerBlock height={112} radius={22} style={[{ flex: 1 }, CARD_BORDER]} />
        <ShimmerBlock height={112} radius={22} style={[{ flex: 1 }, CARD_BORDER]} />
      </View>

      {/* Mirror week card */}
      <ShimmerBlock height={95} radius={22} style={CARD_BORDER} />

      {/* "Хроника" section label */}
      <ShimmerBlock height={13} width={72} radius={6} />

      {/* Day rows */}
      <ShimmerBlock height={70} radius={22} style={CARD_BORDER} />
      <ShimmerBlock height={70} radius={22} style={CARD_BORDER} />
      <ShimmerBlock height={70} radius={22} style={CARD_BORDER} />
    </ShimmerProvider>
  );
}
