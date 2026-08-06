import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { UserProfile } from '../types';
import { UserRole } from '../constants/roles';

export const loginUser = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async () => {
  return signOut(auth);
};

export const createUser = async (
  email: string,
  password: string,
  profile: Omit<UserProfile, 'uid' | 'createdAt'>
) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const userData: UserProfile = {
    ...profile,
    uid: cred.user.uid,
    createdAt: Timestamp.now(),
  };
  await setDoc(doc(db, 'users', cred.user.uid), userData);
  return cred;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
