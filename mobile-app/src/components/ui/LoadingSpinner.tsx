import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Memuat...',
  fullScreen = false,
}) => (
  <View style={[styles.container, fullScreen && styles.fullScreen]}>
    <ActivityIndicator size="large" color="#4F46E5" />
    {message ? <Text style={styles.text}>{message}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  text: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
});
