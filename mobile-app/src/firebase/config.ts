import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, type Persistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Isi file .env dengan config dari Firebase Console ───────────
// Firebase Storage TIDAK digunakan (butuh plan berbayar)
// Yang dipakai: Auth + Firestore + FCM (semua GRATIS di Spark plan)
const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY            ?? '',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? '',
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID         ?? '',
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID             ?? '',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let _auth = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getReactNativePersistence } = require('@firebase/auth/dist/rn/index.js') as {
      getReactNativePersistence: (s: typeof AsyncStorage) => Persistence;
    };
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
})();

export const auth = _auth;
export const db   = getFirestore(app);
// Storage dihapus — gunakan placeholder URL untuk demo
export default app;
