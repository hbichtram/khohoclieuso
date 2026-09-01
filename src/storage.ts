import { Category, LinkItem, Settings, DEFAULT_CATEGORIES, BannerConfig, DEFAULT_BANNER_CONFIG } from './types';

const STORAGE_KEYS = {
  LINKS: 'link_manager_links',
  LINKS_TINHOC3: 'link_manager_links_tinhoc3',
  LINKS_TINHOC4: 'link_manager_links_tinhoc4',
  LINKS_TINHOC5: 'link_manager_links_tinhoc5',
  CATEGORIES: 'link_manager_categories',
  SETTINGS: 'link_manager_settings',
  AVATAR: 'link_manager_teacher_avatar',
  BANNER: 'link_manager_banner_bg',
  BANNER_CONFIG: 'link_manager_banner_config',
};

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  primaryColor: '#3B82F6',
  animationsEnabled: true,
  layout: 'grid',
  itemsPerPage: 12,
  bannerConfig: DEFAULT_BANNER_CONFIG,
};

export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return true;
  }
  try {
    const parsed = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

export const normalizeVietnamese = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
};

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const decodeHTML = (html: string): string => {
  if (!html) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

// Auto extract domain and get high quality favicon URL
export const getFaviconUrl = (urlStr: string): string => {
  try {
    let domain = urlStr;
    if (domain.includes('://')) {
      domain = domain.split('://')[1];
    }
    domain = domain.split('/')[0];
    domain = domain.replace('www.', '');
    return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
  } catch (e) {
    return 'https://www.google.com/s2/favicons?sz=64&domain=google.com';
  }
};

// Extract domain clean name for auto-title
export const extractCleanDomain = (urlStr: string): string => {
  try {
    let domain = urlStr;
    if (domain.includes('://')) {
      domain = domain.split('://')[1];
    }
    domain = domain.split('/')[0];
    domain = domain.replace('www.', '');
    const parts = domain.split('.');
    if (parts.length > 1) {
      const mainPart = parts[parts.length - 2];
      return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
    }
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch (e) {
    return 'Liên kết mới';
  }
};

// Helper to map any category name, legacy ID, or alias to standard canonical Category ID
export const canonicalCategoryId = (input?: string | null): string => {
  if (!input) return 'cat-work';
  const val = input.trim().toLowerCase();
  
  if (
    val === 'cat-work' ||
    val === 'cat-edu' ||
    val === 'bài giảng e-learning' ||
    val === 'bai giang e-learning' ||
    val === 'elearning' ||
    val === 'e-learning' ||
    val === 'công việc' ||
    val === 'cong viec' ||
    val === 'giảng dạy' ||
    val === 'giang day'
  ) {
    return 'cat-work';
  }
  if (
    val === 'cat-tech' ||
    val === 'tin học' ||
    val === 'tin hoc' ||
    val === 'tinhoc' ||
    val === 'tech' ||
    val === 'it'
  ) {
    return 'cat-tech';
  }
  if (
    val === 'cat-ai' ||
    val === 'ai' ||
    val === 'trí tuệ nhân tạo' ||
    val === 'tri tue nhan tao' ||
    val === 'artificial intelligence'
  ) {
    return 'cat-ai';
  }
  if (
    val === 'cat-video' ||
    val === 'video' ||
    val === 'clip' ||
    val === 'youtube'
  ) {
    return 'cat-video';
  }
  if (
    val === 'cat-web' ||
    val === 'website' ||
    val === 'web' ||
    val === 'trang web' ||
    val === 'trangweb'
  ) {
    return 'cat-web';
  }
  if (
    val === 'cat-doc' ||
    val === 'tài liệu' ||
    val === 'tai lieu' ||
    val === 'document' ||
    val === 'doc' ||
    val === 'docs' ||
    val === 'giáo án'
  ) {
    return 'cat-doc';
  }
  if (
    val === 'cat-game' ||
    val === 'cat-ent' ||
    val === 'trò chơi' ||
    val === 'tro choi' ||
    val === 'game' ||
    val === 'games' ||
    val === 'giải trí' ||
    val === 'giai tri'
  ) {
    return 'cat-game';
  }
  return input;
};

// Helper to determine link's category with full backward compatibility
export const resolveLinkCategoryId = (link: Partial<LinkItem> & Record<string, any>): string => {
  // 1. Direct categoryId
  if (link.categoryId) {
    const mapped = canonicalCategoryId(link.categoryId);
    if (mapped) return mapped;
  }

  // 2. Legacy 'category' or 'categoryName'
  const legacyCat = link.category || link.categoryName;
  if (legacyCat && typeof legacyCat === 'string') {
    const mapped = canonicalCategoryId(legacyCat);
    if (mapped) return mapped;
  }

  // 3. Legacy 'type'
  if (link.type && typeof link.type === 'string') {
    const mapped = canonicalCategoryId(link.type);
    if (mapped) return mapped;
  }

  // 4. SubCategoryId belongs to E-Learning (Tin học 3/4/5)
  if (link.subCategoryId === 'tinhoc3' || link.subCategoryId === 'tinhoc4' || link.subCategoryId === 'tinhoc5') {
    return 'cat-work';
  }

  // 5. Resource type mapping
  if (link.resourceType === 'video') return 'cat-video';
  if (link.resourceType === 'game') return 'cat-game';
  if (link.resourceType === 'lecture') return 'cat-work';

  return 'cat-work';
};

// Helper to ensure all 7 core categories are present while preserving existing/custom categories
export const ensureAllDefaultCategories = (incomingCats: Category[]): Category[] => {
  const existingMap = new Map<string, Category>();

  if (Array.isArray(incomingCats)) {
    incomingCats.forEach((c) => {
      if (!c || !c.id) return;
      const canonicalId = canonicalCategoryId(c.id);
      const defMatch = DEFAULT_CATEGORIES.find((d) => d.id === canonicalId);
      
      let name = c.name?.trim() || (defMatch ? defMatch.name : '');
      if (canonicalId === 'cat-work' && (name === 'Công việc' || !name)) {
        name = 'Bài giảng E-Learning';
      }
      if (canonicalId === 'cat-game' && (name === 'Giải trí' || !name)) {
        name = 'Trò chơi';
      }

      existingMap.set(canonicalId, {
        id: canonicalId,
        name: (defMatch ? defMatch.name : name) || canonicalId,
        color: c.color || (defMatch ? defMatch.color : '#3B82F6'),
        icon: defMatch?.icon || c.icon || undefined,
      });
    });
  }

  // Merge in standard order
  const result: Category[] = [];
  const addedIds = new Set<string>();

  DEFAULT_CATEGORIES.forEach((defCat) => {
    const existing = existingMap.get(defCat.id);
    if (existing) {
      result.push({
        ...defCat,
        ...existing,
        name: defCat.name,
        icon: defCat.icon,
      });
    } else {
      result.push({ ...defCat });
    }
    addedIds.add(defCat.id);
  });

  // Preserve any custom user-defined categories
  existingMap.forEach((cat, id) => {
    if (!addedIds.has(id)) {
      result.push(cat);
    }
  });

  return result;
};

// File helper utilities
export const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const detectFileType = (
  fileName: string,
  mimeType?: string
): 'pdf' | 'word' | 'powerpoint' | 'excel' | 'image' | 'video' | 'audio' | 'archive' | 'other' => {
  if (!fileName && !mimeType) return 'other';
  const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
  const mime = (mimeType || '').toLowerCase();

  if (ext === 'pdf' || mime.includes('pdf')) return 'pdf';
  if (['doc', 'docx'].includes(ext) || mime.includes('word') || mime.includes('officedocument.wordprocessingml')) return 'word';
  if (['ppt', 'pptx', 'pps', 'ppsx'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint')) return 'powerpoint';
  if (['xls', 'xlsx', 'csv'].includes(ext) || mime.includes('sheet') || mime.includes('excel')) return 'excel';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext) || mime.startsWith('image/')) return 'image';
  if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(ext) || mime.startsWith('video/')) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext) || mime.startsWith('audio/')) return 'audio';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mime.includes('zip') || mime.includes('compressed')) return 'archive';
  return 'other';
};

