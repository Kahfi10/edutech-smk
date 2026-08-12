import React, { useRef } from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle, Animated, Platform,
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
  const scale = useRef(new Animated.Value(1)).current;
  const v = (variant === 'danger' ? 'destructive' : variant) as
    'primary' | 'secondary' | 'ghost' | 'destructive';
  const isDisabled = disabled || loading;

  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: Platform.OS !== "web", damping: 15, stiffness: 400 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: Platform.OS !== "web", damping: 15, stiffness: 400 }).start();

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, { transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={isDisabled}
        activeOpacity={1}
        style={[
          styles.base,
          styles[v],
          styles[`size_${size}`],
          isDisabled && styles.disabled,
        ]}
      >
        {loading
          ? <ActivityIndicator color={v === 'ghost' ? Colors.black : Colors.white} size="small" />
          : <Text style={[styles.text, styles[`text_${v}`], textStyle]}>{title}</Text>
        }
      </TouchableOpacity>
    </Animated.View>
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

  primary:     { backgroundColor: Colors.black },
  secondary:   { backgroundColor: Colors.gray2 },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.gray9,
  },
  destructive: { backgroundColor: Colors.gray1 },

  size_sm: { paddingVertical: 8,  paddingHorizontal: 14, minHeight: 36 },
  size_md: { paddingVertical: 13, paddingHorizontal: 20, minHeight: 50 },
  size_lg: { paddingVertical: 16, paddingHorizontal: 24, minHeight: 56 },

  text: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  text_primary:     { color: Colors.white },
  text_secondary:   { color: Colors.white },
  text_ghost:       { color: Colors.black },
  text_destructive: { color: Colors.white },
});
