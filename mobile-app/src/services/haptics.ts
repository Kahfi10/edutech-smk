/**
 * Haptics service — wraps expo-haptics dengan safe fallback
 * Web dan simulator tidak crash — silent no-op
 */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isSupported = Platform.OS !== 'web';

/** Ringan — tap biasa, list item press */
export const hapticLight = () => {
  if (!isSupported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/** Sedang — tab press, toggle */
export const hapticMedium = () => {
  if (!isSupported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

/** Berat — aksi signifikan */
export const hapticHeavy = () => {
  if (!isSupported) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
};

/** Sukses — submit berhasil, simpan berhasil */
export const hapticSuccess = () => {
  if (!isSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/** Error — gagal, validasi gagal */
export const hapticError = () => {
  if (!isSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
};

/** Warning — konfirmasi berbahaya */
export const hapticWarning = () => {
  if (!isSupported) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};
