import { initializeApp, getApps, getApp } from 'firebase/app';
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

// Dengan unstable_conditionNames: ['react-native', ...] di metro.config.js,
// @firebase/auth di-resolve ke dist/rn/index.js yang punya getReactNativePersistence
// eslint-disable-next-line @typescript-eslint/no-require-imports
const firebaseAuth = require('@firebase/auth');
const { initializeAuth, getAuth, getReactNativePersistence } = firebaseAuth;

let auth: ReturnType<typeof getAuth>;
try {
  if (typeof getReactNativePersistence === 'function') {
    // RN bundle tersedia → pakai AsyncStorage persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } else {
    // Web bundle fallback → inMemoryPersistence
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { inMemoryPersistence } = require('@firebase/auth');
    auth = initializeAuth(app, { persistence: inMemoryPersistence });
  }
} catch {
  // Hot reload: auth sudah diregistrasi sebelumnya
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;
