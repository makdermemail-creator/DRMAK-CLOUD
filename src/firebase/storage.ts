import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from './index';

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param file The file to upload
 * @param path The path in storage (e.g., 'daily-postings/userId/filename')
 * @returns Promise resolving to the download URL
 */
export async function uploadFile(file: File, path: string): Promise<string> {
    try {
        console.log('storage.ts: Initializing Firebase SDKs...');
        const { storage } = initializeFirebase();
        const storageRef = ref(storage, path);

        console.log('storage.ts: Starting uploadBytes loop/call for path:', path);
        const result = await uploadBytes(storageRef, file);
        console.log('storage.ts: uploadBytes finished. Metadata:', result.metadata);

        console.log('storage.ts: Fetching download URL...');
        const url = await getDownloadURL(storageRef);
        console.log('storage.ts: Download URL fetched successfully.');
        return url;
    } catch (error) {
        console.error('storage.ts: Error during upload/getURL:', error);
        throw error;
    }
}
