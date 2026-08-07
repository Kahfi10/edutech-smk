import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Typography } from '../../constants/theme';

interface BadgeProps {
  label: string;
  // Cara baru (monochrome)
  variant?: 'default' | 'light' | 'outline';
  // Cara lama (backward compat — custom warna)
  bg?: string;
  color?: string;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label, variant = 'light', bg, color, style,
}) => {
  // Jika ada custom bg/color, pakai langsung (backward compat)
  if (bg || color) {
    return (
      <View style={[styles.badge, { backgroundColor: bg ?? Colors.gray11 }, style]}>
        <Text style={[styles.label, { color: color ?? Colors.gray3 }]}>{label}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.label, styles[`label_${variant}`]]}>{label}</Text>
    </View>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  // backward compat
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, color }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  label: { ...Typography.caption1, fontWeight: '600' },

  default: { backgroundColor: Colors.black },
  light:   { backgroundColor: Colors.gray11 },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.gray9 },

  label_default: { color: Colors.white },
  label_light:   { color: Colors.gray3 },
  label_outline: { color: Colors.gray4 },

  statCard: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  statValue: { fontSize: 28, fontWeight: '700', color: Colors.black, letterSpacing: -0.5 },
  statLabel: { ...Typography.caption1, color: Colors.tertiaryLabel, marginTop: 2, fontWeight: '500' },
  statSub:   { ...Typography.caption2, color: Colors.quaternaryLabel, marginTop: 1 },
});
