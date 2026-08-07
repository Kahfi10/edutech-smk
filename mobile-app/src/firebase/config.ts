import { initializeApp, getApps, getApp } from 'firebase/app';
import * as firebaseAuthModule from 'firebase/auth';
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

// Cast as any — Metro bundler resolve ke RN bundle yang punya getReactNativePersistence
// TypeScript web types tidak punya export ini, tapi RN bundle ada
const {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} = firebaseAuthModule as any;

let auth: ReturnType<typeof firebaseAuthModule.getAuth>;

try {
  if (typeof getReactNativePersistence === 'function') {
    // React Native path: pakai AsyncStorage persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } else {
    // Web path atau saat unit test
    auth = getAuth(app);
  }
} catch {
  // Hot reload: auth sudah diinisialisasi
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;
