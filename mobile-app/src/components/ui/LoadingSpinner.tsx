import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography } from '../../constants/theme';

export const LoadingSpinner: React.FC<{
  message?: string;
  fullScreen?: boolean;
}> = ({ message, fullScreen = false }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, fullScreen && styles.fullScreen, { opacity }]}>
      <ActivityIndicator size="large" color={Colors.black} />
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  text: {
    ...Typography.footnote,
    color: Colors.tertiaryLabel,
    marginTop: 12,
  },
});
