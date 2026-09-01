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
 * Upload a document or media file directly to Firebase Storage with real-time 0% -> 100% progress tracking
 */
export async function uploadFileToFirebaseStorage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ downloadUrl: string; storagePath: string; fileName: string; fileSize: number; mimeType?: string }> {
  if (!file) {
    throw new Error('Không có tệp nào được chọn để tải lên.');
  }

  // Ensure storage instance is available
  let storageInstance = firebaseStorage;
  if (!storageInstance && firebaseApp) {
    try {
      storageInstance = getStorage(firebaseApp);
      firebaseStorage = storageInstance;
    } catch (e) {
      console.warn('Khởi tạo Firebase Storage cảnh báo:', e);
    }
  }

  if (!storageInstance) {
    throw new Error('Không thể kết nối Firebase Storage. Vui lòng kiểm tra cấu hình Firebase.');
  }

  // Sanitize filename to avoid invalid storage characters
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `materials/${timestamp}_${cleanName}`;

  if (onProgress) onProgress(5);

  const storageRef = ref(storageInstance, storagePath);
  const metadata = {
    contentType: file.type || 'application/octet-stream',
    customMetadata: {
      originalName: encodeURIComponent(file.name),
      uploadedAt: new Date().toISOString(),
      size: String(file.size),
    }
  };

  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          if (onProgress) onProgress(Math.min(99, Math.max(5, progress)));
        }
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        let errorDetails = error.message || 'Lỗi không xác định khi tải lên Firebase Storage';
        if (error.code === 'storage/unauthorized') {
          errorDetails = 'Quyền truy cập Firebase Storage bị từ chối (storage/unauthorized).';
        } else if (error.code === 'storage/canceled') {
          errorDetails = 'Quá trình tải tệp đã bị hủy.';
        } else if (error.code === 'storage/quota-exceeded') {
          errorDetails = 'Dung lượng lưu trữ Firebase Storage đã đầy (storage/quota-exceeded).';
        } else if (error.code === 'storage/unknown') {
          errorDetails = 'Lỗi kết nối Firebase Storage: ' + error.message;
        } else if (error.code === 'storage/invalid-format') {
          errorDetails = 'Định dạng tệp không được hỗ trợ bởi hệ thống lưu trữ.';
        }
        reject(new Error(errorDetails));
      },
      async () => {
        try {
          if (onProgress) onProgress(100);
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadUrl,
            storagePath,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
          });
        } catch (urlErr: any) {
          console.error('Lỗi khi lấy URL tải về:', urlErr);
          reject(new Error('Đã tải tệp lên nhưng không lấy được link: ' + (urlErr?.message || String(urlErr))));
        }
      }
    );
  });
}

/**
 * Delete a file directly from Firebase Storage
 */
export async function deleteFileFromFirebaseStorage(storagePath: string): Promise<boolean> {
  if (!storagePath) return false;

  let storageInstance = firebaseStorage;
  if (!storageInstance && firebaseApp) {
    try {
      storageInstance = getStorage(firebaseApp);
      firebaseStorage = storageInstance;
    } catch {
      // ignore
    }
  }

  if (storageInstance && storagePath.startsWith('materials/')) {
    try {
      const fileRef = ref(storageInstance, storagePath);
      await deleteObject(fileRef);
      return true;
    } catch (e) {
      console.warn('Xóa file từ Firebase Storage cảnh báo:', e);
      return false;
    }
  }
  return false;
}
