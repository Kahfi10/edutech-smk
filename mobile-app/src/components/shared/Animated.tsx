/**
 * Animated components — Reanimated v4
 * Semua animasi jalan di UI thread → tidak lag meski JS sibuk
 */
import React from 'react';
import { ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming,
  FadeIn, FadeInDown,
} from 'react-native-reanimated';

// ─── AnimatedListItem ─────────────────────────────────────────
// Tiap item masuk dengan FadeInDown stagger berdasarkan index
interface AnimatedListItemProps {
  children: React.ReactNode;
  index?: number;
  style?: ViewStyle;
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children, index = 0, style,
}) => (
  <Animated.View
    entering={FadeInDown
      .delay(index * 45)
      .springify()
      .damping(18)
      .stiffness(180)
    }
    style={style}
  >
    {children}
  </Animated.View>
);

// ─── FadeInView ───────────────────────────────────────────────
// Wrapper fade-in untuk seluruh screen
export const FadeInView: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
  duration?: number;
}> = ({ children, style, duration = 250 }) => (
  <Animated.View
    entering={FadeIn.duration(duration)}
    style={[{ flex: 1 }, style]}
  >
    {children}
  </Animated.View>
);

// ─── ScalePress ───────────────────────────────────────────────
// Pressable dengan spring scale — terasa "physical"
const SPRING_IN  = { damping: 15, stiffness: 350, mass: 0.6 };
const SPRING_OUT = { damping: 12, stiffness: 250, mass: 0.6 };

export const ScalePress: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  activeScale?: number;
}> = ({ children, onPress, style, activeScale = 0.96 }) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(activeScale, SPRING_IN); }}
        onPressOut={() => { scale.value = withSpring(1, SPRING_OUT); }}
        onPress={onPress}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
};

// ─── PulseView ────────────────────────────────────────────────
// Pulse loop untuk badge/notifikasi
export const PulseView: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ children, style }) => {
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    const animate = () => {
      opacity.value = withTiming(0.4, { duration: 700 }, () => {
        opacity.value = withTiming(1, { duration: 700 }, animate);
      });
    };
    animate();
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animStyle, style]}>
      {children}
    </Animated.View>
  );
};
