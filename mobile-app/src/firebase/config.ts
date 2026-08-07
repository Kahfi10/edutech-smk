import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY            ?? 'placeholder',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? 'placeholder.firebaseapp.com',
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID         ?? 'placeholder',
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? 'placeholder.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '000000000000',
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID             ?? '1:000000000000:web:placeholder',
};

// Cegah duplikat inisialisasi (hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// React Native: butuh AsyncStorage untuk persistensi auth
// Guard: cek apakah auth sudah diinisialisasi sebelumnya
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Sudah diinisialisasi (hot reload) — ambil instance yang ada
  auth = getAuth(app);
}

export { auth };
export const db      = getFirestore(app);
export const storage = getStorage(app);
export default app;
