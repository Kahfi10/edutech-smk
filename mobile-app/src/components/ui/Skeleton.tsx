/**
 * Skeleton loading components — pulse animation (Reanimated v4)
 * Tidak butuh LinearGradient — pakai withRepeat opacity pulse
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence,
} from 'react-native-reanimated';
import { Colors, Radius, Spacing } from '../../constants/theme';

// ─── Base skeleton box ─────────────────────────────────────────────────────────
export const SkeletonBox: React.FC<{
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}> = ({ width = '100%', height = 16, radius = 8, style }) => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1,   { duration: 700 }),
        withTiming(0.4, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: Colors.gray10 },
        animStyle,
        style,
      ]}
    />
  );
};

// ─── Dashboard stat card skeleton ──────────────────────────────────────────────
export const SkeletonStatCard: React.FC = () => (
  <View style={s.statCard}>
    <SkeletonBox width={32} height={28} radius={6} />
    <SkeletonBox width="70%" height={12} radius={6} style={{ marginTop: 6 }} />
  </View>
);

// ─── Dashboard section skeleton (nav items / list rows) ────────────────────────
export const SkeletonNavRow: React.FC = () => (
  <View style={s.navRow}>
    <SkeletonBox width={40} height={40} radius={10} />
    <View style={{ flex: 1, gap: 6 }}>
      <SkeletonBox width="55%" height={13} radius={6} />
      <SkeletonBox width="35%" height={10} radius={6} />
    </View>
  </View>
);

// ─── Full dashboard skeleton ───────────────────────────────────────────────────
export const SkeletonDashboard: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <View style={s.container}>
    {/* Stats row */}
    <View style={s.statsRow}>
      <SkeletonStatCard />
      <SkeletonStatCard />
      <SkeletonStatCard />
    </View>

    {/* Section title */}
    <SkeletonBox width={120} height={13} radius={6} style={{ margin: Spacing.base, marginBottom: 8 }} />

    {/* Nav/list rows */}
    <View style={s.card}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i}>
          <SkeletonNavRow />
          {i < rows - 1 && <View style={s.divider} />}
        </View>
      ))}
    </View>
  </View>
);

// ─── List item skeleton (for FlatList) ────────────────────────────────────────
export const SkeletonListItem: React.FC = () => (
  <View style={s.listItem}>
    <SkeletonBox width={44} height={44} radius={22} />
    <View style={{ flex: 1, gap: 7 }}>
      <SkeletonBox width="60%" height={13} radius={6} />
      <SkeletonBox width="40%" height={10} radius={6} />
    </View>
  </View>
);

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  statsRow: {
    flexDirection: 'row', gap: Spacing.sm,
    marginHorizontal: Spacing.base, marginTop: Spacing.base,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.cardBackground,
    borderRadius: Radius.md, padding: Spacing.md,
    alignItems: 'center', gap: 4,
    borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.separator,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: Spacing.base,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  navRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.base,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
    marginLeft: Spacing.base + 40 + 12,
  },
  listItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: Spacing.base,
    backgroundColor: Colors.cardBackground,
  },
});
