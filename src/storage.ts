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
  if (!url) return false;
  try {
    // Try to parse with URL constructor
    const parsed = new URL(url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`);
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

// Storage Service Class
export const normalizeLinkItem = (payload: Partial<LinkItem>): LinkItem => {
  const now = new Date().toISOString();
  const id = payload.id && payload.id.trim() ? payload.id.trim() : `link-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const cleanUrl = payload.url?.trim() || '';
  
  return {
    id,
    title: payload.title?.trim() || 'Học liệu mới',
    url: cleanUrl,
    description: payload.description?.trim() || '',
    categoryId: payload.categoryId?.trim() || 'cat-work',
    color: payload.color?.trim() || '#3B82F6',
    favicon: payload.favicon?.trim() || getFaviconUrl(cleanUrl),
    notes: payload.notes?.trim() || '',
    isFavorite: Boolean(payload.isFavorite),
    isPinned: Boolean(payload.isPinned),
    viewsCount: typeof payload.viewsCount === 'number' && !isNaN(payload.viewsCount) ? payload.viewsCount : 0,
    createdAt: payload.createdAt || now,
    updatedAt: now,
    imageUrl: payload.imageUrl?.trim() || '',
    subCategoryId: payload.subCategoryId || '',
    topic: payload.topic?.trim() || '',
    lesson: payload.lesson?.trim() || '',
    resourceType: payload.resourceType || '',
    keywords: payload.keywords?.trim() || '',
    isHidden: Boolean(payload.isHidden),
    order: typeof payload.order === 'number' ? payload.order : 0,
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
          }
        ];
        this.saveLinks(starterLinks);
        return starterLinks;
      }

      // Ensure all links have categoryId mapped properly
      const normalized = linksList.map((l) => {
        let catId = l.categoryId;
        if (!catId) {
          catId = l.subCategoryId ? 'cat-work' : 'cat-work';
        }
        return {
          ...l,
          categoryId: catId,
        };
      });

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
      let updated = false;
      const migrated = parsed.map((cat) => {
        if (cat.name === 'Công việc' || (cat.id === 'cat-work' && cat.name !== 'Bài giảng E-Learning')) {
          updated = true;
          return { ...cat, name: 'Bài giảng E-Learning' };
        }
        return cat;
      });
      if (updated) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(migrated));
        return migrated;
      }
      return parsed;
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
