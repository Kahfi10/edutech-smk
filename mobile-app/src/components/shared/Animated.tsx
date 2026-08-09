import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface AnimatedListItemProps {
  children: React.ReactNode;
  index?: number;
  style?: ViewStyle;
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children, index = 0, style,
}) => {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 280,
        delay: index * 40, useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0, delay: index * 40,
        damping: 18, stiffness: 200, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
};

// Fade-in wrapper untuk screens
export const FadeInView: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1, duration: 250, useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[{ flex: 1, opacity }, style]}>
      {children}
    </Animated.View>
  );
};

// Press scale effect
export const ScalePress: React.FC<{
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  activeScale?: number;
}> = ({ children, onPress, style, activeScale = 0.97 }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn  = () => Animated.spring(scale, { toValue: activeScale, useNativeDriver: true, damping: 15, stiffness: 300 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 300 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Animated.View
        onStartShouldSetResponder={() => true}
        onResponderGrant={pressIn}
        onResponderRelease={() => { pressOut(); onPress(); }}
        onResponderTerminate={pressOut}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
};