export const getFileTypeBadgeInfo = (fileType?: string) => {
  switch (fileType) {
    case 'pdf':
      return {
        label: 'Tài liệu PDF',
        badge: 'PDF',
        emoji: '📄',
        color: 'text-red-600 bg-red-500/10 border-red-200 dark:border-red-900/50',
        textColor: 'text-red-600 dark:text-red-400',
        bgLight: 'bg-red-50 dark:bg-red-950/40',
      };
    case 'word':
      return {
        label: 'Văn bản Word',
        badge: 'DOCX',
        emoji: '📝',
        color: 'text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-900/50',
        textColor: 'text-blue-600 dark:text-blue-400',
        bgLight: 'bg-blue-50 dark:bg-blue-950/40',
      };
    case 'powerpoint':
      return {
        label: 'Trình chiếu PowerPoint',
        badge: 'PPTX',
        emoji: '📊',
        color: 'text-orange-600 bg-orange-500/10 border-orange-200 dark:border-orange-900/50',
        textColor: 'text-orange-600 dark:text-orange-400',
        bgLight: 'bg-orange-50 dark:bg-orange-950/40',
      };
    case 'excel':
      return {
        label: 'Bảng tính Excel',
        badge: 'XLSX',
        emoji: '📈',
        color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/50',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
      };
    case 'video':
      return {
        label: 'Tệp Video bài giảng',
        badge: 'VIDEO',
        emoji: '🎬',
        color: 'text-rose-600 bg-rose-500/10 border-rose-200 dark:border-rose-900/50',
        textColor: 'text-rose-600 dark:text-rose-400',
        bgLight: 'bg-rose-50 dark:bg-rose-950/40',
      };
    case 'audio':
      return {
        label: 'Tệp Âm thanh',
        badge: 'AUDIO',
        emoji: '🎵',
        color: 'text-purple-600 bg-purple-500/10 border-purple-200 dark:border-purple-900/50',
        textColor: 'text-purple-600 dark:text-purple-400',
        bgLight: 'bg-purple-50 dark:bg-purple-950/40',
      };
    case 'image':
      return {
        label: 'Hình ảnh học tập',
        badge: 'ẢNH',
        emoji: '🖼️',
        color: 'text-cyan-600 bg-cyan-500/10 border-cyan-200 dark:border-cyan-900/50',
        textColor: 'text-cyan-600 dark:text-cyan-400',
        bgLight: 'bg-cyan-50 dark:bg-cyan-950/40',
      };
    case 'archive':
      return {
        label: 'Tệp Nén (Zip/Rar)',
        badge: 'ZIP',
        emoji: '📦',
        color: 'text-amber-600 bg-amber-500/10 border-amber-200 dark:border-amber-900/50',
        textColor: 'text-amber-600 dark:text-amber-400',
        bgLight: 'bg-amber-50 dark:bg-amber-950/40',
      };
    default:
      return {
        label: 'Tệp đính kèm',
        badge: 'TỆP',
        emoji: '📁',
        color: 'text-zinc-600 bg-zinc-500/10 border-zinc-200 dark:border-zinc-800',
        textColor: 'text-zinc-600 dark:text-zinc-400',
        bgLight: 'bg-zinc-50 dark:bg-zinc-800',
      };
  }
};

