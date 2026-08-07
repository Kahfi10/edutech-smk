import React, { ReactNode } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: { icon: string; onPress: () => void };
  leftAction?: { icon: string; onPress: () => void };
  large?: boolean;
  bg?: string;
  light?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title, subtitle, rightAction, leftAction,
  large = false, bg = Colors.background, light = false,
}) => {
  const insets = useSafeAreaInsets();
  const textColor = light ? Colors.white : Colors.black;
  const subColor = light ? 'rgba(255,255,255,0.65)' : Colors.tertiaryLabel;

  return (
    <View style={[
      styles.header,
      { backgroundColor: bg, paddingTop: insets.top + (large ? 4 : 8) },
    ]}>
      <View style={styles.row}>
        {leftAction ? (
          <TouchableOpacity onPress={leftAction.onPress} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name={leftAction.icon as any} size={22} color={textColor} />
          </TouchableOpacity>
        ) : <View style={styles.iconBtn} />}

        {!large && (
          <Text style={[styles.navTitle, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
        )}

        {rightAction ? (
          <TouchableOpacity onPress={rightAction.onPress} style={styles.iconBtn} hitSlop={8}>
            <Ionicons name={rightAction.icon as any} size={22} color={textColor} />
          </TouchableOpacity>
        ) : <View style={styles.iconBtn} />}
      </View>

      {large && (
        <View style={styles.largeTitleArea}>
          <Text style={[styles.largeTitle, { color: textColor }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: subColor }]}>{subtitle}</Text> : null}
        </View>
      )}
    </View>
  );
};

export const Divider: React.FC<{ inset?: number }> = ({ inset = 0 }) => (
  <View style={[styles.divider, { marginLeft: inset }]} />
);

export const SectionHeader: React.FC<{ title: string; action?: { label: string; onPress: () => void } }> = ({
  title, action,
}) => (
  <View style={styles.sectionHeaderRow}>
    <Text style={styles.sectionHeaderText}>{title.toUpperCase()}</Text>
    {action ? (
      <TouchableOpacity onPress={action.onPress}>
        <Text style={styles.sectionAction}>{action.label}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

export const EmptyState: React.FC<{ icon: string; title: string; subtitle?: string }> = ({
  icon, title, subtitle,
}) => (
  <View style={styles.emptyState}>
    <Ionicons name={icon as any} size={44} color={Colors.gray8} />
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  header: {
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.separator,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    minHeight: 44,
  },
  iconBtn: { width: 34, alignItems: 'center' },
  navTitle: { ...Typography.headline, flex: 1, textAlign: 'center' },
  largeTitleArea: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    paddingTop: 4,
  },
  largeTitle: { ...Typography.largeTitle },
  subtitle: { ...Typography.subheadline, marginTop: 2 },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
    marginRight: 0,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xl,
  },
  sectionHeaderText: {
    ...Typography.caption1,
    color: Colors.tertiaryLabel,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  sectionAction: {
    ...Typography.footnote,
    color: Colors.black,
    fontWeight: '500',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    gap: 8,
  },
  emptyTitle: { ...Typography.headline, color: Colors.secondaryLabel },
  emptySub: { ...Typography.subheadline, color: Colors.tertiaryLabel, textAlign: 'center', maxWidth: 260 },
});
