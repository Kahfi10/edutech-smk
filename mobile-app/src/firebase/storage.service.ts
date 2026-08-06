import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

export const uploadFile = (
  path: string,
  file: Blob,
  onProgress?: (pct: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      'state_changed',
      snapshot => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(pct));
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve(url);
      }
    );
  });
};

export const deleteFile = async (path: string) => {
  return deleteObject(ref(storage, path));
};

export const getFileUrl = async (path: string) => {
  return getDownloadURL(ref(storage, path));
};
