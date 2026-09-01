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
  Camera,
} from 'lucide-react';

import { LinkItem, Category, Settings, ToastMessage, BannerConfig, DEFAULT_BANNER_CONFIG } from './types';
import { 
  StorageService, 
  isValidUrl, 
  normalizeVietnamese, 
  normalizeLinkItem, 
  cleanFirestoreData,
  canonicalCategoryId,
  resolveLinkCategoryId,
  ensureAllDefaultCategories,
} from './storage';
import { Sidebar } from './components/Sidebar';
import { LinkCard } from './components/LinkCard';
import { AddEditModal } from './components/AddEditModal';
import { CategoryModal } from './components/CategoryModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { AdminPinModal } from './components/AdminPinModal';
import { AvatarModal } from './components/AvatarModal';
import { BannerModal } from './components/BannerModal';
import { Dashboard } from './components/Dashboard';
import { RecentMaterialsView } from './components/RecentMaterialsView';
import { SubFolderView } from './components/SubFolderView';
import { LearningPortal } from './components/LearningPortal';
import { GradeLibraryView } from './components/GradeLibraryView';
import { FileViewerModal } from './components/FileViewerModal';
import { Toast } from './components/Toast';

import { 
  auth, 
  db, 
  isConfigured, 
  loginWithGoogle, 
  logout, 
  handleFirestoreError, 
  OperationType,
  deleteFileFromFirebaseStorage,
} from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';

