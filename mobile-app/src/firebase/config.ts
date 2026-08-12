import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY            ?? 'AIzaSyA94eenf8Mu2dYXbDtsAX57206j6MK3ejA',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? 'edutech-smk.firebaseapp.com',
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID         ?? 'edutech-smk',
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? 'edutech-smk.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '1007739019694',
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID             ?? '1:1007739019694:web:a48af541050df726a6683f',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: any;

if (Platform.OS === 'web') {
  // WEB: pakai getAuth biasa — tidak butuh AsyncStorage
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
} else {
  // MOBILE (React Native): butuh initializeAuth + AsyncStorage persistence
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const rnAuth = require('@firebase/auth');
    const { initializeAuth, getReactNativePersistence, getAuth } = rnAuth;

    if (typeof getReactNativePersistence === 'function') {
      try {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch {
        // Hot reload — auth sudah diinit
        auth = getAuth(app);
      }
    } else {
      // Fallback
      const { initializeAuth, getAuth, inMemoryPersistence } = require('firebase/auth');
      try {
        auth = initializeAuth(app, { persistence: inMemoryPersistence });
      } catch {
        auth = getAuth(app);
      }
    }
  } catch {
    const { getAuth } = require('firebase/auth');
    auth = getAuth(app);
  }
}

export { auth };
export const db = getFirestore(app);
export default app;
