import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Colors, Radius, Typography } from '../../constants/theme';
import { hapticLight, hapticMedium } from '../../services/haptics';

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

const PRESS_IN  = { damping: 15, stiffness: 400, mass: 0.5 };
const PRESS_OUT = { damping: 12, stiffness: 300, mass: 0.5 };

export const Button: React.FC<ButtonProps> = ({
  title, onPress, variant = 'primary', loading = false,
  disabled = false, fullWidth = false, style, textStyle, size = 'md',
}) => {
  const scale = useSharedValue(1);
  const v = (variant === 'danger' ? 'destructive' : variant) as
    'primary' | 'secondary' | 'ghost' | 'destructive';
  const isDisabled = disabled || loading;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, animStyle, style]}>
      <TouchableOpacity
        onPress={() => { hapticMedium(); onPress(); }}
        onPressIn={() => {
          if (!isDisabled) {
            hapticLight();
            scale.value = withSpring(0.97, PRESS_IN);
          }
        }}
        onPressOut={() => { scale.value = withSpring(1, PRESS_OUT); }}
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