// Storage Service Class
export const normalizeLinkItem = (payload: Partial<LinkItem> & Record<string, any>): LinkItem => {
  const now = new Date().toISOString();
  const id = payload.id && payload.id.trim() ? payload.id.trim() : `link-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const cleanUrl = payload.url?.trim() || '';
  const resolvedCatId = resolveLinkCategoryId(payload);
  const defCat = DEFAULT_CATEGORIES.find((c) => c.id === resolvedCatId);

  // Auto detect file type if uploaded file
  const isUploadedFile = Boolean(payload.isUploadedFile || payload.storagePath || (payload.fileName && payload.fileSize));
  const detectedType = payload.fileType || (payload.fileName ? detectFileType(payload.fileName, payload.mimeType) : undefined);
  const formattedSize = payload.fileSizeFormatted || (payload.fileSize ? formatFileSize(payload.fileSize) : undefined);

  return {
    id,
    title: payload.title?.trim() || (payload.fileName ? payload.fileName.replace(/\.[^/.]+$/, '') : 'Học liệu mới'),
    url: cleanUrl,
    description: payload.description?.trim() || '',
    categoryId: resolvedCatId,
    color: payload.color?.trim() || defCat?.color || '#3B82F6',
    favicon: payload.favicon?.trim() || getFaviconUrl(cleanUrl),
    notes: payload.notes?.trim() || '',
    isFavorite: Boolean(payload.isFavorite),
    isPinned: Boolean(payload.isPinned),
    viewsCount: typeof payload.viewsCount === 'number' && !isNaN(payload.viewsCount) ? payload.viewsCount : 0,
    createdAt: payload.createdAt || now,
    updatedAt: payload.updatedAt || now,
    imageUrl: payload.imageUrl?.trim() || '',
    subCategoryId: payload.subCategoryId || '',
    topic: payload.topic?.trim() || '',
    lesson: payload.lesson?.trim() || '',
    resourceType: payload.resourceType || '',
    keywords: payload.keywords?.trim() || '',
    isHidden: Boolean(payload.isHidden),
    order: typeof payload.order === 'number' ? payload.order : 0,

    // File Upload fields
    isUploadedFile,
    fileName: payload.fileName?.trim() || '',
    fileSize: typeof payload.fileSize === 'number' ? payload.fileSize : undefined,
    fileSizeFormatted: formattedSize,
    fileType: detectedType,
    mimeType: payload.mimeType || '',
    storagePath: payload.storagePath || '',
    author: payload.author?.trim() || '',
    grade: payload.grade?.trim() || '',
  };
};

export const cleanFirestoreData = <T extends Record<string, any>>(data: T): Record<string, any> => {
  const result: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    const val = data[key];
    if (val !== undefined) {
      result[key] = val;
    }
  });
  return result;
};

export const StorageService = {
  getLinks(): LinkItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LINKS);
      let linksList: LinkItem[] = [];

      if (data) {
        linksList = JSON.parse(data) as LinkItem[];
      }

      // Check legacy separate keys for migration into unified list
      const legacyTinHoc3 = localStorage.getItem(STORAGE_KEYS.LINKS_TINHOC3);
      const legacyTinHoc4 = localStorage.getItem(STORAGE_KEYS.LINKS_TINHOC4);
      const legacyTinHoc5 = localStorage.getItem(STORAGE_KEYS.LINKS_TINHOC5);

      if (legacyTinHoc3) {
        try {
          const parsed = JSON.parse(legacyTinHoc3) as LinkItem[];
          parsed.forEach((l) => {
            if (!linksList.some((existing) => existing.id === l.id)) {
              linksList.push({ ...l, categoryId: l.categoryId || 'cat-work', subCategoryId: 'tinhoc3' });
            }
          });
        } catch (e) {
          // ignore
        }
      }

      if (legacyTinHoc4) {
        try {
          const parsed = JSON.parse(legacyTinHoc4) as LinkItem[];
          parsed.forEach((l) => {
            if (!linksList.some((existing) => existing.id === l.id)) {
              linksList.push({ ...l, categoryId: l.categoryId || 'cat-work', subCategoryId: 'tinhoc4' });
            }
          });
        } catch (e) {
          // ignore
        }
      }

      if (legacyTinHoc5) {
        try {
          const parsed = JSON.parse(legacyTinHoc5) as LinkItem[];
          parsed.forEach((l) => {
            if (!linksList.some((existing) => existing.id === l.id)) {
              linksList.push({ ...l, categoryId: l.categoryId || 'cat-work', subCategoryId: 'tinhoc5' });
            }
          });
        } catch (e) {
          // ignore
        }
      }

      // If still empty, return starter links
      if (linksList.length === 0) {
        const starterLinks: LinkItem[] = [
          {
            id: 'tinhoc3-starter-1',
            title: 'Học gõ 10 ngón - TypingClub',
            url: 'https://www.typingclub.com',
            description: 'Phần mềm trực tuyến giúp học sinh lớp 3 luyện gõ bàn phím bằng 10 ngón tay cực nhanh và chính xác.',
            categoryId: 'cat-work',
            subCategoryId: 'tinhoc3',
            lesson: 'Bài 1: Luyện gõ bàn phím 10 ngón',
            topic: 'Chủ đề A: Máy tính và em',
            resourceType: 'software',
            color: '#3B82F6',
            favicon: 'https://www.google.com/s2/favicons?sz=64&domain=typingclub.com',
            notes: 'Hướng dẫn học sinh ngồi đúng tư thế và đặt tay đúng vị trí xuất phát.',
            isFavorite: true,
            isPinned: true,
            viewsCount: 25,
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'tinhoc4-starter-1',
            title: 'Trang chủ lập trình Scratch',
            url: 'https://scratch.mit.edu',
            description: 'Nền tảng lập trình trực quan kéo thả dành cho học sinh lớp 4 làm quen với tư duy máy tính.',
            categoryId: 'cat-work',
            subCategoryId: 'tinhoc4',
            lesson: 'Bài 1: Làm quen với giao diện Scratch',
            topic: 'Chủ đề F: Giải quyết vấn đề với sự trợ giúp của máy tính',
            resourceType: 'software',
            color: '#10B981',
            favicon: 'https://www.google.com/s2/favicons?sz=64&domain=scratch.mit.edu',
            notes: 'Thực hành tạo tài khoản và làm quen với giao diện sân khấu.',
            isFavorite: true,
            isPinned: true,
            viewsCount: 20,
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'tinhoc5-starter-1',
            title: 'Lập trình Scratch nâng cao & Sáng tạo',
            url: 'https://scratch.mit.edu/ideas',
            description: 'Các ý tưởng và hướng dẫn lập trình trò chơi, phim hoạt hình sáng tạo cho học sinh lớp 5.',
            categoryId: 'cat-work',
            subCategoryId: 'tinhoc5',
            lesson: 'Bài 1: Dự án thiết kế trò chơi tương tác',
            topic: 'Chủ đề F: Dự án lập trình',
            resourceType: 'lecture',
            color: '#F59E0B',
            favicon: 'https://www.google.com/s2/favicons?sz=64&domain=scratch.mit.edu',
            notes: 'Tập trung vào phần vẽ hình bằng bút vẽ và cấu trúc lặp.',
            isFavorite: true,
            isPinned: true,
            viewsCount: 30,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'starter-1',
            title: 'Google AI Studio',
            url: 'https://aistudio.google.com',
            description: 'Công cụ phát triển ứng dụng AI nhanh chóng với Gemini.',
            categoryId: 'cat-ai',
            color: '#EC4899',
            favicon: 'https://www.google.com/s2/favicons?sz=64&domain=aistudio.google.com',
            notes: 'Môi trường phát triển ứng dụng bằng mô hình Gemini mới nhất.',
            isFavorite: true,
            isPinned: false,
            viewsCount: 42,
            createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'starter-2',
            title: 'Kênh Video Tin Học Tiểu Học',
            url: 'https://www.youtube.com',
            description: 'Tuyển tập video hướng dẫn bài học Tin học tiểu học trực quan sinh động.',
            categoryId: 'cat-video',
            resourceType: 'video',
            color: '#EF4444',
            favicon: 'https://www.google.com/s2/favicons?sz=64&domain=youtube.com',
            notes: 'Video bài giảng ngắn gọn cho học sinh tự học tại nhà.',
            isFavorite: true,
            isPinned: false,
            viewsCount: 18,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'starter-3',
            title: 'Tài liệu hướng dẫn Tin học & Giáo án',
            url: 'https://vietjack.com',
            description: 'Kho tư liệu giáo án, phiếu bài tập rèn luyện kỹ năng Tin học các khối lớp.',
            categoryId: 'cat-doc',
            resourceType: 'lecture',
            color: '#06B6D4',
            favicon: 'https://www.google.com/s2/favicons?sz=64&domain=vietjack.com',
            notes: 'Tham khảo tài liệu và câu hỏi trắc nghiệm.',
            isFavorite: false,
            isPinned: false,
            viewsCount: 12,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'starter-4',
            title: 'Hành Trang Số - Sách Giáo Khoa Điện Tử',
            url: 'https://hanhtrangso.nxbgd.vn',
            description: 'Nền tảng sách giáo khoa và tài liệu bổ trợ Tin học số hoá của Nhà xuất bản Giáo dục Việt Nam.',
            categoryId: 'cat-web',
            color: '#F59E0B',
            favicon: 'https://www.google.com/s2/favicons?sz=64&domain=hanhtrangso.nxbgd.vn',
            notes: 'Học sinh có thể xem trực tuyến toàn bộ sách giáo khoa và bài tập tương tác.',
            isFavorite: false,
            isPinned: false,
            viewsCount: 15,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'starter-5',
            title: 'Code.org - Trò chơi Lập trình Hour of Code',
            url: 'https://code.org',
            description: 'Các trò chơi mê cung, giải đố logic giúp học sinh luyện tư duy thuật toán thông qua trò chơi hấp dẫn.',
            categoryId: 'cat-game',
            resourceType: 'game',
            color: '#10B981',
            favicon: 'https://www.google.com/s2/favicons?sz=64&domain=code.org',
            notes: 'Thực hành các màn chơi giải cứu nhân vật bằng câu lệnh khối.',
            isFavorite: true,
            isPinned: false,
            viewsCount: 28,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'starter-6',
            title: 'Tự học Kỹ năng Tin học Văn phòng & Máy tính',
            url: 'https://hocit.vn',
            description: 'Hướng dẫn tổng hợp về phần cứng, phần mềm và kỹ năng sử dụng máy tính an toàn cho trẻ em.',
            categoryId: 'cat-tech',
            color: '#8B5CF6',
            favicon: 'https://www.google.com/s2/favicons?sz=64&domain=google.com',
            notes: 'Bổ trợ kiến thức máy tính và an toàn mạng.',
            isFavorite: false,
            isPinned: false,
            viewsCount: 14,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
          }
        ];
        this.saveLinks(starterLinks);
        return starterLinks;
      }

      // Ensure all links have categoryId mapped properly
      const normalized = linksList.map((l) => normalizeLinkItem(l));

      this.saveLinks(normalized);
      return normalized;
    } catch (e) {
      console.error('Error loading links', e);
      return [];
    }
  },

  saveLinks(links: LinkItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links));
      // Keep legacy keys updated for safety
      const g3 = links.filter((l) => l.subCategoryId === 'tinhoc3');
      const g4 = links.filter((l) => l.subCategoryId === 'tinhoc4');
      const g5 = links.filter((l) => l.subCategoryId === 'tinhoc5');
      localStorage.setItem(STORAGE_KEYS.LINKS_TINHOC3, JSON.stringify(g3));
      localStorage.setItem(STORAGE_KEYS.LINKS_TINHOC4, JSON.stringify(g4));
      localStorage.setItem(STORAGE_KEYS.LINKS_TINHOC5, JSON.stringify(g5));
    } catch (e) {
      console.error('Error saving links', e);
    }
  },

  getTinHoc3Links(): LinkItem[] {
    return this.getLinks().filter((l) => l.subCategoryId === 'tinhoc3');
  },

  saveTinHoc3Links(links: LinkItem[]): void {
    const all = this.getLinks().filter((l) => l.subCategoryId !== 'tinhoc3');
    const updated = [...all, ...links.map((l) => ({ ...l, categoryId: l.categoryId || 'cat-work', subCategoryId: 'tinhoc3' as const }))];
    this.saveLinks(updated);
  },

  getTinHoc4Links(): LinkItem[] {
    return this.getLinks().filter((l) => l.subCategoryId === 'tinhoc4');
  },

  saveTinHoc4Links(links: LinkItem[]): void {
    const all = this.getLinks().filter((l) => l.subCategoryId !== 'tinhoc4');
    const updated = [...all, ...links.map((l) => ({ ...l, categoryId: l.categoryId || 'cat-work', subCategoryId: 'tinhoc4' as const }))];
    this.saveLinks(updated);
  },

  getTinHoc5Links(): LinkItem[] {
    return this.getLinks().filter((l) => l.subCategoryId === 'tinhoc5');
  },

  saveTinHoc5Links(links: LinkItem[]): void {
    const all = this.getLinks().filter((l) => l.subCategoryId !== 'tinhoc5');
    const updated = [...all, ...links.map((l) => ({ ...l, categoryId: l.categoryId || 'cat-work', subCategoryId: 'tinhoc5' as const }))];
    this.saveLinks(updated);
  },

  getCategories(): Category[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        return DEFAULT_CATEGORIES;
      }
      const parsed: Category[] = JSON.parse(data);
      const merged = ensureAllDefaultCategories(parsed);
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.error('Error loading categories', e);
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories(categories: Category[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Error saving categories', e);
    }
  },

  getSettings(): Settings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.error('Error loading settings', e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Settings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings', e);
    }
  },

  // Export fully verified JSON string
  exportBackup(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      links: this.getLinks(),
      categories: this.getCategories(),
      settings: this.getSettings(),
    };
    return JSON.stringify(backup, null, 2);
  },

  // Import verified backup with merge support
  importBackup(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || (typeof parsed !== 'object')) {
        return { success: false, message: 'Định dạng dữ liệu không hợp lệ.' };
      }

      let importedLinksCount = 0;
      let importedCategoriesCount = 0;

      // Validate and merge categories
      if (Array.isArray(parsed.categories)) {
        const currentCategories = this.getCategories();
        const mergedCategories = [...currentCategories];
        parsed.categories.forEach((cat: any) => {
          if (cat.id && cat.name && cat.color) {
            const exists = mergedCategories.some((c) => c.id === cat.id);
            if (!exists) {
              mergedCategories.push({
                id: String(cat.id),
                name: sanitizeInput(String(cat.name)),
                color: String(cat.color),
                icon: cat.icon ? String(cat.icon) : undefined,
              });
              importedCategoriesCount++;
            }
          }
        });
        this.saveCategories(mergedCategories);
      }

      // Validate and merge links
      if (Array.isArray(parsed.links)) {
        const currentLinks = this.getLinks();
        const mergedLinks = [...currentLinks];
        parsed.links.forEach((link: any) => {
          if (link.id && link.title && link.url) {
            const exists = mergedLinks.some((l) => l.id === link.id);
            if (!exists) {
              mergedLinks.push({
                id: String(link.id),
                title: sanitizeInput(String(link.title)),
                url: String(link.url),
                description: link.description ? sanitizeInput(String(link.description)) : '',
                categoryId: link.categoryId ? String(link.categoryId) : 'cat-work',
                color: link.color ? String(link.color) : '#3B82F6',
                favicon: link.favicon ? String(link.favicon) : getFaviconUrl(link.url),
                notes: link.notes ? sanitizeInput(String(link.notes)) : '',
                isFavorite: !!link.isFavorite,
                isPinned: !!link.isPinned,
                viewsCount: typeof link.viewsCount === 'number' ? link.viewsCount : 0,
                createdAt: link.createdAt ? String(link.createdAt) : new Date().toISOString(),
                updatedAt: link.updatedAt ? String(link.updatedAt) : new Date().toISOString(),
                imageUrl: link.imageUrl ? String(link.imageUrl) : undefined,
                subCategoryId: link.subCategoryId ? (String(link.subCategoryId) as any) : undefined,
                topic: link.topic ? sanitizeInput(String(link.topic)) : undefined,
                lesson: link.lesson ? sanitizeInput(String(link.lesson)) : undefined,
                resourceType: link.resourceType ? (String(link.resourceType) as any) : undefined,
                keywords: link.keywords ? sanitizeInput(String(link.keywords)) : undefined,
                isHidden: !!link.isHidden,
              });
              importedLinksCount++;
            }
          }
        });
        this.saveLinks(mergedLinks);
      }

      if (parsed.settings && typeof parsed.settings === 'object') {
        const currentSettings = this.getSettings();
        this.saveSettings({
          ...currentSettings,
          ...parsed.settings,
        });
      }

      return {
        success: true,
        message: `Nhập dữ liệu thành công! Đã thêm ${importedLinksCount} liên kết và ${importedCategoriesCount} danh mục mới.`,
      };
    } catch (e) {
      return { success: false, message: 'Lỗi phân tích cú pháp dữ liệu JSON.' };
    }
  },

  // Export links to CSV
  exportToCSV(): string {
    const links = this.getLinks();
    const categories = this.getCategories();
    const catMap = new Map<string, string>(categories.map((c) => [c.id, c.name]));

    const headers = ['ID', 'Tiêu đề', 'URL', 'Mô tả', 'Danh mục', 'Đã ghim', 'Yêu thích', 'Lượt xem', 'Ngày tạo', 'Ghi chú'];
    const rows = links.map((l) => [
      l.id,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${l.url.replace(/"/g, '""')}"`,
      `"${(l.description || '').replace(/"/g, '""')}"`,
      `"${(catMap.get(l.categoryId) || 'Chưa phân loại').replace(/"/g, '""')}"`,
      l.isPinned ? 'Có' : 'Không',
      l.isFavorite ? 'Có' : 'Không',
      l.viewsCount,
      l.createdAt,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    return csvContent;
  },

  // Avatar Management
  getAvatar(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.AVATAR);
    } catch (e) {
      return null;
    }
  },

  saveAvatar(dataUrl: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.AVATAR, dataUrl);
    } catch (e) {
      console.error('Lỗi khi lưu ảnh đại diện', e);
    }
  },

  deleteAvatar(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.AVATAR);
    } catch (e) {
      console.error('Lỗi khi xóa ảnh đại diện', e);
    }
  },

  // Banner Management
  getBanner(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.BANNER);
    } catch (e) {
      return null;
    }
  },

  saveBanner(dataUrl: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BANNER, dataUrl);
    } catch (e) {
      console.error('Lỗi khi lưu ảnh nền banner', e);
    }
  },

  deleteBanner(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.BANNER);
    } catch (e) {
      console.error('Lỗi khi xóa ảnh nền banner', e);
    }
  },

  // Banner Position & Scale Configuration Management
  getBannerConfig(): BannerConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BANNER_CONFIG);
      if (!data) {
        return DEFAULT_BANNER_CONFIG;
      }
      return { ...DEFAULT_BANNER_CONFIG, ...JSON.parse(data) };
    } catch (e) {
      return DEFAULT_BANNER_CONFIG;
    }
  },

  saveBannerConfig(config: BannerConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BANNER_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Lỗi khi lưu cấu hình vị trí banner', e);
    }
  },

  deleteBannerConfig(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.BANNER_CONFIG);
    } catch (e) {
      console.error('Lỗi khi xóa cấu hình vị trí banner', e);
    }
  }
};
