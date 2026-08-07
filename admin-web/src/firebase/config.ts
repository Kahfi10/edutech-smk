import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyA94eenf8Mu2dYXbDtsAX57206j6MK3ejA",
  authDomain:        "edutech-smk.firebaseapp.com",
  projectId:         "edutech-smk",
  storageBucket:     "edutech-smk.firebasestorage.app",
  messagingSenderId: "1007739019694",
  appId:             "1:1007739019694:web:a48af541050df726a6683f",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export default app;
