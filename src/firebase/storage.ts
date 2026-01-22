import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from './index';

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The file to upload
 * @param path The path in storage (e.g., 'daily-postings/userId/filename')
 * @returns Promise resolving to the download URL
 */
export async function uploadFile(file: File, path: string): Promise<string> {
    const { storage } = initializeFirebase();
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
}
