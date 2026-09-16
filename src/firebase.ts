import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore,
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
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

// Build effective config prioritizing environment variables (e.g. on Vercel) while falling back to firebase-applet-config.json
const env = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {} as any;
const effectiveApiKey = (env.VITE_FIREBASE_API_KEY || firebaseConfig?.apiKey || '').trim();
const effectiveProjectId = (env.VITE_FIREBASE_PROJECT_ID || firebaseConfig?.projectId || 'gen-lang-client-0412364902').trim();
const effectiveAuthDomain = (env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig?.authDomain || `${effectiveProjectId}.firebaseapp.com`).trim();
const effectiveStorageBucket = (env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig?.storageBucket || `${effectiveProjectId}.firebasestorage.app`).trim();
const effectiveMessagingSenderId = (env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig?.messagingSenderId || '').trim();
const effectiveAppId = (env.VITE_FIREBASE_APP_ID || firebaseConfig?.appId || '').trim();
const effectiveFirestoreDatabaseId = (
  env.VITE_FIREBASE_DATABASE_ID ||
  (firebaseConfig as any)?.firestoreDatabaseId ||
  'ai-studio-khohcliustinhc-d1221524-e1da-4e37-9e1c-3b7a87331d67'
).trim();

// Check if Firebase config is populated
if (effectiveApiKey && effectiveApiKey !== '') {
  try {
    const existingApps = getApps();
    firebaseApp = existingApps.length > 0 ? existingApps[0] : initializeApp({
      apiKey: effectiveApiKey,
      authDomain: effectiveAuthDomain,
      projectId: effectiveProjectId,
      storageBucket: effectiveStorageBucket,
      messagingSenderId: effectiveMessagingSenderId,
      appId: effectiveAppId,
    });
    
    // Explicitly connect to the exact Firestore database for this application
    try {
      firestoreDb = initializeFirestore(firebaseApp, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      }, effectiveFirestoreDatabaseId);
    } catch {
      // Fallback nếu Firestore đã được khởi tạo
      firestoreDb = getFirestore(firebaseApp, effectiveFirestoreDatabaseId);
    }
    
    firebaseAuth = getAuth(firebaseApp);
    
    // Khởi tạo Firebase Storage (Cloud Object Storage)
    try {
      const cleanBucket = effectiveStorageBucket.replace(/^gs:\/\//, '').trim();
      firebaseStorage = cleanBucket ? getStorage(firebaseApp, `gs://${cleanBucket}`) : getStorage(firebaseApp);
    } catch (sErr) {
      try {
        firebaseStorage = getStorage(firebaseApp);
      } catch (err2) {
        console.error("Lỗi khởi tạo Firebase Storage:", err2);
      }
    }

    isConfigured = true;
    
    console.log("Firebase kết nối thành công! Project:", effectiveProjectId, "Database:", effectiveFirestoreDatabaseId);
    
    // Validate connection on startup
    const testConnection = async () => {
      try {
        if (firestoreDb) {
          await getDocFromServer(doc(firestoreDb, 'app_config', 'banner'));
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn("Đang hoạt động offline hoặc kết nối Firestore đang chờ mạng.");
        }
      }
    };
    testConnection();
  } catch (err) {
    console.error("Lỗi nghiêm trọng khi khởi tạo Firebase:", err);
  }
} else {
  console.error("LỖI CẤU HÌNH: Thiếu Firebase API Key! Vui lòng cấu hình các biến VITE_FIREBASE_* trong file .env hoặc kiểm tra file firebase-applet-config.json.");
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
 * Upload a document or media file to Cloud Firestore in chunked documents
 * Provides 100% multi-device cross-platform persistence even when storage bucket billing is not active
 */
export async function uploadFileToFirestoreChunks(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ downloadUrl: string; storagePath: string; fileName: string; fileSize: number; mimeType?: string }> {
  if (!firestoreDb) {
    throw new Error('Cơ sở dữ liệu đám mây Firestore chưa được khởi tạo.');
  }

  const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const CHUNK_SIZE = 400 * 1024; // 400 KB per chunk (safe within Firestore 1MB document limit)

  if (onProgress) onProgress(10);

  // Read file as ArrayBuffer
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const totalChunks = Math.max(1, Math.ceil(bytes.length / CHUNK_SIZE));

  // 1. Save metadata document in Firestore
  await setDoc(doc(firestoreDb, 'files', fileId), {
    id: fileId,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
    totalChunks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (onProgress) onProgress(25);

  // 2. Upload chunks with base64 encoding
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(bytes.length, start + CHUNK_SIZE);
    const chunkBytes = bytes.subarray(start, end);
    
    // Efficient binary to base64 conversion
    let binary = '';
    const len = chunkBytes.byteLength;
    for (let j = 0; j < len; j++) {
      binary += String.fromCharCode(chunkBytes[j]);
    }
    const chunkBase64 = btoa(binary);

    await setDoc(doc(firestoreDb, 'files', fileId, 'chunks', String(i)), {
      index: i,
      data: chunkBase64,
    });

    if (onProgress) {
      const pct = Math.round(25 + ((i + 1) / totalChunks) * 70);
      onProgress(Math.min(99, pct));
    }
  }

  if (onProgress) onProgress(100);

  return {
    downloadUrl: `/api/files/${fileId}`,
    storagePath: `firestore_files/${fileId}`,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
  };
}

/**
 * Directly fetch file binary chunks from Cloud Firestore and construct a client-side Blob.
 * Ensures 100% cross-device compatibility on static hosting (such as Vercel) without needing a backend server.
 */
export async function getFileBlobFromFirestore(
  fileId: string
): Promise<{ blob: Blob; fileName: string; mimeType: string } | null> {
  if (!firestoreDb) return null;
  try {
    const metaRef = doc(firestoreDb, 'files', fileId);
    const metaSnap = await getDoc(metaRef);
    if (!metaSnap.exists()) return null;

    const metaData = metaSnap.data();
    const totalChunks = metaData.totalChunks || 1;
    const mimeType = metaData.mimeType || 'application/octet-stream';
    const fileName = metaData.fileName || 'file';

    const chunkPromises = [];
    for (let i = 0; i < totalChunks; i++) {
      chunkPromises.push(getDoc(doc(firestoreDb, 'files', fileId, 'chunks', String(i))));
    }
    const chunkSnaps = await Promise.all(chunkPromises);

    const byteArrays: Uint8Array[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const snap = chunkSnaps[i];
      if (!snap.exists()) {
        throw new Error(`Thiếu khối dữ liệu ${i} của tệp`);
      }
      const b64 = snap.data().data;
      const bin = atob(b64);
      const u8 = new Uint8Array(bin.length);
      for (let j = 0; j < bin.length; j++) {
        u8[j] = bin.charCodeAt(j);
      }
      byteArrays.push(u8);
    }

    const blob = new Blob(byteArrays, { type: mimeType });
    return { blob, fileName, mimeType };
  } catch (err) {
    console.error('Lỗi khi tải dữ liệu tệp từ Firestore chunks:', err);
    return null;
  }
}

/**
 * Tải tệp tài liệu hoặc phương tiện lên Firebase Storage đám mây với URL tải về công khai
 * URL trả về bắt đầu bằng https://firebasestorage.googleapis.com/...
 * Hỗ trợ theo dõi tiến trình upload thời gian thực (0% -> 100%)
 */
export async function uploadFileToFirebaseStorage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ downloadUrl: string; storagePath: string; fileName: string; fileSize: number; mimeType?: string }> {
  if (!file) {
    throw new Error('Không có tệp nào được chọn để tải lên.');
  }

  // Đảm bảo instance Firebase Storage đã sẵn sàng
  let storageInstance = firebaseStorage;
  if (!storageInstance && firebaseApp) {
    try {
      const cleanBucket = effectiveStorageBucket.replace(/^gs:\/\//, '').trim();
      storageInstance = cleanBucket ? getStorage(firebaseApp, `gs://${cleanBucket}`) : getStorage(firebaseApp);
      firebaseStorage = storageInstance;
    } catch (e) {
      console.warn('Khởi tạo Firebase Storage cảnh báo:', e);
    }
  }

  // Làm sạch tên tệp để an toàn trên đường dẫn Cloud Storage
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `materials/${timestamp}_${cleanName}`;

  if (onProgress) onProgress(5);

  // Tải trực tiếp lên Firebase Storage
  if (storageInstance) {
    try {
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

      const result = await new Promise<{ downloadUrl: string; storagePath: string; fileName: string; fileSize: number; mimeType?: string }>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (snapshot.totalBytes > 0) {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              if (onProgress) onProgress(Math.min(95, Math.max(5, progress)));
            }
          },
          (error) => {
            console.error('Lỗi khi tải file lên Firebase Storage:', error);
            reject(error);
          },
          async () => {
            try {
              if (onProgress) onProgress(100);
              // Lấy Download URL bắt đầu bằng https://firebasestorage.googleapis.com/...
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('Tải tệp thành công lên Firebase Storage:', downloadUrl);
              resolve({
                downloadUrl,
                storagePath,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type || 'application/octet-stream',
              });
            } catch (urlErr) {
              console.error('Lỗi lấy getDownloadURL:', urlErr);
              reject(urlErr);
            }
          }
        );
      });

      return result;
    } catch (storageErr) {
      console.error('Lỗi Firebase Storage upload:', storageErr);
      // Fallback sang Firestore chunks nếu bucket chưa kích hoạt quyền ghi
      console.warn('Đang chuyển sang giải pháp lưu trữ chunk trên Firestore...');
    }
  }

  // Dự phòng an toàn: Lưu trữ chunk trên Cloud Firestore cho mọi thiết bị
  return await uploadFileToFirestoreChunks(file, onProgress);
}

/**
 * Delete a file directly from Firebase Storage or Firestore chunk storage
 */
export async function deleteFileFromFirebaseStorage(storagePath: string): Promise<boolean> {
  if (!storagePath) return false;

  // Handle Firestore chunked files
  if (storagePath.startsWith('firestore_files/') && firestoreDb) {
    try {
      const fileId = storagePath.replace('firestore_files/', '');
      const metaRef = doc(firestoreDb, 'files', fileId);
      const metaSnap = await getDoc(metaRef);
      if (metaSnap.exists()) {
        const total = metaSnap.data().totalChunks || 1;
        for (let i = 0; i < total; i++) {
          await deleteDoc(doc(firestoreDb, 'files', fileId, 'chunks', String(i))).catch(() => {});
        }
        await deleteDoc(metaRef);
      }
      return true;
    } catch (e) {
      console.warn('Xóa file từ Firestore cảnh báo:', e);
      return false;
    }
  }

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
