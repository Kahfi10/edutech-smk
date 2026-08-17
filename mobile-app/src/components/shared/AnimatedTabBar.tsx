/**
 * AnimatedTabBar — Custom tab bar dengan Reanimated v4
 *
 * Fitur:
 * - Spring scale per-tab saat ditekan (terasa "physical")
 * - Sliding pill indicator yang mengikuti tab aktif dengan withSpring
 * - Label fade + weight berubah saat aktif
 * - Semua animasi di UI thread
 */
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming,
} from 'react-native-reanimated';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { hapticLight, hapticMedium } from '../../services/haptics';

// ─── Config ────────────────────────────────────────────────────────────────────
const PILL_H       = 3;
const PILL_W       = 24;
const PRESS_SPRING = { damping: 14, stiffness: 380, mass: 0.55 };
const SLIDE_SPRING = { damping: 20, stiffness: 260, mass: 0.7 };

// ─── Single tab button ─────────────────────────────────────────────────────────
interface TabBtnProps {
  route: any;
  descriptor: any;
  isFocused: boolean;
  tabWidth: number;
  onPress: () => void;
  onLongPress: () => void;
}

const TabBtn: React.FC<TabBtnProps> = ({
  route, descriptor, isFocused, tabWidth, onPress, onLongPress,
}) => {
  const { options } = descriptor;
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(isFocused ? 1 : 0.55);

  useEffect(() => {
    opacity.value = withTiming(isFocused ? 1 : 0.55, { duration: 180 });
  }, [isFocused]);

  const scaleStyle   = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const opacityStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const iconColor = isFocused ? Colors.black : Colors.gray6;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => { hapticLight(); scale.value = withSpring(0.80, PRESS_SPRING); }}
      onPressOut={() => { scale.value = withSpring(1,    PRESS_SPRING); }}
      style={[styles.tabBtn, { width: tabWidth }]}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title}
    >
      <Animated.View style={[styles.tabInner, scaleStyle, opacityStyle]}>
        {options.tabBarIcon?.({ focused: isFocused, color: iconColor, size: 22 })}
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            { color: iconColor, fontWeight: isFocused ? '600' : '400' },
          ]}
        >
          {options.title}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

// ─── Tab bar ───────────────────────────────────────────────────────────────────
export const AnimatedTabBar: React.FC<BottomTabBarProps> = ({
  state, descriptors, navigation,
}) => {
  const insets    = useSafeAreaInsets();
  const [barW, setBarW] = useState(0);

  // Hanya tampilkan routes yang punya tabBarIcon (href: null → tidak punya icon)
  const visibleRoutes = state.routes.filter(r => {
    const opts = descriptors[r.key]?.options;
    return opts?.tabBarIcon !== undefined && (opts as any)?.href !== null;
  });

  const tabW       = barW > 0 ? barW / visibleRoutes.length : 0;
  const activeVIdx = visibleRoutes.findIndex(r => r.key === state.routes[state.index]?.key);

  // Sliding pill position
  const pillX = useSharedValue(0);

  useEffect(() => {
    if (tabW > 0 && activeVIdx >= 0) {
      pillX.value = withSpring(
        activeVIdx * tabW + (tabW - PILL_W) / 2,
        SLIDE_SPRING,
      );
    }
  }, [activeVIdx, tabW]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    setBarW(e.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Sliding indicator pill */}
      <View style={styles.pillTrack} pointerEvents="none">
        <Animated.View style={[styles.pill, pillStyle]} />
      </View>

      {/* Tab buttons */}
      <View style={styles.row} onLayout={onLayout}>
        {visibleRoutes.map((route) => {
          const index      = state.routes.findIndex(r => r.key === route.key);
          const isFocused  = state.index === index;
          const descriptor = descriptors[route.key];

          return (
            <TabBtn
              key={route.key}
              route={route}
              descriptor={descriptor}
              isFocused={isFocused}
              tabWidth={tabW}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
              if (!isFocused && !event.defaultPrevented) {
                hapticMedium();
                navigation.navigate(route.name, route.params);
              }
              }}
              onLongPress={() =>
                navigation.emit({ type: 'tabLongPress', target: route.key })
              }
            />
          );
        })}
      </View>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.cardBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
    // iOS blur-like shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  pillTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: PILL_H,
  },
  pill: {
    position: 'absolute',
    top: 0,
    width: PILL_W,
    height: PILL_H,
    borderRadius: PILL_H / 2,
    backgroundColor: Colors.black,
  },
  row: {
    flexDirection: 'row',
    paddingTop: 6,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
});