export default function App() {
  // Load initial configurations from StorageService (Unified Single Source of Truth)
  const [links, setLinks] = useState<LinkItem[]>(() => StorageService.getLinks());
  const [categories, setCategories] = useState<Category[]>(() => StorageService.getCategories());
  const [settings, setSettings] = useState<Settings>(() => StorageService.getSettings());

  // Subcategory lists derived directly from unified links
  const tinhoc3Links = useMemo(() => links.filter((l) => l.subCategoryId === 'tinhoc3'), [links]);
  const tinhoc4Links = useMemo(() => links.filter((l) => l.subCategoryId === 'tinhoc4'), [links]);
  const tinhoc5Links = useMemo(() => links.filter((l) => l.subCategoryId === 'tinhoc5'), [links]);

  // User role state: 'admin' | 'viewer'
  const [role, setRole] = useState<'admin' | 'viewer'>(() => {
    return (localStorage.getItem('user_role') as 'admin' | 'viewer') || 'viewer';
  });

  // Teacher Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => StorageService.getAvatar());
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const handleOpenAvatarModal = () => {
    if (role !== 'admin') {
      handleAddToast('Chỉ tài khoản Quản trị mới có quyền thay đổi ảnh đại diện!', 'error');
      return;
    }
    setIsAvatarModalOpen(true);
  };

  const handleSaveAvatar = (newAvatarDataUrl: string) => {
    if (role !== 'admin') {
      handleAddToast('Từ chối thao tác! Bạn không có quyền Quản trị.', 'error');
      return;
    }
    StorageService.saveAvatar(newAvatarDataUrl);
    setAvatarUrl(newAvatarDataUrl);
  };

  const handleDeleteAvatar = () => {
    if (role !== 'admin') {
      handleAddToast('Từ chối thao tác! Bạn không có quyền Quản trị.', 'error');
      return;
    }
    StorageService.deleteAvatar();
    setAvatarUrl(null);
  };

  // Banner Background state & Position Configuration (Shared between Admin & Viewer)
  const [bannerBgUrl, setBannerBgUrl] = useState<string | null>(() => StorageService.getBanner() || settings.bannerBgUrl || null);
  const [bannerConfig, setBannerConfig] = useState<BannerConfig>(() => StorageService.getBannerConfig());
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  // 1. Realtime Shared App & Banner Configuration listener (runs for BOTH Admin & Viewer)
  useEffect(() => {
    if (!isConfigured || !db) return;

    const bannerDocRef = doc(db, 'app_config', 'banner');
    const unsubSharedBanner = onSnapshot(
      bannerDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const cloudConfig: BannerConfig = {
            posX: typeof data.posX === 'number' ? data.posX : 50,
            posY: typeof data.posY === 'number' ? data.posY : 50,
            scale: typeof data.scale === 'number' ? data.scale : 100,
            marginTop: typeof data.marginTop === 'number' ? data.marginTop : 0,
            marginBottom: typeof data.marginBottom === 'number' ? data.marginBottom : 24,
            bgUrl: data.bgUrl !== undefined ? data.bgUrl : null,
          };
          const cloudBgUrl = data.bgUrl || null;

          setBannerConfig(cloudConfig);
          setBannerBgUrl(cloudBgUrl);

          // Update local cache so offline/subsequent reloads are instantaneous
          StorageService.saveBannerConfig(cloudConfig);
          if (cloudBgUrl) {
            StorageService.saveBanner(cloudBgUrl);
          } else {
            StorageService.deleteBanner();
          }
        }
      },
      (error) => {
        console.warn('Could not sync shared banner config from Firestore:', error);
      }
    );

    return () => unsubSharedBanner();
  }, []);

  const handleOpenBannerModal = () => {
    if (role !== 'admin') {
      handleAddToast('Chỉ tài khoản Quản trị mới có quyền quản lý và điều chỉnh Banner!', 'error');
      return;
    }
    setIsBannerModalOpen(true);
  };

  const handleSaveBannerConfig = async (newConfig: BannerConfig, newImageDataUrl?: string | null) => {
    if (role !== 'admin') {
      handleAddToast('Từ chối thao tác! Bạn không có quyền Quản trị.', 'error');
      return;
    }

    const finalUrl = newImageDataUrl !== undefined ? newImageDataUrl : (newConfig.bgUrl ?? bannerBgUrl);
    const updatedConfig: BannerConfig = {
      ...newConfig,
      bgUrl: finalUrl,
    };

    try {
      // 1. Write to Shared Firestore Document first (shared across all devices & viewers)
      if (isConfigured && db) {
        const bannerDocRef = doc(db, 'app_config', 'banner');
        await setDoc(bannerDocRef, {
          posX: updatedConfig.posX ?? 50,
          posY: updatedConfig.posY ?? 50,
          scale: updatedConfig.scale ?? 100,
          marginTop: updatedConfig.marginTop ?? 0,
          marginBottom: updatedConfig.marginBottom ?? 24,
          bgUrl: finalUrl || null,
          updatedAt: new Date().toISOString(),
        });
      }

      // 2. Persist locally to storage cache
      StorageService.saveBannerConfig(updatedConfig);
      if (finalUrl) {
        StorageService.saveBanner(finalUrl);
      } else {
        StorageService.deleteBanner();
      }

      // 3. Update local React state
      setBannerBgUrl(finalUrl);
      setBannerConfig(updatedConfig);

      const updatedSettings: Settings = {
        ...settings,
        bannerBgUrl: finalUrl,
        bannerConfig: updatedConfig,
      };
      setSettings(updatedSettings);
      StorageService.saveSettings(updatedSettings);

      if (user && db) {
        await setDoc(doc(db, 'users', user.uid), updatedSettings).catch(() => {});
      }

      // 4. Notify success ONLY after real write succeeds
      handleAddToast('Đã lưu vị trí Banner thành công.', 'success');
    } catch (error) {
      console.error('Lỗi khi lưu cấu hình Banner:', error);
      handleAddToast('Không thể lưu vị trí Banner. Vui lòng thử lại.', 'error');
      throw error;
    }
  };

  const handleDeleteBanner = async () => {
    if (role !== 'admin') {
      handleAddToast('Từ chối thao tác! Bạn không có quyền Quản trị.', 'error');
      return;
    }
    try {
      const resetConfig: BannerConfig = { ...bannerConfig, bgUrl: null };

      if (isConfigured && db) {
        const bannerDocRef = doc(db, 'app_config', 'banner');
        await setDoc(bannerDocRef, {
          posX: resetConfig.posX ?? 50,
          posY: resetConfig.posY ?? 50,
          scale: resetConfig.scale ?? 100,
          marginTop: resetConfig.marginTop ?? 0,
          marginBottom: resetConfig.marginBottom ?? 24,
          bgUrl: null,
          updatedAt: new Date().toISOString(),
        });
      }

      StorageService.deleteBanner();
      StorageService.saveBannerConfig(resetConfig);
      setBannerBgUrl(null);
      setBannerConfig(resetConfig);

      const updatedSettings = { ...settings, bannerBgUrl: null, bannerConfig: resetConfig };
      setSettings(updatedSettings);
      StorageService.saveSettings(updatedSettings);

      if (user && db) {
        await setDoc(doc(db, 'users', user.uid), updatedSettings).catch(() => {});
      }

      handleAddToast('Đã xóa ảnh Banner tùy chỉnh và khôi phục Banner mặc định.', 'success');
    } catch (error) {
      console.error('Lỗi khi xóa Banner:', error);
      handleAddToast('Không thể xóa ảnh Banner. Vui lòng thử lại.', 'error');
      throw error;
    }
  };

  const handleRestoreDefaultBanner = async () => {
    if (role !== 'admin') {
      handleAddToast('Từ chối thao tác! Bạn không có quyền Quản trị.', 'error');
      return;
    }
    try {
      if (isConfigured && db) {
        const bannerDocRef = doc(db, 'app_config', 'banner');
        await setDoc(bannerDocRef, {
          posX: DEFAULT_BANNER_CONFIG.posX,
          posY: DEFAULT_BANNER_CONFIG.posY,
          scale: DEFAULT_BANNER_CONFIG.scale,
          marginTop: DEFAULT_BANNER_CONFIG.marginTop ?? 0,
          marginBottom: DEFAULT_BANNER_CONFIG.marginBottom ?? 24,
          bgUrl: null,
          updatedAt: new Date().toISOString(),
        });
      }

      StorageService.deleteBanner();
      StorageService.deleteBannerConfig();
      setBannerBgUrl(null);
      setBannerConfig(DEFAULT_BANNER_CONFIG);

      const updatedSettings: Settings = {
        ...settings,
        bannerBgUrl: null,
        bannerConfig: DEFAULT_BANNER_CONFIG,
      };
      setSettings(updatedSettings);
      StorageService.saveSettings(updatedSettings);

      if (user && db) {
        await setDoc(doc(db, 'users', user.uid), updatedSettings).catch(() => {});
      }

      handleAddToast('Đã khôi phục toàn bộ Banner và vị trí về mặc định.', 'success');
    } catch (error) {
      console.error('Lỗi khi khôi phục Banner:', error);
      handleAddToast('Không thể khôi phục Banner mặc định. Vui lòng thử lại.', 'error');
      throw error;
    }
  };

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
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'pinned' | 'dashboard' | 'recent'>('all');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<'tinhoc3' | 'tinhoc4' | 'tinhoc5' | null>(null);
  const [activeGradeLibrary, setActiveGradeLibrary] = useState<'tinhoc3' | 'tinhoc4' | 'tinhoc5' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'titleAZ' | 'titleZA' | 'viewsCount'>('createdAt');
  const [currentPage, setCurrentPage] = useState(1);

  // Grade Library Navigation handlers
  const handleOpenGradeLibrary = (grade: 'tinhoc3' | 'tinhoc4' | 'tinhoc5') => {
    setActiveGradeLibrary(grade);
    setActiveCategoryId('cat-work');
    setActiveSubCategoryId(grade);
    setActiveFilter('all');
    const gradeSlug = grade === 'tinhoc3' ? 'tin-hoc-3' : grade === 'tinhoc4' ? 'tin-hoc-4' : 'tin-hoc-5';
    window.location.hash = `#/${gradeSlug}`;
    const scrollArea = document.getElementById('scrollable-content-area');
    if (scrollArea) scrollArea.scrollTop = 0;
  };

  const handleBackToPortal = () => {
    setActiveGradeLibrary(null);
    setActiveCategoryId(null);
    setActiveSubCategoryId(null);
    setActiveFilter('all');
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    const scrollArea = document.getElementById('scrollable-content-area');
    if (scrollArea) scrollArea.scrollTop = 0;
  };

  // Sync hash changes with navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#/new-materials' || hash === '#new-materials' || hash === '#/hoc-lieu-moi' || hash === '#hoc-lieu-moi') {
        setActiveFilter('recent');
        setActiveGradeLibrary(null);
        setActiveCategoryId(null);
        setActiveSubCategoryId(null);
      } else if (hash === '#/dashboard' || hash === '#dashboard' || hash === '#/bang-thong-ke' || hash === '#bang-thong-ke') {
        setActiveFilter('dashboard');
        setActiveGradeLibrary(null);
        setActiveCategoryId(null);
        setActiveSubCategoryId(null);
      } else if (hash === '#/tin-hoc-3' || hash === '#tin-hoc-3' || hash === '#tinhoc3') {
        setActiveGradeLibrary('tinhoc3');
        setActiveCategoryId('cat-work');
        setActiveSubCategoryId('tinhoc3');
        setActiveFilter('all');
      } else if (hash === '#/tin-hoc-4' || hash === '#tin-hoc-4' || hash === '#tinhoc4') {
        setActiveGradeLibrary('tinhoc4');
        setActiveCategoryId('cat-work');
        setActiveSubCategoryId('tinhoc4');
        setActiveFilter('all');
      } else if (hash === '#/tin-hoc-5' || hash === '#tin-hoc-5' || hash === '#tinhoc5') {
        setActiveGradeLibrary('tinhoc5');
        setActiveCategoryId('cat-work');
        setActiveSubCategoryId('tinhoc5');
        setActiveFilter('all');
      } else if (hash === '' || hash === '#/' || hash === '#' || hash === '#/home' || hash === '#home' || hash === '#/trang-chu' || hash === '#trang-chu') {
        setActiveGradeLibrary(null);
        setActiveCategoryId(null);
        setActiveSubCategoryId(null);
        setActiveFilter('all');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Modal open states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  const [viewingFileLink, setViewingFileLink] = useState<LinkItem | null>(null);

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
    if (!isConfigured || !db) return;

    // 1. Shared Global Links subscription (available to both Admins and Viewers)
    const linksColRef = collection(db, 'links');
    const unsubSharedLinks = onSnapshot(
      linksColRef,
      async (snap) => {
        if (!snap.empty) {
          const linksList: LinkItem[] = [];
          snap.forEach((docSnap) => {
            const item = docSnap.data() as Partial<LinkItem>;
            linksList.push(normalizeLinkItem({ ...item, id: docSnap.id }));
          });
          // Sort by creation date descending by default
          linksList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setLinks(linksList);
          StorageService.saveLinks(linksList);
        } else {
          // Initialize remote Firestore with current local links if Firestore is empty
          const currentLinks = StorageService.getLinks();
          if (currentLinks.length > 0) {
            for (const link of currentLinks) {
              const cleanData = cleanFirestoreData({
                ...normalizeLinkItem(link),
                userId: user?.uid || 'admin',
              });
              await setDoc(doc(db, 'links', link.id), cleanData).catch((err) => {
                console.warn('Initial link seed to Firestore warning:', err);
              });
            }
          }
        }
      },
      (error) => {
        console.warn('Firestore links listener warning:', error);
      }
    );

    // 2. Shared Global Categories subscription
    const catsColRef = collection(db, 'categories');
    const unsubSharedCategories = onSnapshot(
      catsColRef,
      async (snap) => {
        const catsList: Category[] = [];
        if (!snap.empty) {
          snap.forEach((docSnap) => {
            const item = docSnap.data() as Category;
            const canonicalId = canonicalCategoryId(item.id || docSnap.id);
            catsList.push({
              id: canonicalId,
              name: item.name || '',
              color: item.color || '#3B82F6',
              icon: item.icon || undefined,
            });
          });
        }
        
        // Ensure all 7 core categories are present while preserving any custom ones
        const fullCatsList = ensureAllDefaultCategories(catsList);
        setCategories(fullCatsList);
        StorageService.saveCategories(fullCatsList);

        // If Firestore had fewer categories or was empty, persist the full set
        if (snap.empty || fullCatsList.length > catsList.length) {
          for (const cat of fullCatsList) {
            const cleanData = cleanFirestoreData({
              id: cat.id,
              name: cat.name,
              color: cat.color,
              icon: cat.icon || '',
              userId: user?.uid || 'admin',
            });
            await setDoc(doc(db, 'categories', cat.id), cleanData).catch((err) => {
              console.warn('Initial category seed to Firestore warning:', err);
            });
          }
        }
      },
      (error) => {
        console.warn('Firestore categories listener warning:', error);
      }
    );

    // 3. User settings subscription (when signed in with Google)
    let unsubUserSettings = () => {};
    if (user) {
      const settingsDocRef = doc(db, 'users', user.uid);
      unsubUserSettings = onSnapshot(settingsDocRef, (snap) => {
        if (snap.exists()) {
          setSettings((prev) => ({ ...prev, ...(snap.data() as Settings) }));
        }
      }, (err) => {
        console.warn('User settings listener warning:', err);
      });
    }

    return () => {
      unsubSharedLinks();
      unsubSharedCategories();
      unsubUserSettings();
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
    StorageService.saveSettings(newSettings);
    if (user && db) {
      await setDoc(doc(db, 'users', user.uid), cleanFirestoreData(newSettings)).catch((err) => {
        console.error('Lỗi khi lưu cài đặt người dùng:', err);
      });
    }
  };

  // Categories mutators
  const handleSaveCategories = async (updatedCats: Category[]) => {
    if (role === 'viewer') {
      handleAddToast('Bạn đang ở chế độ Người xem, không thể thay đổi danh mục!', 'error');
      return;
    }
    setCategories(updatedCats);
    StorageService.saveCategories(updatedCats);

    if (isConfigured && db) {
      try {
        const categoriesColRef = collection(db, 'categories');
        const currentIds = new Set(updatedCats.map((c) => c.id));
        const previousCats = categories;

        // Delete removed categories
        for (const prev of previousCats) {
          if (!currentIds.has(prev.id)) {
            await deleteDoc(doc(categoriesColRef, prev.id)).catch(() => {});
            if (user) {
              await deleteDoc(doc(db, 'users', user.uid, 'categories', prev.id)).catch(() => {});
            }
          }
        }

        // Save all updated categories
        for (const cat of updatedCats) {
          const cleanCat = cleanFirestoreData({
            id: cat.id,
            name: cat.name,
            color: cat.color,
            icon: cat.icon || '',
            userId: user?.uid || 'admin',
          });
          await setDoc(doc(categoriesColRef, cat.id), cleanCat);
          if (user) {
            await setDoc(doc(db, 'users', user.uid, 'categories', cat.id), cleanCat).catch(() => {});
          }
        }
      } catch (err) {
        console.error('Lỗi khi lưu danh mục vào Firestore:', err);
      }
    }
  };

  // Unified Subfolder counts derived directly from links
  const tinhoc3Count = useMemo(
    () => links.filter((l) => l.subCategoryId === 'tinhoc3' && (role === 'admin' || !l.isHidden)).length,
    [links, role]
  );
  const tinhoc4Count = useMemo(
    () => links.filter((l) => l.subCategoryId === 'tinhoc4' && (role === 'admin' || !l.isHidden)).length,
    [links, role]
  );
  const tinhoc5Count = useMemo(
    () => links.filter((l) => l.subCategoryId === 'tinhoc5' && (role === 'admin' || !l.isHidden)).length,
    [links, role]
  );

  // Total count of all links
  const totalLinksCount = useMemo(
    () => links.filter((l) => role === 'admin' || !l.isHidden).length,
    [links, role]
  );

  // Links count in each category
  const linksCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((cat) => {
      counts[cat.id] = 0;
    });

    links.forEach((l) => {
      if (role === 'admin' || !l.isHidden) {
        const catId = resolveLinkCategoryId(l);
        counts[catId] = (counts[catId] || 0) + 1;
      }
    });
    return counts;
  }, [links, categories, role]);

  // Links mutators
  const handleSaveLink = async (payload: Partial<LinkItem>) => {
    if (role === 'viewer') {
      handleAddToast('Bạn đang ở chế độ Người xem, không thể thêm hoặc sửa liên kết!', 'error');
      return;
    }

    const cleanTitle = payload.title?.trim();
    const cleanUrl = payload.url?.trim();
    const categoryId = payload.categoryId?.trim() || 'cat-work';

    if (!cleanTitle) {
      handleAddToast('Vui lòng nhập tiêu đề cho liên kết!', 'error');
      return;
    }
    if (!cleanUrl) {
      handleAddToast('Vui lòng nhập đường dẫn URL!', 'error');
      return;
    }
    if (!isValidUrl(cleanUrl)) {
      handleAddToast('Đường dẫn URL không hợp lệ! Vui lòng kiểm tra lại.', 'error');
      return;
    }

    try {
      if (editingLink) {
        // Edit mode
        const updatedLink = normalizeLinkItem({
          ...editingLink,
          ...payload,
          id: editingLink.id,
          title: cleanTitle,
          url: cleanUrl,
          categoryId,
          updatedAt: new Date().toISOString(),
        });

        // 1. Write to shared Firestore database
        if (isConfigured && db) {
          const cleanDocData = cleanFirestoreData({
            ...updatedLink,
            userId: user?.uid || 'admin',
          });
          await setDoc(doc(db, 'links', editingLink.id), cleanDocData);
          if (user) {
            await setDoc(doc(db, 'users', user.uid, 'links', editingLink.id), cleanDocData).catch(() => {});
          }
        }

        // 2. Update local state and cache immediately
        const updatedLinks = links.map((l) => (l.id === editingLink.id ? updatedLink : l));
        setLinks(updatedLinks);
        StorageService.saveLinks(updatedLinks);

        handleAddToast('Đã lưu học liệu thành công.', 'success');
      } else {
        // Create mode
        const newLinkId = `link-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newLink = normalizeLinkItem({
          ...payload,
          id: newLinkId,
          title: cleanTitle,
          url: cleanUrl,
          categoryId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // 1. Write to shared Firestore database
        if (isConfigured && db) {
          const cleanDocData = cleanFirestoreData({
            ...newLink,
            userId: user?.uid || 'admin',
          });
          await setDoc(doc(db, 'links', newLinkId), cleanDocData);
          if (user) {
            await setDoc(doc(db, 'users', user.uid, 'links', newLinkId), cleanDocData).catch(() => {});
          }
        }

        // 2. Update local state and cache immediately
        const updatedLinks = [newLink, ...links];
        setLinks(updatedLinks);
        StorageService.saveLinks(updatedLinks);

        handleAddToast('Đã lưu học liệu thành công.', 'success');
      }

      setEditingLink(null);
    } catch (error) {
      console.error('Lỗi khi lưu học liệu vào database:', error);
      handleAddToast('Không thể lưu học liệu. Vui lòng thử lại.', 'error');
    }
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
      try {
        if (isConfigured && db) {
          await deleteDoc(doc(db, 'links', deletingLink.id));
          if (user) {
            await deleteDoc(doc(db, 'users', user.uid, 'links', deletingLink.id)).catch(() => {});
          }
        }

        // Clean up uploaded file in Firebase Storage if path exists
        if (deletingLink.storagePath) {
          await deleteFileFromFirebaseStorage(deletingLink.storagePath).catch((err) => {
            console.warn('Xóa file từ Firebase Storage cảnh báo:', err);
          });
        }

        const updatedLinks = links.filter((l) => l.id !== deletingLink.id);
        setLinks(updatedLinks);
        StorageService.saveLinks(updatedLinks);

        handleAddToast('Đã xóa học liệu thành công.', 'success');
      } catch (error) {
        console.error('Lỗi khi xóa học liệu khỏi database:', error);
        handleAddToast('Không thể xóa học liệu. Vui lòng thử lại.', 'error');
      }
    }
    setIsDeleteConfirmOpen(false);
    setDeletingLink(null);
  };

  const handleToggleFavorite = async (id: string) => {
    if (role === 'viewer') {
      handleAddToast('Bạn đang ở chế độ Người xem, không thể thay đổi trạng thái yêu thích!', 'error');
      return;
    }
    const targetLink = links.find((l) => l.id === id);
    if (!targetLink) return;
    const nextState = !targetLink.isFavorite;

    const updatedLink = normalizeLinkItem({
      ...targetLink,
      isFavorite: nextState,
      updatedAt: new Date().toISOString(),
    });

    const updatedLinks = links.map((l) => (l.id === id ? updatedLink : l));
    setLinks(updatedLinks);
    StorageService.saveLinks(updatedLinks);

    handleAddToast(nextState ? 'Đã thêm vào danh sách yêu thích!' : 'Đã xóa khỏi danh sách yêu thích!', 'info');

    if (isConfigured && db) {
      const cleanDocData = cleanFirestoreData({
        ...updatedLink,
        userId: user?.uid || 'admin',
      });
      await setDoc(doc(db, 'links', id), cleanDocData).catch((err) => {
        console.error('Lỗi khi cập nhật trạng thái yêu thích:', err);
      });
      if (user) {
        await setDoc(doc(db, 'users', user.uid, 'links', id), cleanDocData).catch(() => {});
      }
    }
  };

  const handleTogglePinned = async (id: string) => {
    if (role === 'viewer') {
      handleAddToast('Bạn đang ở chế độ Người xem, không thể thay đổi trạng thái ghim!', 'error');
      return;
    }
    const targetLink = links.find((l) => l.id === id);
    if (!targetLink) return;
    const nextState = !targetLink.isPinned;

    const updatedLink = normalizeLinkItem({
      ...targetLink,
      isPinned: nextState,
      updatedAt: new Date().toISOString(),
    });

    const updatedLinks = links.map((l) => (l.id === id ? updatedLink : l));
    setLinks(updatedLinks);
    StorageService.saveLinks(updatedLinks);

    handleAddToast(nextState ? 'Đã ghim liên kết lên đầu!' : 'Đã bỏ ghim liên kết!', 'info');

    if (isConfigured && db) {
      const cleanDocData = cleanFirestoreData({
        ...updatedLink,
        userId: user?.uid || 'admin',
      });
      await setDoc(doc(db, 'links', id), cleanDocData).catch((err) => {
        console.error('Lỗi khi cập nhật trạng thái ghim:', err);
      });
      if (user) {
        await setDoc(doc(db, 'users', user.uid, 'links', id), cleanDocData).catch(() => {});
      }
    }
  };

  const handleIncrementViews = async (id: string) => {
    const targetLink = links.find((l) => l.id === id);
    if (!targetLink) return;
    const nextViews = (targetLink.viewsCount || 0) + 1;

    const updatedLink = normalizeLinkItem({
      ...targetLink,
      viewsCount: nextViews,
    });

    const updatedLinks = links.map((l) => (l.id === id ? updatedLink : l));
    setLinks(updatedLinks);
    StorageService.saveLinks(updatedLinks);

    if (isConfigured && db) {
      const cleanDocData = cleanFirestoreData({
        ...updatedLink,
        userId: user?.uid || 'admin',
      });
      await setDoc(doc(db, 'links', id), cleanDocData).catch((err) => {
        console.warn('Lỗi khi tăng lượt xem:', err);
      });
    }
  };

  const handleOpenLink = (link: LinkItem) => {
    // Increment views
    handleIncrementViews(link.id);

    // If it's an uploaded file, open the interactive File Viewer Modal
    if (link.isUploadedFile || link.storagePath || (link.fileName && link.fileSize)) {
      setViewingFileLink(link);
      return;
    }

    const rawUrl = link?.url?.trim();
    if (!rawUrl || !isValidUrl(rawUrl)) {
      handleAddToast('Liên kết bài giảng chưa được cấu hình.', 'error');
      return;
    }

    // Ensure valid protocol
    let finalUrl = rawUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('/')) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('Error opening link:', e);
      window.location.href = finalUrl;
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
    let result = [...links];

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
    if (activeCategoryId && activeFilter !== 'favorites' && activeFilter !== 'pinned' && activeFilter !== 'dashboard' && activeFilter !== 'recent') {
      if (activeCategoryId === 'cat-work') {
        if (activeSubCategoryId) {
          result = result.filter((l) => l.subCategoryId === activeSubCategoryId);
        } else {
          result = result.filter((l) => {
            const catId = resolveLinkCategoryId(l);
            return (
              catId === 'cat-work' ||
              l.subCategoryId === 'tinhoc3' ||
              l.subCategoryId === 'tinhoc4' ||
              l.subCategoryId === 'tinhoc5'
            );
          });
        }
      } else {
        result = result.filter((l) => {
          const catId = resolveLinkCategoryId(l);
          return catId === activeCategoryId;
        });
      }
    }

    // Search query matches with Vietnamese accent insensitivity
    if (searchQuery.trim()) {
      const rawQ = searchQuery.toLowerCase().trim();
      const normQ = normalizeVietnamese(searchQuery);
      const queryWords = normQ.split(/\s+/).filter(Boolean);
      // Resolve category names for search integration
      const catMap = new Map<string, string>(categories.map((c) => [c.id, c.name]));

      result = result.filter((l) => {
        const catName = catMap.get(l.categoryId) || '';
        const searchableRaw = [
          l.title,
          l.url,
          l.description,
          l.notes,
          catName,
          l.lesson,
          l.topic,
          l.keywords,
        ].filter(Boolean).join(' ').toLowerCase();

        const searchableNorm = normalizeVietnamese(searchableRaw);

        return (
          searchableRaw.includes(rawQ) ||
          searchableNorm.includes(normQ) ||
          queryWords.every((w) => searchableNorm.includes(w))
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
          setActiveGradeLibrary(null);
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
        activeSubCategoryId={activeSubCategoryId}
        onSelectSubCategory={(subId) => {
          setActiveSubCategoryId(subId);
          if (subId === 'tinhoc3' || subId === 'tinhoc4' || subId === 'tinhoc5') {
            handleOpenGradeLibrary(subId);
          } else {
            setActiveGradeLibrary(null);
          }
        }}
        activeGradeLibrary={activeGradeLibrary}
        onGoHome={handleBackToPortal}
        activeFilter={activeFilter}
        onChangeFilter={(filter) => {
          setActiveFilter(filter);
          setActiveCategoryId(null);
          setActiveSubCategoryId(null); // Reset subcategory when filter changes
          setActiveGradeLibrary(null);
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        onTriggerImport={triggerFileInput}
        onTriggerExportJSON={handleExportJSON}
        onTriggerExportCSV={handleExportCSV}
        linksCountByCategory={linksCountByCategory}
        tinhoc3Count={tinhoc3Count}
        tinhoc4Count={tinhoc4Count}
        tinhoc5Count={tinhoc5Count}
        totalLinksCount={totalLinksCount}
        user={user}
        onLogout={handleLogout}
        avatarUrl={avatarUrl}
        onOpenAvatarModal={handleOpenAvatarModal}
        onOpenBannerModal={handleOpenBannerModal}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10" id="workspace-frame">
        {/* Top Header Controls row */}
        <header className="h-16 glass-header px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-10">
          {/* Left: Logo + App Name (Click to return Home) */}
          <div 
            onClick={handleBackToPortal} 
            className="flex items-center gap-2.5 shrink-0 cursor-pointer group select-none"
            title="Về Trang chủ - Kho học liệu số"
            id="header-logo-home"
          >
            <div
              style={{ backgroundColor: settings.primaryColor, boxShadow: `0 4px 12px ${settings.primaryColor}30` }}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform"
            >
              <Database className="w-4 h-4" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-extrabold text-xs tracking-wider text-zinc-900 dark:text-white group-hover:opacity-90 transition-opacity" style={{ color: settings.primaryColor }}>
                KHO HỌC LIỆU
              </span>
              <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500">
                Tin học tiểu học
              </span>
            </div>
          </div>

          {/* Center: Large Realtime Search Input Bar */}
          <div className="flex-1 max-w-xl mx-auto px-2">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo tiêu đề, URL, mô tả hoặc danh mục..."
                className="w-full pl-10 pr-4 h-10 text-xs sm:text-sm glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)]/25 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all shadow-2xs"
                id="search-input-header"
              />
            </div>
          </div>

          {/* Right: Quick Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Role Switcher */}
            <div className="flex bg-zinc-200/70 dark:bg-zinc-800/70 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 backdrop-blur-sm shadow-2xs">
              <button
                onClick={() => handleToggleRole('admin')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
                title="Quyền Quản trị viên (Toàn quyền Sửa, Xóa, Ghim, Thêm mới)"
                id="header-role-admin-btn"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Quản trị</span>
              </button>
              <button
                onClick={() => handleToggleRole('viewer')}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  role === 'viewer'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
                title="Quyền Người xem (Chỉ xem và tra cứu)"
                id="header-role-viewer-btn"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Người xem</span>
              </button>
            </div>

            {role === 'admin' && (
              <button
                onClick={() => {
                  setEditingLink(null);
                  setIsAddEditOpen(true);
                }}
                style={{ backgroundColor: settings.primaryColor, boxShadow: `0 4px 12px ${settings.primaryColor}30` }}
                className="flex items-center gap-1.5 px-3 sm:px-4 h-10 text-white rounded-xl text-xs font-bold hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shrink-0"
                id="btn-add-link-header"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Thêm liên kết</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6" id="scrollable-content-area">
          {activeGradeLibrary ? (
            /* DEDICATED GRADE LIBRARY VIEW (TIN HỌC 3, 4, 5) */
            <GradeLibraryView
              grade={activeGradeLibrary}
              links={links}
              category={categories.find(c => c.id === 'cat-work' || c.id === 'cat-tech' || c.name.toLowerCase().includes('e-learning'))}
              role={role}
              settings={settings}
              onBack={handleBackToPortal}
              onOpenLink={handleOpenLink}
              onEditLink={(link) => {
                setEditingLink(link);
                setIsAddEditOpen(true);
              }}
              onDeleteLink={(link) => {
                setDeletingLink(link);
                setIsDeleteConfirmOpen(true);
              }}
              onAddLink={() => {
                setEditingLink(null);
                setIsAddEditOpen(true);
              }}
              onToggleFavorite={handleToggleFavorite}
              onTogglePinned={handleTogglePinned}
              onAddToast={handleAddToast}
            />
          ) : activeFilter === 'recent' ? (
            /* HỌC LIỆU MỚI (Dedicated Standalone Recent Materials Page) */
            <div className="max-w-6xl mx-auto">
              <RecentMaterialsView
                links={links}
                categories={categories}
                role={role}
                settings={settings}
                isLoading={loadingFirebase}
                onOpenLink={handleOpenLink}
                onEditLink={(link) => {
                  setEditingLink(link);
                  setIsAddEditOpen(true);
                }}
                onDeleteLink={(link) => {
                  setDeletingLink(link);
                  setIsDeleteConfirmOpen(true);
                }}
                onToggleFavorite={handleToggleFavorite}
                onTogglePinned={handleTogglePinned}
                onAddToast={handleAddToast}
                onAddNewLink={() => {
                  setEditingLink(null);
                  setIsAddEditOpen(true);
                }}
                onBackToPortal={handleBackToPortal}
              />
            </div>
          ) : activeFilter === 'dashboard' ? (
            /* BẢNG THỐNG KÊ (Dashboard Analytics View) */
            <div className="max-w-6xl mx-auto">
              <Dashboard
                links={links}
                tinhoc3Links={tinhoc3Links}
                tinhoc4Links={tinhoc4Links}
                tinhoc5Links={tinhoc5Links}
                categories={categories}
                role={role}
                settings={settings}
                onOpenLink={handleOpenLink}
                onNavigateGrade={handleOpenGradeLibrary}
                onNavigateCategory={(catId) => {
                  setActiveCategoryId(catId);
                  setActiveFilter('all');
                  setActiveGradeLibrary(null);
                  if (window.location.hash) {
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                  }
                }}
                onBackToPortal={handleBackToPortal}
              />
            </div>
          ) : (
            /* Links Directory Workspace view */
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Clean Digital Learning Portal Banner ("HỌC LIỆU SỐ MÔN TIN HỌC" & "Kết nối tri thức - Chạm tới tương lai") */}
              <div 
                className="relative rounded-[24px] overflow-hidden shadow-lg border border-blue-200/50 dark:border-blue-900/30 text-white min-h-[170px] md:min-h-[190px] p-6 md:p-8 flex flex-col items-center justify-center text-center transition-all bg-zinc-900"
                style={{
                  marginTop: `${bannerConfig.marginTop ?? 0}px`,
                  marginBottom: `${bannerConfig.marginBottom ?? 24}px`,
                }}
                id="slogan-banner"
              >
                {/* Background Layer with Live Position & Zoom */}
                {bannerBgUrl ? (
                  <>
                    {/* Custom Image Background Layer with Position & Scale */}
                    <div
                      className="absolute inset-0 z-0 transition-transform duration-100 ease-out"
                      style={{
                        backgroundImage: `url(${bannerBgUrl})`,
                        backgroundPosition: `${bannerConfig.posX ?? 50}% ${bannerConfig.posY ?? 50}%`,
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                        transform: `scale(${(bannerConfig.scale ?? 100) / 100})`,
                        transformOrigin: `${bannerConfig.posX ?? 50}% ${bannerConfig.posY ?? 50}%`,
                      }}
                    />
                    {/* Custom image protection overlay - ensures text legibility on all photo backgrounds */}
                    <div className="absolute inset-0 z-1 bg-gradient-to-t from-black/60 via-black/35 to-black/45 backdrop-blur-[0.5px]" />
                  </>
                ) : (
                  /* Abstract Glowing Atmosphere Overlay - Pure CSS default banner */
                  <div 
                    className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 transition-transform duration-100 ease-out"
                    style={{
                      transform: `scale(${(bannerConfig.scale ?? 100) / 100})`,
                      transformOrigin: `${bannerConfig.posX ?? 50}% ${bannerConfig.posY ?? 50}%`,
                    }}
                  >
                    <div 
                      className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px]" 
                      style={{
                        backgroundPosition: `${bannerConfig.posX ?? 50}% ${bannerConfig.posY ?? 50}%`,
                      }}
                    />
                    <div 
                      className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-400/25 rounded-full blur-3xl -translate-y-1/2" 
                      style={{
                        transform: `translate(${((bannerConfig.posX ?? 50) - 50) * 1.5}px, ${((bannerConfig.posY ?? 50) - 50) * 1.5}px)`,
                      }}
                    />
                    <div 
                      className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl translate-y-1/2" 
                      style={{
                        transform: `translate(${((bannerConfig.posX ?? 50) - 50) * 1.5}px, ${((bannerConfig.posY ?? 50) - 50) * 1.5}px)`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/10" />
                  </div>
                )}

                {/* Quick Banner Edit Button for Admin Only */}
                {role === 'admin' && (
                  <button
                    type="button"
                    onClick={handleOpenBannerModal}
                    className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 active:scale-[0.98] text-white/90 hover:text-white backdrop-blur-md text-xs font-bold border border-white/20 transition-all cursor-pointer shadow-sm"
                    title="Tùy chỉnh ảnh nền & Vị trí Banner (Chỉ Quản trị viên)"
                    id="btn-quick-manage-banner"
                  >
                    <Camera className="w-3.5 h-3.5 text-cyan-300" />
                    <span className="hidden sm:inline">Tùy chỉnh Banner</span>
                  </button>
                )}
                
                {/* Center Content (Strictly Fixed & Centered) */}
                <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-3.5 select-none pointer-events-none">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans">
                    HỌC LIỆU SỐ MÔN TIN HỌC
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold tracking-normal text-cyan-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-sans">
                    Kết nối tri thức - Chạm tới tương lai
                  </p>
                </div>
              </div>

              {/* CỔNG HỌC LIỆU SỐ Section */}
              <LearningPortal
                allLinks={links}
                tinhoc3Links={tinhoc3Links}
                tinhoc4Links={tinhoc4Links}
                tinhoc5Links={tinhoc5Links}
                categories={categories}
                onSelectSubCategory={setActiveSubCategoryId}
                onSelectCategory={setActiveCategoryId}
                onChangeFilter={setActiveFilter}
                onOpenGradeLibrary={handleOpenGradeLibrary}
              />

              <div id="links-directory-section"></div>

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
                  links={links}
                  role={role}
                  onSelectSubCategory={(subId) => {
                    if (subId) {
                      handleOpenGradeLibrary(subId as any);
                    } else {
                      setActiveSubCategoryId(null);
                    }
                  }}
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
                        onOpenFileViewer={(l) => setViewingFileLink(l)}
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
        defaultCategoryId={activeGradeLibrary ? 'cat-work' : (activeCategoryId || 'cat-work')}
        defaultSubCategoryId={activeGradeLibrary || activeSubCategoryId || undefined}
        role={role}
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

      {/* 5. Teacher Avatar Management Modal */}
      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatar={avatarUrl}
        onSaveAvatar={handleSaveAvatar}
        onDeleteAvatar={handleDeleteAvatar}
        onAddToast={handleAddToast}
      />

      {/* 6. Banner Background Image & Position Management Modal (Admin Only) */}
      <BannerModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        role={role}
        bannerConfig={bannerConfig}
        currentBannerUrl={bannerBgUrl}
        onSaveBannerConfig={handleSaveBannerConfig}
        onDeleteBanner={handleDeleteBanner}
        onRestoreDefaultBanner={handleRestoreDefaultBanner}
        onAddToast={handleAddToast}
      />

      {/* 7. File Viewer & Downloader Modal */}
      <FileViewerModal
        isOpen={!!viewingFileLink}
        link={viewingFileLink}
        onClose={() => setViewingFileLink(null)}
        onAddToast={handleAddToast}
      />

      {/* Global animated Toast notices */}
      <Toast toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
