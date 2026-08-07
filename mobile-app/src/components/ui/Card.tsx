import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { Colors, Radius, Shadow, Spacing, Typography } from '../../constants/theme';

interface CardProps {
  children: ReactNode;
  title?: string;
  style?: ViewStyle;
  onPress?: () => void;
  inset?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, title, style, onPress, inset }) => {
  const content = (
    <View style={[styles.card, inset && styles.inset, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }
  return content;
};

// iOS-style section grouped card
export const GroupedSection = ({
  children, title, footer,
}: { children: ReactNode; title?: string; footer?: string }) => (
  <View style={styles.group}>
    {title ? <Text style={styles.groupTitle}>{title.toUpperCase()}</Text> : null}
    <View style={styles.groupCard}>{children}</View>
    {footer ? <Text style={styles.groupFooter}>{footer}</Text> : null}
  </View>
);

// iOS-style list row
export const ListRow = ({
  label, value, onPress, showChevron = true, last = false,
}: {
  label: string; value?: string; onPress?: () => void;
  showChevron?: boolean; last?: boolean;
}) => {
  const { Ionicons } = require('@expo/vector-icons');
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, !last && styles.rowBorder, pressed && styles.pressed]}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {onPress && showChevron
          ? <Ionicons name="chevron-forward" size={16} color={Colors.gray7} />
          : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    ...Shadow.sm,
  },
  inset: {
    marginHorizontal: Spacing.base,
  },
  title: {
    ...Typography.headline,
    marginBottom: Spacing.md,
  },
  pressed: { opacity: 0.7 },

  // Grouped
  group: { marginBottom: Spacing.xl },
  groupTitle: {
    ...Typography.caption1,
    color: Colors.tertiaryLabel,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  groupCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.base,
    overflow: 'hidden',
    ...Shadow.xs,
  },
  groupFooter: {
    ...Typography.caption1,
    color: Colors.tertiaryLabel,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xs,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 13,
    backgroundColor: Colors.cardBackground,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  rowLabel: { ...Typography.body, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { ...Typography.body, color: Colors.tertiaryLabel },
});
