import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY            ?? '',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? '',
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID         ?? '',
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID             ?? '',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// metro.config.js memastikan @firebase/auth → dist/rn/index.js di platform iOS/Android
// sehingga getReactNativePersistence tersedia
let auth: ReturnType<typeof getAuth>;
try {
  // Coba dapatkan getReactNativePersistence dari bundle yang sudah di-resolve Metro
  const rnAuth = require('@firebase/auth') as any;
  const getReactNativePersistence = rnAuth?.getReactNativePersistence;

  if (typeof getReactNativePersistence === 'function') {
    // RN bundle tersedia (iOS/Android) — gunakan AsyncStorage persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } else {
    // Web bundle — inMemoryPersistence
    auth = initializeAuth(app, { persistence: inMemoryPersistence });
  }
} catch {
  // initializeAuth sudah dipanggil (hot reload) — ambil instance yang ada
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;
