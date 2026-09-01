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
 * Upload a document or media file with real-time 0% -> 100% progress tracking
 */
export async function uploadFileToFirebaseStorage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ downloadUrl: string; storagePath: string; fileName: string; fileSize: number; mimeType?: string }> {
  if (!file) {
    throw new Error('Không có tệp nào được chọn để tải lên.');
  }

  // Initial progress kick-off
  if (onProgress) onProgress(5);

  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload-file', true);

      // Track true byte-level upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(Math.min(99, Math.max(5, percent)));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success && data.downloadUrl) {
              if (onProgress) onProgress(100);
              resolve({
                downloadUrl: data.downloadUrl,
                storagePath: data.storagePath || `materials/${Date.now()}_${file.name}`,
                fileName: data.fileName || file.name,
                fileSize: data.fileSize || file.size,
                mimeType: data.mimeType || file.type,
              });
            } else {
              reject(new Error(data.error || 'Máy chủ không thể lưu tệp'));
            }
          } catch (jsonErr: any) {
            reject(new Error('Phản hồi từ máy chủ không hợp lệ: ' + jsonErr.message));
          }
        } else {
          let errMsg = `Lỗi máy chủ (${xhr.status})`;
          try {
            const errData = JSON.parse(xhr.responseText);
            if (errData.error) errMsg = errData.error;
          } catch {
            // ignore
          }
          reject(new Error(errMsg));
        }
      };

      xhr.onerror = () => {
        // If XHR network error, try fallback via base64
        console.warn('XHR FormData upload failed, attempting fallback...');
        uploadViaBase64Fallback(file, onProgress)
          .then(resolve)
          .catch((fallbackErr) => {
            reject(new Error('Lỗi kết nối mạng khi tải tệp: ' + fallbackErr.message));
          });
      };

      xhr.ontimeout = () => {
        reject(new Error('Quá thời gian tải tệp lên máy chủ (Timeout). Vui lòng thử lại với tệp nhỏ hơn.'));
      };

      // 5-minute timeout for large files
      xhr.timeout = 300000;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('fileSize', String(file.size));
      formData.append('fileType', file.type);

      xhr.send(formData);
    } catch (err: any) {
      console.warn('Exception during XHR upload, trying Base64 fallback:', err);
      uploadViaBase64Fallback(file, onProgress)
        .then(resolve)
        .catch(reject);
    }
  });
}

/**
 * Fallback upload method via Base64 JSON
 */
async function uploadViaBase64Fallback(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ downloadUrl: string; storagePath: string; fileName: string; fileSize: number; mimeType?: string }> {
  if (onProgress) onProgress(20);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 40) + 20; // 20% to 60%
        onProgress(percent);
      }
    };

    reader.onload = async () => {
      try {
        if (onProgress) onProgress(70);
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

        if (onProgress) onProgress(90);
        const data = await res.json();
        if (data.success && data.downloadUrl) {
          if (onProgress) onProgress(100);
          resolve({
            downloadUrl: data.downloadUrl,
            storagePath: data.storagePath || `materials/${Date.now()}_${file.name}`,
            fileName: data.fileName || file.name,
            fileSize: data.fileSize || file.size,
            mimeType: file.type,
          });
        } else {
          throw new Error(data.error || 'Không thể lưu tệp trên server');
        }
      } catch (err: any) {
        console.error('Base64 fallback failed:', err);
        reject(err);
      }
    };

    reader.onerror = (err) => reject(new Error('Lỗi khi đọc tệp từ thiết bị: ' + String(err)));
    reader.readAsDataURL(file);
  });
}

/**
 * Delete a file from Storage
 */
export async function deleteFileFromFirebaseStorage(storagePath: string): Promise<boolean> {
  if (!storagePath) return false;

  // 1. If Firebase Storage ref path
  if (firebaseStorage && isConfigured && storagePath.startsWith('materials/')) {
    try {
      const fileRef = ref(firebaseStorage, storagePath);
      await deleteObject(fileRef).catch(() => {});
    } catch (e) {
      console.warn('Firebase Storage delete warning:', e);
    }
  }

  // 2. Server API delete
  try {
    const res = await fetch('/api/delete-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath }),
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (e) {
    console.warn('Server delete file error:', e);
    return false;
  }
}
