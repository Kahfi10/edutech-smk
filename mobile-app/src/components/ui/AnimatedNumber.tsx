/**
 * AnimatedNumber — count-up animation saat nilai pertama muncul
 * Menggunakan TextInput trick (Reanimated animatedProps)
 */
import React, { useEffect } from 'react';
import { TextInput, StyleSheet, TextStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedNumberProps {
  value: number;
  style?: TextStyle;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value, style, duration = 900, prefix = '', suffix = '',
}) => {
  const animVal = useSharedValue(0);

  useEffect(() => {
    animVal.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const animProps = useAnimatedProps(() => ({
    text: `${prefix}${Math.round(animVal.value)}${suffix}`,
    defaultValue: `${prefix}0${suffix}`,
  }));

  // Web fallback — animated props tidak didukung di web
  if (Platform.OS === 'web') {
    return (
      <TextInput
        value={`${prefix}${value}${suffix}`}
        editable={false}
        style={[s.base, style]}
      />
    );
  }

  return (
    <AnimatedTextInput
      animatedProps={animProps}
      editable={false}
      style={[s.base, style]}
      underlineColorAndroid="transparent"
    />
  );
};

const s = StyleSheet.create({
  base: {
    padding: 0,
    margin: 0,
    color: 'inherit' as any,
  },
});
