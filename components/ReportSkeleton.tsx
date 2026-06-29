import React from 'react';
import { View } from 'react-native';

import { ShimmerBlock, ShimmerProvider } from '@/components/ShimmerBlock';
import { colors } from '@/constants/tokens';

const CARD_BORDER = { borderWidth: 1, borderColor: colors.glassBorderDim } as const;

export function ReportSkeleton() {
  return (
    <ShimmerProvider>
      {/* Main card: header(24) + gap(16) + stats(56) + gap(20) + bar(15) + labels(21) + padding(34) ≈ 186 */}
      <ShimmerBlock height={186} radius={22} style={CARD_BORDER} />

      {/* Goal + best-period half cards */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <ShimmerBlock height={120} radius={22} style={[{ flex: 1 }, CARD_BORDER]} />
        <ShimmerBlock height={120} radius={22} style={[{ flex: 1 }, CARD_BORDER]} />
      </View>

      {/* Mirror day card: header(36) + gap(12) + text(3 lines×23) + padding(32) ≈ 149 */}
      <ShimmerBlock height={149} radius={22} style={CARD_BORDER} />

      {/* Note card */}
      <ShimmerBlock height={70} radius={22} style={CARD_BORDER} />

      {/* Done button */}
      <ShimmerBlock height={52} radius={16} />
    </ShimmerProvider>
  );
}
