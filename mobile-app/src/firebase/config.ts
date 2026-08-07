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

// Gunakan require('firebase/auth') — Metro otomatis resolve ke RN bundle
// Tidak pakai dist/rn/index.js langsung karena tidak ada di exports field
const firebaseAuth = require('firebase/auth');
const { initializeAuth, getAuth, getReactNativePersistence } = firebaseAuth;

let auth: ReturnType<typeof getAuth>;
try {
  // React Native: wajib pakai initializeAuth + AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Hot reload: auth sudah diinisialisasi sebelumnya
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
export default app;
