import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, inMemoryPersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// metro.config.js memastikan firebase/auth → @firebase/auth dist/rn/index.js
// Sehingga getReactNativePersistence tersedia di RN, dan inMemoryPersistence untuk web
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

let auth: ReturnType<typeof getAuth>;

try {
  // Dengan metro.config.js, firebase/auth → RN bundle → getReactNativePersistence tersedia
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getReactNativePersistence } = require('firebase/auth') as {
    getReactNativePersistence: ((storage: typeof AsyncStorage) => unknown) | undefined;
  };

  if (typeof getReactNativePersistence === 'function') {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage) as never,
    });
  } else {
    // Web: tidak ada getReactNativePersistence, pakai inMemoryPersistence
    auth = initializeAuth(app, { persistence: inMemoryPersistence });
  }
} catch {
  // Hot reload: auth sudah teregister, getAuth berhasil
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;
