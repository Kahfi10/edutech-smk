/**
 * Toast UI Component — Reanimated v4
 * Slide in dari atas, auto-dismiss, tap untuk tutup
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast, ToastType } from '../../context/ToastContext';
import { hapticSuccess, hapticError, hapticWarning, hapticLight } from '../../services/haptics';

const CONFIG: Record<ToastType, { icon: any; bg: string; color: string }> = {
  success: { icon: 'checkmark-circle', bg: '#1D1D1F', color: '#fff' },
  error:   { icon: 'close-circle',     bg: '#FF3B30', color: '#fff' },
  warning: { icon: 'warning',          bg: '#FF9500', color: '#fff' },
  info:    { icon: 'information-circle', bg: '#3A3A3C', color: '#fff' },
};

const HAPTIC: Record<ToastType, () => void> = {
  success: hapticSuccess,
  error:   hapticError,
  warning: hapticWarning,
  info:    hapticLight,
};

// ─── Single Toast item ─────────────────────────────────────────────────────────
const ToastItem: React.FC<{
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  onRemove: (id: string) => void;
  index: number;
}> = ({ id, message, type, duration, onRemove, index }) => {
  const translateY = useSharedValue(-80);
  const opacity    = useSharedValue(0);
  const scale      = useSharedValue(0.92);

  const dismiss = () => {
    opacity.value    = withTiming(0,   { duration: 200 });
    translateY.value = withTiming(-60, { duration: 200 });
    scale.value      = withTiming(0.92, { duration: 200 }, () => {
      runOnJS(onRemove)(id);
    });
  };

  useEffect(() => {
    // Haptic on appear
    HAPTIC[type]?.();

    // Animate in
    translateY.value = withSpring(index * -56, { damping: 20, stiffness: 260 });
    opacity.value    = withTiming(1, { duration: 180 });
    scale.value      = withSpring(1, { damping: 18, stiffness: 280 });

    // Auto dismiss
    const t = setTimeout(dismiss, duration);
    return () => clearTimeout(t);
  }, []);

  // Reposition when index changes (new toast pushed this one up)
  useEffect(() => {
    translateY.value = withSpring(index * -56, { damping: 20, stiffness: 260 });
  }, [index]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const cfg = CONFIG[type];

  return (
    <Animated.View style={[styles.toast, { backgroundColor: cfg.bg }, animStyle]}>
      <Pressable style={styles.toastInner} onPress={dismiss}>
        <Ionicons name={cfg.icon} size={18} color={cfg.color} style={{ flexShrink: 0 }} />
        <Text style={[styles.msg, { color: cfg.color }]} numberOfLines={2}>
          {message}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

// ─── Toast container — render semua active toasts ──────────────────────────────
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      style={[styles.container, { top: insets.top + 12 }]}
      pointerEvents="box-none"
    >
      {toasts.map((t, i) => (
        <ToastItem
          key={t.id}
          {...t}
          index={toasts.length - 1 - i}
          onRemove={removeToast}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    position: 'absolute',
    width: '100%',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  msg: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
  },
});
