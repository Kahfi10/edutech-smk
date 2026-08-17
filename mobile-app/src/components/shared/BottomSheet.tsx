/**
 * BottomSheet — Reanimated v4 (UI thread, 60/120fps)
 *
 * Layout:
 *   Modal
 *   └─ KeyboardAvoidingView  flex:1 justifyContent:flex-end
 *      ├─ backdrop (absoluteFill Animated.View)
 *      └─ sheet (Animated.View — slide up/down + fade backdrop)
 */
import React, { useEffect } from 'react';
import {
  Modal, View, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius } from '../../constants/theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  scrollable?: boolean;
}

// Spring config — lebih natural dari ease-out
const SPRING = { damping: 22, stiffness: 220, mass: 0.8 };

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible, onClose, children, scrollable = true,
}) => {
  const insets  = useSafeAreaInsets();
  const slideY  = useSharedValue(320);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Backdrop fade in
      opacity.value = withTiming(1, { duration: 180 });
      // Sheet spring in — terasa "dilempar ke atas" bukan linear
      slideY.value  = withSpring(0, SPRING);
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      slideY.value  = withTiming(320, { duration: 200 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.kavFull}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Sheet — flex child di bawah, naik saat keyboard muncul */}
        <Animated.View
          style={[
            styles.sheetWrap,
            { paddingBottom: insets.bottom + 8 },
            sheetStyle,
          ]}
        >
          <View style={styles.handle} />

          {scrollable ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              bounces={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.content}>{children}</View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  kavFull: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetWrap: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 36, height: 4,
    backgroundColor: Colors.gray9,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  scrollContent: { padding: 20, paddingTop: 8 },
  content:       { padding: 20, paddingTop: 8 },
});
