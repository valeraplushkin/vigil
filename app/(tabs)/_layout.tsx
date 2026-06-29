import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Reanimated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { a11y, colors, radii, typography } from '@/constants/tokens';
import { springs } from '@/constants/motion';

const TABS = [
  { name: 'index',   icon: 'home'   as const, label: 'Сегодня' },
  { name: 'history', icon: 'clock'  as const, label: 'История' },
  { name: 'goal',    icon: 'target' as const, label: 'Цель'     },
  { name: 'profile', icon: 'user'   as const, label: 'Профиль' },
];

function TabButton({
  tab,
  isFocused,
  onPress,
}: {
  tab: typeof TABS[number];
  isFocused: boolean;
  onPress: () => void;
}) {
  // p: 0 = collapsed icon, 1 = expanded pill with label
  const p = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    p.value = withSpring(isFocused ? 1 : 0, springs.snappy);
  }, [isFocused]);

  const containerStyle = useAnimatedStyle(() => ({
    flexGrow: p.value,
    backgroundColor: interpolateColor(p.value, [0, 1], [colors.transparent, colors.tealBtn]),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: p.value,
    maxWidth: interpolate(p.value, [0, 1], [0, 110]),
    marginLeft: interpolate(p.value, [0, 1], [0, 7]),
  }));

  return (
    <Reanimated.View style={[tabStyles.tab, containerStyle]}>
      <Pressable
        onPress={onPress}
        style={tabStyles.tabPressable}
        accessibilityLabel={tab.label}
        accessibilityRole="button"
        accessibilityState={{ selected: isFocused }}
      >
        <Feather
          name={tab.icon}
          size={20}
          color={isFocused ? colors.bgInk : colors.textDim}
        />
        <Reanimated.Text
          {...a11y.ui}
          numberOfLines={1}
          style={[tabStyles.activeLabel, labelStyle]}
        >
          {tab.label}
        </Reanimated.Text>
      </Pressable>
    </Reanimated.View>
  );
}

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[tabStyles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={tabStyles.pill}>
        {TABS.map((tab, idx) => {
          const isFocused = state.index === idx;
          return (
            <TabButton
              key={tab.name}
              tab={tab}
              isFocused={isFocused}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: state.routes[idx]?.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(tab.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function crossFade({ current }: { current: { progress: Animated.Value } }) {
  return {
    sceneStyle: {
      backgroundColor: colors.bg,
      opacity: current.progress.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0, 1, 0],
      }),
    },
  };
}

const tabStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: colors.transparent,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radii.full,
    padding: 6,
    width: '100%',
  },
  tab: {
    flexBasis: 44,
    flexGrow: 0,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  tabPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  activeLabel: {
    ...typography.labelSm,
    color: colors.bgInk,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyleInterpolator: crossFade,
        transitionSpec: {
          animation: 'timing',
          config: { duration: 200, easing: Easing.inOut(Easing.ease) },
        },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="history" />
      <Tabs.Screen name="goal" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
