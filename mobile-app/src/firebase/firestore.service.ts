import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';

// ─── Generic helpers ────────────────────────────────────────

export const addDocument = async (colPath: string, data: object) => {
  return addDoc(collection(db, colPath), {
    ...data,
    createdAt: Timestamp.now(),
  });
};

/** setDoc tanpa merge — REPLACE penuh (pakai hati-hati) */
export const setDocument = async (colPath: string, id: string, data: object) => {
  return setDoc(doc(db, colPath, id), data);
};

/** setDoc dengan merge: true — upsert, tidak hapus field yang tidak disebut */
export const upsertDocument = async (colPath: string, id: string, data: object) => {
  return setDoc(doc(db, colPath, id), data, { merge: true });
};

export const updateDocument = async (colPath: string, id: string, data: object) => {
  return updateDoc(doc(db, colPath, id), data);
};

export const deleteDocument = async (colPath: string, id: string) => {
  return deleteDoc(doc(db, colPath, id));
};

export const getDocument = async (colPath: string, id: string) => {
  const snap = await getDoc(doc(db, colPath, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getCollection = async (colPath: string, ...constraints: QueryConstraint[]) => {
  const q = query(collection(db, colPath), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const subscribeCollection = (
  colPath: string,
  callback: (data: any[]) => void,
  ...constraints: QueryConstraint[]
) => {
  const q = query(collection(db, colPath), ...constraints);
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.warn('[Firestore] subscribeCollection error:', colPath, err.code);
  });
};

export const subscribeDocument = (
  colPath: string,
  id: string,
  callback: (data: any | null) => void
) => {
  return onSnapshot(doc(db, colPath, id), snap => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
};

// ─── Re-export query helpers ─────────────────────────────────
export { where, orderBy, Timestamp };
