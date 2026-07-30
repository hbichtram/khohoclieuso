import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Grid,
  List,
  SlidersHorizontal,
  FolderOpen,
  ArrowUpDown,
  BookOpen,
  Database,
  BarChart2,
  Trash2,
  PlusCircle,
  HelpCircle,
  Upload,
  Shield,
  Eye,
  Lock,
} from 'lucide-react';

import { LinkItem, Category, Settings, ToastMessage } from './types';
import { StorageService } from './storage';
import { Sidebar } from './components/Sidebar';
import { LinkCard } from './components/LinkCard';
import { AddEditModal } from './components/AddEditModal';
import { CategoryModal } from './components/CategoryModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { AdminPinModal } from './components/AdminPinModal';
import { Dashboard } from './components/Dashboard';
import { SubFolderView } from './components/SubFolderView';
import { Toast } from './components/Toast';

import { 
  auth, 
  db, 
  isConfigured, 
  loginWithGoogle, 
  logout, 
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';

const BANNER_AI_IMAGE = 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=1600&q=80';

export default function App() {
  // Load initial configurations from StorageService
  const [links, setLinks] = useState<LinkItem[]>(() => StorageService.getLinks());
  const [tinhoc3Links, setTinhoc3Links] = useState<LinkItem[]>(() => StorageService.getTinHoc3Links());
  const [tinhoc4Links, setTinhoc4Links] = useState<LinkItem[]>(() => StorageService.getTinHoc4Links());
  const [tinhoc5Links, setTinhoc5Links] = useState<LinkItem[]>(() => StorageService.getTinHoc5Links());
  const [categories, setCategories] = useState<Category[]>(() => StorageService.getCategories());
  const [settings, setSettings] = useState<Settings>(() => StorageService.getSettings());

  // User role state: 'admin' | 'viewer'
  const [role, setRole] = useState<'admin' | 'viewer'>(() => {
    return (localStorage.getItem('user_role') as 'admin' | 'viewer') || 'viewer';
  });

  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);

  const handleToggleRole = (newRole: 'admin' | 'viewer') => {
    if (newRole === 'admin') {
      if (role === 'admin') {
        handleAddToast('Bạn đã ở vai trò Người quản trị!', 'info');
        return;
      }
      setIsAdminPinModalOpen(true);
    } else {
      setRole('viewer');
      localStorage.setItem('user_role', 'viewer');
      handleAddToast('Đã chuyển sang vai trò: Người xem', 'info');
    }
  };

  const handleAdminPinConfirm = () => {
    setRole('admin');
    localStorage.setItem('user_role', 'admin');
    handleAddToast('Đăng nhập Quản trị viên thành công!', 'success');
  };

  // Firebase auth & synchronization states
  const [user, setUser] = useState<User | null>(null);
  const [loadingFirebase, setLoadingFirebase] = useState(isConfigured);

  // Navigation / Filter states
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'pinned' | 'dashboard'>('all');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<'tinhoc3' | 'tinhoc4' | 'tinhoc5' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'titleAZ' | 'titleZA' | 'viewsCount'>('createdAt');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal open states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingLink, setDeletingLink] = useState<LinkItem | null>(null);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Hidden file input ref for JSON backups import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast dispatch helpers
  const handleAddToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth changed listener
  useEffect(() => {
    if (!isConfigured || !auth) {
      setLoadingFirebase(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingFirebase(false);
      if (currentUser) {
        handleAddToast(`Chào mừng Admin: ${currentUser.displayName || currentUser.email}!`, 'success');
      } else {
        // Reset to local database when logged out
        setLinks(StorageService.getLinks());
        setCategories(StorageService.getCategories());
        setSettings(StorageService.getSettings());
      }
    });
    return () => unsubscribe();
  }, []);

  // Realtime Cloud synchronization listeners
  useEffect(() => {
    if (!user || !db) return;

    let hasShownPermissionError = false;

    const handleSyncError = (error: any, path: string, operation: OperationType) => {
      console.warn(`Firestore sync error on ${path}:`, error);
      if (error.code === 'permission-denied' || (error.message && error.message.toLowerCase().includes('permission'))) {
        if (!hasShownPermissionError) {
          hasShownPermissionError = true;
          handleAddToast('Lỗi phân quyền Firestore! Hãy cập nhật Rules trên Firebase Console theo hướng dẫn.', 'error');
          // Fallback to local storage so user has active data
          setLinks(StorageService.getLinks());
          setCategories(StorageService.getCategories());
          setSettings(StorageService.getSettings());
        }
      } else {
        handleFirestoreError(error, operation, path);
      }
    };

    // 1. Subscribe to Settings document
    const settingsDocRef = doc(db, 'users', user.uid);
    const unsubSettings = onSnapshot(settingsDocRef, (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as Settings);
      } else {
        // First-time user: upload current local settings to firestore
        setDoc(settingsDocRef, settings)
          .catch((err) => handleSyncError(err, `users/${user.uid}`, OperationType.WRITE));
      }
    }, (error) => {
      handleSyncError(error, `users/${user.uid}`, OperationType.GET);
    });

    // 2. Subscribe to Categories collection
    const categoriesColRef = collection(db, 'users', user.uid, 'categories');
    const unsubCategories = onSnapshot(categoriesColRef, async (snap) => {
      if (!snap.empty) {
        const catsList: Category[] = [];
        snap.forEach((docSnap) => {
          catsList.push(docSnap.data() as Category);
        });
        setCategories(catsList);
      } else {
        // Upload initial default categories to firestore
        const currentCats = categories.length > 0 ? categories : StorageService.getCategories();
        for (const cat of currentCats) {
          await setDoc(doc(categoriesColRef, cat.id), {
            id: cat.id,
            name: cat.name,
            color: cat.color,
            userId: user.uid,
          }).catch((err) => handleSyncError(err, `users/${user.uid}/categories/${cat.id}`, OperationType.WRITE));
        }
      }
    }, (error) => {
      handleSyncError(error, `users/${user.uid}/categories`, OperationType.GET);
    });

    // 3. Subscribe to Links collection
    const linksColRef = collection(db, 'users', user.uid, 'links');
    const unsubLinks = onSnapshot(linksColRef, async (snap) => {
      const linksList: LinkItem[] = [];
      const tinhoc3List: LinkItem[] = [];
      const tinhoc4List: LinkItem[] = [];
      const tinhoc5List: LinkItem[] = [];

      snap.forEach((docSnap) => {
        const item = docSnap.data() as LinkItem;
        const linkWithId = { ...item, id: docSnap.id } as LinkItem;
        if (item.subCategoryId === 'tinhoc3') {
          tinhoc3List.push(linkWithId);
        } else if (item.subCategoryId === 'tinhoc4') {
          tinhoc4List.push(linkWithId);
        } else if (item.subCategoryId === 'tinhoc5') {
          tinhoc5List.push(linkWithId);
        } else {
          linksList.push(linkWithId);
        }
      });

      setLinks(linksList);
      setTinhoc3Links(tinhoc3List);
      setTinhoc4Links(tinhoc4List);
      setTinhoc5Links(tinhoc5List);

      // Upload local links if Firestore is completely empty
      if (snap.empty) {
        if (links.length > 0) {
          for (const link of links) {
            await setDoc(doc(linksColRef, link.id), {
              ...link,
              userId: user.uid,
            }).catch((err) => handleSyncError(err, `users/${user.uid}/links/${link.id}`, OperationType.WRITE));
          }
        }
        if (tinhoc3Links.length > 0) {
          for (const link of tinhoc3Links) {
            await setDoc(doc(linksColRef, link.id), {
              ...link,
              userId: user.uid,
              subCategoryId: 'tinhoc3',
            }).catch((err) => handleSyncError(err, `users/${user.uid}/links/${link.id}`, OperationType.WRITE));
          }
        }
        if (tinhoc4Links.length > 0) {
          for (const link of tinhoc4Links) {
            await setDoc(doc(linksColRef, link.id), {
              ...link,
              userId: user.uid,
              subCategoryId: 'tinhoc4',
            }).catch((err) => handleSyncError(err, `users/${user.uid}/links/${link.id}`, OperationType.WRITE));
          }
        }
        if (tinhoc5Links.length > 0) {
          for (const link of tinhoc5Links) {
            await setDoc(doc(linksColRef, link.id), {
              ...link,
              userId: user.uid,
              subCategoryId: 'tinhoc5',
            }).catch((err) => handleSyncError(err, `users/${user.uid}/links/${link.id}`, OperationType.WRITE));
          }
        }
      }
    }, (error) => {
      handleSyncError(error, `users/${user.uid}/links`, OperationType.GET);
    });

    return () => {
      unsubSettings();
      unsubCategories();
      unsubLinks();
    };
  }, [user]);

  // Synchronize HTML dark mode class when theme or settings update
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Also save settings to localStorage for non-signed-in state
    if (!user) {
      StorageService.saveSettings(settings);
    }
  }, [settings, user]);

  // Authentication click actions
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      handleAddToast('Đăng nhập thất bại. Vui lòng thử lại.', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleAddToast('Đã đăng xuất thành công!', 'info');
    } catch (err) {
      handleAddToast('Lỗi khi đăng xuất!', 'error');
    }
  };

  // Synchronize layout theme preferences
  const handleUpdateSettings = async (newSettings: Settings) => {
    setSettings(newSettings);
    if (user && db) {
      await setDoc(doc(db, 'users', user.uid), newSettings)
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
    } else {
      StorageService.saveSettings(newSettings);
    }
  };

  // Categories mutators
  const handleSaveCategories = async (updatedCats: Category[]) => {
    if (role === 'viewer') {
      handleAddToast('Bạn đang ở chế độ Người xem, không thể thay đổi danh mục!', 'error');
      return;
    }
    setCategories(updatedCats);
    if (user && db) {
      const categoriesColRef = collection(db, 'users', user.uid, 'categories');
      const currentIds = new Set(updatedCats.map((c) => c.id));
      const previousCats = categories;

      // Delete removed categories
      for (const prev of previousCats) {
        if (!currentIds.has(prev.id)) {
          await deleteDoc(doc(categoriesColRef, prev.id))
            .catch((err) => handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/categories/${prev.id}`));
        }
      }

      // Save all updated categories
      for (const cat of updatedCats) {
        await setDoc(doc(categoriesColRef, cat.id), {
          id: cat.id,
          name: cat.name,
          color: cat.color,
          userId: user.uid,
        }).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/categories/${cat.id}`));
      }
    } else {
      StorageService.saveCategories(updatedCats);
    }
  };

  // Subfolder counts
  const tinhoc3Count = useMemo(
    () => tinhoc3Links.filter((l) => role === 'admin' || !l.isHidden).length,
    [tinhoc3Links, role]
  );
  const tinhoc4Count = useMemo(
    () => tinhoc4Links.filter((l) => role === 'admin' || !l.isHidden).length,
    [tinhoc4Links, role]
  );
  const tinhoc5Count = useMemo(
    () => tinhoc5Links.filter((l) => role === 'admin' || !l.isHidden).length,
    [tinhoc5Links, role]
  );

  // Helper count of links in each category
  const linksCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    links.forEach((l) => {
      counts[l.categoryId] = (counts[l.categoryId] || 0) + 1;
    });
    counts['cat-work'] = (counts['cat-work'] || 0) + tinhoc3Count + tinhoc4Count + tinhoc5Count;
    return counts;
  }, [links, tinhoc3Count, tinhoc4Count, tinhoc5Count]);

  // Helper to save subfolder or general links to local storage
  const saveLinkToLocalStorage = (link: LinkItem, isDelete = false) => {
    if (link.subCategoryId === 'tinhoc3') {
      const newList = isDelete 
        ? tinhoc3Links.filter(l => l.id !== link.id)
        : (tinhoc3Links.some(l => l.id === link.id) ? tinhoc3Links.map(l => l.id === link.id ? link : l) : [link, ...tinhoc3Links]);
      setTinhoc3Links(newList);
      StorageService.saveTinHoc3Links(newList);
    } else if (link.subCategoryId === 'tinhoc4') {
      const newList = isDelete 
        ? tinhoc4Links.filter(l => l.id !== link.id)
        : (tinhoc4Links.some(l => l.id === link.id) ? tinhoc4Links.map(l => l.id === link.id ? link : l) : [link, ...tinhoc4Links]);
      setTinhoc4Links(newList);
      StorageService.saveTinHoc4Links(newList);
    } else if (link.subCategoryId === 'tinhoc5') {
      const newList = isDelete 
        ? tinhoc5Links.filter(l => l.id !== link.id)
        : (tinhoc5Links.some(l => l.id === link.id) ? tinhoc5Links.map(l => l.id === link.id ? link : l) : [link, ...tinhoc5Links]);
      setTinhoc5Links(newList);
      StorageService.saveTinHoc5Links(newList);
    } else {
      const newList = isDelete 
        ? links.filter(l => l.id !== link.id)
        : (links.some(l => l.id === link.id) ? links.map(l => l.id === link.id ? link : l) : [link, ...links]);
      setLinks(newList);
      StorageService.saveLinks(newList);
    }
  };

  // Links mutators
  const handleSaveLink = async (payload: Partial<LinkItem>) => {
    if (role === 'viewer') {
      handleAddToast('Bạn đang ở chế độ Người xem, không thể thêm hoặc sửa liên kết!', 'error');
      return;
    }
    if (editingLink) {
      // Edit mode
      const updatedLink = {
        ...editingLink,
        ...payload,
        updatedAt: new Date().toISOString(),
      } as LinkItem;

      if (user && db) {
        await setDoc(doc(db, 'users', user.uid, 'links', editingLink.id), {
          ...updatedLink,
          userId: user.uid,
        }).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/links/${editingLink.id}`));
      } else {
        if (editingLink.subCategoryId !== updatedLink.subCategoryId) {
          saveLinkToLocalStorage(editingLink, true);
        }
        saveLinkToLocalStorage(updatedLink, false);
      }
      handleAddToast('Cập nhật liên kết thành công!', 'success');
    } else {
      // Create mode
      const newLinkId = `link-${Date.now()}`;
      const newLink: LinkItem = {
        id: newLinkId,
        title: payload.title || 'Liên kết mới',
        url: payload.url || '',
        description: payload.description || '',
        categoryId: payload.categoryId || 'cat-work',
        color: payload.color || '#3B82F6',
        favicon: payload.favicon || '',
        notes: payload.notes || '',
        isFavorite: !!payload.isFavorite,
        isPinned: !!payload.isPinned,
        viewsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageUrl: payload.imageUrl || '',
        subCategoryId: payload.subCategoryId || '',
        topic: payload.topic || '',
        lesson: payload.lesson || '',
        resourceType: payload.resourceType || '',
        keywords: payload.keywords || '',
        isHidden: !!payload.isHidden,
      };

      if (user && db) {
        await setDoc(doc(db, 'users', user.uid, 'links', newLinkId), {
          ...newLink,
          userId: user.uid,
        }).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/links/${newLinkId}`));
      } else {
        saveLinkToLocalStorage(newLink, false);
      }
      handleAddToast('Đã lưu liên kết mới thành công!', 'success');
    }
    setEditingLink(null);
  };

  const handleDeleteRequest = (link: LinkItem) => {
    if (role === 'viewer') {
      handleAddToast('Bạn đang ở chế độ Người xem, không thể xóa liên kết!', 'error');
      return;
    }
    setDeletingLink(link);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (role === 'viewer') {
      handleAddToast('Bạn đang ở chế độ Người xem, không thể xóa liên kết!', 'error');
      return;
    }
    if (deletingLink) {
      if (user && db) {
        await deleteDoc(doc(db, 'users', user.uid, 'links', deletingLink.id))
          .catch((err) => handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/links/${deletingLink.id}`));
      } else {
        saveLinkToLocalStorage(deletingLink, true);
      }
      handleAddToast('Đã xóa liên kết thành công!', 'success');
    }
    setIsDeleteConfirmOpen(false);
    setDeletingLink(null);
  };

  const handleToggleFavorite = async (id: string) => {
    if (role === 'viewer') {
      handleAddToast('Bạn đang ở chế độ Người xem, không thể thay đổi trạng thái yêu thích!', 'error');
      return;
    }
    const allLinksList = [...links, ...tinhoc3Links, ...tinhoc4Links, ...tinhoc5Links];
    const targetLink = allLinksList.find((l) => l.id === id);
    if (!targetLink) return;
    const nextState = !targetLink.isFavorite;
    handleAddToast(nextState ? 'Đã thêm vào danh sách yêu thích!' : 'Đã xóa khỏi danh sách yêu thích!', 'info');

    const updatedLink = {
      ...targetLink,
      isFavorite: nextState,
    };

    if (user && db) {
      await setDoc(doc(db, 'users', user.uid, 'links', id), {
        ...updatedLink,
        userId: user.uid,
      }).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/links/${id}`));
    } else {
      saveLinkToLocalStorage(updatedLink, false);
    }
  };

  const handleTogglePinned = async (id: string) => {
    if (role === 'viewer') {
      handleAddToast('Bạn đang ở chế độ Người xem, không thể thay đổi trạng thái ghim!', 'error');
      return;
    }
    const allLinksList = [...links, ...tinhoc3Links, ...tinhoc4Links, ...tinhoc5Links];
    const targetLink = allLinksList.find((l) => l.id === id);
    if (!targetLink) return;
    const nextState = !targetLink.isPinned;
    handleAddToast(nextState ? 'Đã ghim liên kết lên đầu!' : 'Đã bỏ ghim liên kết!', 'info');

    const updatedLink = {
      ...targetLink,
      isPinned: nextState,
    };

    if (user && db) {
      await setDoc(doc(db, 'users', user.uid, 'links', id), {
        ...updatedLink,
        userId: user.uid,
      }).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/links/${id}`));
    } else {
      saveLinkToLocalStorage(updatedLink, false);
    }
  };

  const handleIncrementViews = async (id: string) => {
    const allLinksList = [...links, ...tinhoc3Links, ...tinhoc4Links, ...tinhoc5Links];
    const targetLink = allLinksList.find((l) => l.id === id);
    if (!targetLink) return;
    const nextViews = (targetLink.viewsCount || 0) + 1;

    const updatedLink = {
      ...targetLink,
      viewsCount: nextViews,
    };

    if (user && db) {
      await setDoc(doc(db, 'users', user.uid, 'links', id), {
        ...updatedLink,
        userId: user.uid,
      }).catch((err) => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/links/${id}`));
    } else {
      saveLinkToLocalStorage(updatedLink, false);
    }
  };

  // Backup Import handlers
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (role === 'viewer') {
      handleAddToast('Bạn đang ở chế độ Người xem, không thể nhập dữ liệu sao lưu!', 'error');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = StorageService.importBackup(content);
      if (res.success) {
        setLinks(StorageService.getLinks());
        setCategories(StorageService.getCategories());
        setSettings(StorageService.getSettings());
        handleAddToast(res.message, 'success');
      } else {
        handleAddToast(res.message, 'error');
      }
    };
    reader.readAsText(file);
    // Clear input
    e.target.value = '';
  };

  // Backup Export handlers
  const handleExportJSON = () => {
    try {
      const dataStr = StorageService.exportBackup();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `link_manager_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      handleAddToast('Đã xuất file sao lưu JSON thành công!', 'success');
    } catch (e) {
      handleAddToast('Không thể xuất dữ liệu!', 'error');
    }
  };

  const handleExportCSV = () => {
    try {
      const csvStr = StorageService.exportToCSV();
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `link_manager_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      handleAddToast('Đã xuất file báo cáo CSV thành công!', 'success');
    } catch (e) {
      handleAddToast('Không thể xuất dữ liệu CSV!', 'error');
    }
  };

  // Filter, Search, Sort Logic
  const filteredLinks = useMemo(() => {
    let baseList: LinkItem[] = [];
    if (activeFilter === 'favorites' || activeFilter === 'pinned') {
      baseList = [...links, ...tinhoc3Links, ...tinhoc4Links, ...tinhoc5Links];
    } else if (activeCategoryId === 'cat-work') {
      if (activeSubCategoryId === 'tinhoc3') {
        baseList = tinhoc3Links;
      } else if (activeSubCategoryId === 'tinhoc4') {
        baseList = tinhoc4Links;
      } else if (activeSubCategoryId === 'tinhoc5') {
        baseList = tinhoc5Links;
      } else {
        baseList = [...links, ...tinhoc3Links, ...tinhoc4Links, ...tinhoc5Links];
      }
    } else {
      baseList = links;
    }

    let result = [...baseList];

    // 1. Filter out hidden links if the user is not an administrator
    if (role !== 'admin') {
      result = result.filter((l) => !l.isHidden);
    }

    // 2. Filter by quick sidebar navigation filters
    if (activeFilter === 'favorites') {
      result = result.filter((l) => l.isFavorite);
    } else if (activeFilter === 'pinned') {
      result = result.filter((l) => l.isPinned);
    }

    // 3. Filter by specific Category
    if (activeCategoryId && activeFilter !== 'favorites' && activeFilter !== 'pinned') {
      if (activeCategoryId === 'cat-work') {
        if (activeSubCategoryId) {
          result = result.filter((l) => l.subCategoryId === activeSubCategoryId);
        } else {
          result = result.filter(
            (l) =>
              l.categoryId === 'cat-work' ||
              l.subCategoryId === 'tinhoc3' ||
              l.subCategoryId === 'tinhoc4' ||
              l.subCategoryId === 'tinhoc5'
          );
        }
      } else {
        result = result.filter((l) => l.categoryId === activeCategoryId);
      }
    }

    // Search query matches
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      // Resolve category names for search integration
      const catMap = new Map<string, string>(categories.map((c) => [c.id, c.name.toLowerCase()]));

      result = result.filter((l) => {
        const catName = catMap.get(l.categoryId) || '';
        return (
          l.title.toLowerCase().includes(query) ||
          l.url.toLowerCase().includes(query) ||
          l.description.toLowerCase().includes(query) ||
          l.notes.toLowerCase().includes(query) ||
          catName.includes(query)
        );
      });
    }

    // Apply Sorting:
    // User requested sorting by: Category, Favorites, Date Created, Date Edited, A-Z, Z-A, Pinned.
    // We separate links into Pinned and Unpinned first, so pinned items stay on top except in specific queries.
    // However, if we do sorting, we can maintain Pinned items at the absolute top of the search grid!
    result.sort((a, b) => {
      // 1. If sorting by Views count, we sort primarily by views
      if (sortBy === 'viewsCount') {
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      }

      // 2. Otherwise, keep pinned items on top first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // 3. Then sort by chosen filter
      if (sortBy === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'updatedAt') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === 'titleAZ') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'titleZA') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

    return result;
  }, [links, tinhoc3Links, tinhoc4Links, tinhoc5Links, categories, activeFilter, activeCategoryId, activeSubCategoryId, searchQuery, sortBy]);

  // Pagination Logic
  const itemsPerPage = settings.itemsPerPage || 12;
  const totalPages = Math.max(Math.ceil(filteredLinks.length / itemsPerPage), 1);
  const paginatedLinks = useMemo(() => {
    // If the active filter is 'dashboard', pagination is not applied
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLinks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLinks, currentPage, itemsPerPage]);

  // Handle auto-reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategoryId, activeFilter, sortBy]);

  const activeCategory = useMemo(() => {
    return categories.find((c) => c.id === activeCategoryId);
  }, [categories, activeCategoryId]);

  return (
    <div
      className="flex h-screen bg-slate-100 dark:bg-[#0f172a] font-sans text-zinc-900 dark:text-slate-100 overflow-hidden relative transition-colors duration-500"
      style={{ '--primary-accent': settings.primaryColor } as React.CSSProperties}
      id="main-app-shell"
    >
      {/* Mesh Background Blobs for Glassmorphism */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/15 dark:bg-blue-600/10 rounded-full blur-[100px] md:blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-400/15 dark:bg-teal-500/10 rounded-full blur-[120px] md:blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-purple-400/10 dark:bg-purple-600/5 rounded-full blur-[80px] md:blur-[100px] pointer-events-none z-0"></div>

      {/* Hidden Import file input picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportJSON}
        accept=".json"
        className="hidden"
        id="hidden-json-file-input"
      />

      {/* Sidebar navigation */}
      <Sidebar
        role={role}
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={(id) => {
          setActiveCategoryId(id);
          setActiveFilter('all');
          setActiveSubCategoryId(null); // Reset subcategory when main category is changed
        }}
        activeSubCategoryId={activeSubCategoryId}
        onSelectSubCategory={setActiveSubCategoryId}
        activeFilter={activeFilter}
        onChangeFilter={(filter) => {
          setActiveFilter(filter);
          setActiveCategoryId(null);
          setActiveSubCategoryId(null); // Reset subcategory when filter changes
        }}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        onTriggerImport={triggerFileInput}
        onTriggerExportJSON={handleExportJSON}
        onTriggerExportCSV={handleExportCSV}
        linksCountByCategory={linksCountByCategory}
        totalLinksCount={links.length}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10" id="workspace-frame">
        {/* Top Header Controls row */}
        <header className="h-16 glass-header px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 overflow-hidden flex-1 max-w-md">
            {/* Realtime Search Input Bar */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo tiêu đề, URL, mô tả hoặc danh mục..."
                className="w-full pl-9 pr-4 h-10 text-sm glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)]/20 placeholder-zinc-450 dark:placeholder-zinc-500 transition-all"
                id="search-input-header"
              />
            </div>
          </div>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-3">
            {/* Role Switcher */}
            <div className="flex bg-zinc-200/60 dark:bg-zinc-900/60 p-1 rounded-xl border border-zinc-200/30 dark:border-zinc-800/30 backdrop-blur-sm shadow-sm shrink-0">
              <button
                onClick={() => handleToggleRole('admin')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
                title="Quyền Quản trị viên (Toàn quyền Sửa, Xóa, Ghim, Thêm mới)"
                id="header-role-admin-btn"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quản trị</span>
              </button>
              <button
                onClick={() => handleToggleRole('viewer')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  role === 'viewer'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
                title="Quyền Người xem (Chỉ xem và tra cứu)"
                id="header-role-viewer-btn"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Người xem</span>
              </button>
            </div>

            {role === 'admin' && (
              <button
                onClick={() => {
                  setEditingLink(null);
                  setIsAddEditOpen(true);
                }}
                style={{ backgroundColor: settings.primaryColor, boxShadow: `0 4px 12px ${settings.primaryColor}30` }}
                className="flex items-center gap-1.5 px-4 h-10 text-white rounded-xl text-xs font-semibold hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shrink-0"
                id="btn-add-link-header"
              >
                <Plus className="w-4 h-4" />
                Thêm liên kết
              </button>
            )}
          </div>
        </header>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" id="scrollable-content-area">
          {activeFilter === 'dashboard' ? (
            /* Statistical View Dashboard panel */
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50" id="dashboard-title">
                    Báo cáo & Phân tích
                  </h1>
                  <p className="text-xs text-zinc-500">
                    Tổng quan trực quan về kho lưu trữ liên kết của bạn
                  </p>
                </div>
              </div>
              <Dashboard
                links={links}
                categories={categories}
                onOpenLink={(link) => handleIncrementViews(link.id)}
              />
            </div>
          ) : (
            /* Links Directory Workspace view */
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Majestic Slogan Banner with AI design ("Kết nối tri thức - Chạm tới tương lai") */}
              <div 
                className="relative rounded-3xl overflow-hidden shadow-lg border border-white/10 dark:border-white/5 bg-gradient-to-br from-indigo-950 via-slate-900 to-zinc-950 text-white min-h-[180px] p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all"
                id="slogan-banner"
              >
                {/* AI / Futuristic Neural Network Background */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  <img 
                    src={BANNER_AI_IMAGE} 
                    alt="AI Cyber Network Background" 
                    className="w-full h-full object-cover opacity-50 dark:opacity-40 select-none pointer-events-none scale-105" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900/80 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
                  {/* Subtle dynamic background light */}
                  <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
                  <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
                </div>
                
                {/* Left: Content */}
                <div className="relative z-10 max-w-2xl">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-300 bg-clip-text text-transparent drop-shadow-md font-sans py-2">
                    Kết nối tri thức - Chạm tới tương lai
                  </h1>
                </div>


              </div>

              {/* Context bar / breadcrumbs & filters (Hidden when viewing the subfolders overview) */}
              {!(activeCategoryId === 'cat-tech' && !activeSubCategoryId) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3">
                    {activeCategoryId === 'cat-tech' && activeSubCategoryId && (
                      <button
                        onClick={() => setActiveSubCategoryId(null)}
                        className="flex items-center gap-1.5 px-3 h-8 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 rounded-xl transition-all border border-indigo-150/30 dark:border-indigo-900/40 cursor-pointer shadow-sm shrink-0"
                      >
                        ← Thư mục Tin học
                      </button>
                    )}
                    <div>
                      <h1 className="text-sm font-bold text-zinc-850 dark:text-zinc-100 flex items-center gap-2" id="links-directory-title">
                        {activeFilter === 'all' && !activeCategoryId && 'Tất cả liên kết'}
                        {activeFilter === 'favorites' && '⭐ Liên kết yêu thích'}
                        {activeFilter === 'pinned' && '📌 Liên kết đã ghim'}
                        {activeFilter === 'all' && activeCategoryId && (
                          <span className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: activeCategory?.color }}
                            />
                            Danh mục: {activeCategory?.name}
                            {activeCategoryId === 'cat-tech' && activeSubCategoryId && (
                              <span className="flex items-center gap-1.5 font-extrabold text-indigo-600 dark:text-indigo-450 text-sm">
                                <span className="text-zinc-300 font-medium">/</span>
                                <span>
                                  {activeSubCategoryId === 'tinhoc3' && '📘 Tin học 3'}
                                  {activeSubCategoryId === 'tinhoc4' && '📗 Tin học 4'}
                                  {activeSubCategoryId === 'tinhoc5' && '📙 Tin học 5'}
                                </span>
                              </span>
                            )}
                          </span>
                        )}
                      </h1>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Hiển thị {filteredLinks.length} liên kết phù hợp
                      </p>
                    </div>
                  </div>

                  {/* Grid filter tools */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Sorting dropdown selector */}
                    <div className="flex items-center gap-1.5 bg-white/20 dark:bg-black/20 px-2.5 py-1.5 rounded-xl border border-white/10 dark:border-white/5">
                      <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="text-xs font-semibold bg-transparent text-zinc-650 dark:text-zinc-350 focus:outline-none cursor-pointer"
                        id="sort-select-dropdown"
                      >
                        <option value="createdAt" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-slate-100">Mới lưu trữ</option>
                        <option value="updatedAt" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-slate-100">Mới chỉnh sửa</option>
                        <option value="titleAZ" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-slate-100">Tiêu đề (A → Z)</option>
                        <option value="titleZA" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-slate-100">Tiêu đề (Z → A)</option>
                        <option value="viewsCount" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-slate-100">Xem nhiều nhất</option>
                      </select>
                    </div>

                    {/* Quick layout toggle buttons */}
                    <div className="flex items-center border border-white/10 dark:border-white/5 rounded-xl p-0.5 bg-white/20 dark:bg-black/20">
                      <button
                        onClick={() => handleUpdateSettings({ ...settings, layout: 'grid' })}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          settings.layout === 'grid'
                            ? 'bg-white/40 dark:bg-white/10 text-[var(--primary-accent)] shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-350'
                        }`}
                        title="Hiển thị dạng lưới"
                        id="btn-layout-grid-toggle"
                      >
                        <Grid className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleUpdateSettings({ ...settings, layout: 'list' })}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          settings.layout === 'list'
                            ? 'bg-white/40 dark:bg-white/10 text-[var(--primary-accent)] shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-350'
                        }`}
                        title="Hiển thị dạng danh sách"
                        id="btn-layout-list-toggle"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Links Grid rendering */}
              {activeCategoryId === 'cat-work' && !activeSubCategoryId ? (
                <SubFolderView
                  links={[...links, ...tinhoc3Links, ...tinhoc4Links, ...tinhoc5Links]}
                  role={role}
                  onSelectSubCategory={setActiveSubCategoryId}
                />
              ) : filteredLinks.length === 0 ? (
                /* Empty state screen placeholder */
                <div className="flex flex-col items-center justify-center text-center py-20 px-4 bg-white dark:bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-350 dark:text-zinc-750">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                      Không tìm thấy liên kết nào
                    </h3>
                    <p className="text-xs text-zinc-450 dark:text-zinc-500 mt-1 max-w-sm">
                      Thử thay đổi từ khóa tìm kiếm hoặc bấm nút "Thêm liên kết" để tạo mới tài nguyên lưu trữ đầu tiên của bạn!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingLink(null);
                      setIsAddEditOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 h-9 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow transition-all cursor-pointer"
                    id="empty-state-add-link-btn"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm liên kết mới
                  </button>
                </div>
              ) : (
                /* Active Links display and listing container */
                <div
                  className={
                    settings.layout === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
                      : 'flex flex-col gap-3'
                  }
                  id="links-items-container"
                >
                  <AnimatePresence mode="popLayout">
                    {paginatedLinks.map((link) => (
                      <LinkCard
                        key={link.id}
                        role={role}
                        link={link}
                        category={categories.find((c) => c.id === link.categoryId)}
                        onEdit={(l) => {
                          setEditingLink(l);
                          setIsAddEditOpen(true);
                        }}
                        onDelete={handleDeleteRequest}
                        onToggleFavorite={handleToggleFavorite}
                        onTogglePinned={handleTogglePinned}
                        onIncrementViews={handleIncrementViews}
                        onAddToast={handleAddToast}
                        layout={settings.layout}
                        animationsEnabled={settings.animationsEnabled}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Pagination controls footer widget */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2.5 pt-4" id="pagination-controls-box">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-650 dark:text-zinc-350 bg-white dark:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 transition-colors cursor-pointer"
                    id="btn-pagination-prev"
                  >
                    Trước
                  </button>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-550 dark:text-zinc-400">
                    <span className="bg-blue-600 text-white px-2.5 py-1 rounded-lg">
                      {currentPage}
                    </span>
                    <span>/</span>
                    <span>{totalPages}</span>
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3.5 h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-650 dark:text-zinc-350 bg-white dark:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 transition-colors cursor-pointer"
                    id="btn-pagination-next"
                  >
                    Sau
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* --- Overlay Modals & Dialogs --- */}

      {/* 1. Add/Edit Link Modal */}
      <AddEditModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingLink(null);
        }}
        onSave={handleSaveLink}
        categories={categories}
        editingLink={editingLink}
        onAddToast={handleAddToast}
        links={[...links, ...tinhoc3Links, ...tinhoc4Links, ...tinhoc5Links]}
        defaultCategoryId={activeCategoryId || 'cat-work'}
        defaultSubCategoryId={activeSubCategoryId}
      />

      {/* 2. Manage Categories Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        role={role}
        categories={categories}
        onSaveCategories={handleSaveCategories}
        onAddToast={handleAddToast}
        linksCountByCategory={linksCountByCategory}
      />

      {/* 3. Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setDeletingLink(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={deletingLink?.title || ''}
      />

      {/* 4. Admin PIN Verification Modal */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onConfirm={handleAdminPinConfirm}
        onAddToast={handleAddToast}
      />

      {/* Global animated Toast notices */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
