import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = '#FFFFFF',
  bg = '#4F46E5',
  style,
}) => (
  <View style={[styles.badge, { backgroundColor: bg }, style]}>
    <Text style={[styles.label, { color }]}>{label}</Text>
  </View>
);

interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
  icon?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, color = '#4F46E5' }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    flex: 1,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
