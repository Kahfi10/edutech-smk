import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors, Typography } from '../../constants/theme';

export const LoadingSpinner: React.FC<{
  message?: string;
  fullScreen?: boolean;
}> = ({ message, fullScreen = false }) => (
  <Animated.View
    entering={FadeIn.duration(200)}
    style={[styles.container, fullScreen && styles.fullScreen]}
  >
    <ActivityIndicator size="large" color={Colors.black} />
    {message ? <Text style={styles.text}>{message}</Text> : null}
  </Animated.View>
);

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
