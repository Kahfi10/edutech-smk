import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, Radius, Typography } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', loading = false,
  disabled = false, fullWidth = false, style, textStyle, size = 'md',
}) => {
  const v = (variant === 'danger' ? 'destructive' : variant) as 'primary' | 'secondary' | 'ghost' | 'destructive';
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.base,
        styles[v],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={v === 'ghost' ? Colors.black : Colors.white} size="small" />
        : <Text style={[styles.text, styles[`text_${v}`], textStyle]}>{title}</Text>
      }
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.35 },

  // Variants
  primary:     { backgroundColor: Colors.black },
  secondary:   { backgroundColor: Colors.gray2 },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.gray9,
  },
  destructive: { backgroundColor: Colors.gray1 },

  // Sizes
  size_sm: { paddingVertical: 8,  paddingHorizontal: 14, minHeight: 36 },
  size_md: { paddingVertical: 13, paddingHorizontal: 20, minHeight: 50 },
  size_lg: { paddingVertical: 16, paddingHorizontal: 24, minHeight: 56 },

  // Text
  text: { ...Typography.headline, letterSpacing: -0.2 },
  text_primary:     { color: Colors.white },
  text_secondary:   { color: Colors.white },
  text_ghost:       { color: Colors.black },
  text_destructive: { color: Colors.white },
});
