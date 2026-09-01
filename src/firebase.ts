import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  FirebaseStorage
} from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let firebaseApp: any = null;
let firestoreDb: Firestore | null = null;
let firebaseAuth: any = null;
let firebaseStorage: FirebaseStorage | null = null;
let isConfigured = false;

// Check if firebase-applet-config is populated
if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "") {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    
    // Enable offline persistent cache and force long-polling to prevent proxy/network timeout issues
    firestoreDb = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      experimentalForceLongPolling: true
    });
    
    firebaseAuth = getAuth(firebaseApp);
    
    try {
      firebaseStorage = getStorage(firebaseApp);
    } catch (sErr) {
      console.warn("Storage init warning:", sErr);
    }

    isConfigured = true;
    
    console.log("Firebase successfully initialized with offline persistence & storage!");
    
    // Validate connection on startup as mandated
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(firestoreDb!, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn("Please check your Firebase configuration or network status.");
        }
      }
    };
    testConnection();
  } catch (err) {
    console.error("Failed to initialize Firebase", err);
  }
} else {
  console.log("Firebase is not fully configured yet. Falling back to local storage.");
}

export const app = firebaseApp;
export const db = firestoreDb;
export const auth = firebaseAuth;
export const storage = firebaseStorage;
export { isConfigured };

export const googleProvider = new GoogleAuthProvider();

// Error handler strictly conforming to FirestoreErrorInfo format
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth ? auth.currentUser : null;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to sign in with Google Popup
export async function loginWithGoogle(): Promise<User | null> {
  if (!isConfigured || !auth) {
    throw new Error("Firebase is not configured yet. Please configure it to enable login.");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error during Google sign-in", error);
    throw error;
  }
}

// Helper to sign out
export async function logout(): Promise<void> {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
}

/**
 * Upload a document or media file to Firebase Storage
 */
export async function uploadFileToFirebaseStorage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ downloadUrl: string; storagePath: string }> {
  // Sanitize filename to avoid invalid storage characters
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `materials/${timestamp}_${cleanName}`;

  if (firebaseStorage && isConfigured) {
    try {
      const storageRef = ref(firebaseStorage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || 'application/octet-stream',
        customMetadata: {
          originalName: encodeURIComponent(file.name),
          uploadedAt: new Date().toISOString(),
        }
      });

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(Math.round(progress));
          },
          (error) => {
            console.error('Firebase Storage upload error:', error);
            // Fallback to server upload if direct client upload fails
            uploadViaServerApi(file, onProgress).then(resolve).catch(reject);
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              if (onProgress) onProgress(100);
              resolve({ downloadUrl, storagePath });
            } catch (urlErr) {
              console.error('Error getting download URL:', urlErr);
              uploadViaServerApi(file, onProgress).then(resolve).catch(reject);
            }
          }
        );
      });
    } catch (err) {
      console.warn('Firebase Storage upload exception, attempting server fallback:', err);
      return uploadViaServerApi(file, onProgress);
    }
  }

  // Fallback to server API upload
  return uploadViaServerApi(file, onProgress);
}

/**
 * Server-side upload API fallback
 */
async function uploadViaServerApi(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ downloadUrl: string; storagePath: string }> {
  if (onProgress) onProgress(30);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        if (onProgress) onProgress(60);
        const base64Data = reader.result as string;
        const res = await fetch('/api/upload-file', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            data: base64Data,
          }),
        });

        const data = await res.json();
        if (data.success && data.downloadUrl) {
          if (onProgress) onProgress(100);
          resolve({
            downloadUrl: data.downloadUrl,
            storagePath: data.storagePath || `server_uploads/${Date.now()}_${file.name}`,
          });
        } else {
          // If server returns base64 directly or offline
          if (onProgress) onProgress(100);
          resolve({
            downloadUrl: base64Data,
            storagePath: `local/${Date.now()}_${file.name}`,
          });
        }
      } catch (err) {
        console.warn('Server upload fallback error, using data URL:', err);
        if (onProgress) onProgress(100);
        resolve({
          downloadUrl: (reader.result as string) || URL.createObjectURL(file),
          storagePath: `blob/${Date.now()}_${file.name}`,
        });
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFileFromFirebaseStorage(storagePath: string): Promise<boolean> {
  if (!storagePath) return false;

  // Firebase Storage delete
  if (firebaseStorage && isConfigured && storagePath.startsWith('materials/')) {
    try {
      const fileRef = ref(firebaseStorage, storagePath);
      await deleteObject(fileRef);
      return true;
    } catch (e) {
      console.warn('Firebase Storage delete warning:', e);
    }
  }

  // Server API delete
  try {
    await fetch('/api/delete-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath }),
    });
    return true;
  } catch (e) {
    console.warn('Server delete file error:', e);
    return false;
  }
}
