import { Category, LinkItem, Settings, DEFAULT_CATEGORIES } from './types';

const STORAGE_KEYS = {
  LINKS: 'link_manager_links',
  LINKS_TINHOC3: 'link_manager_links_tinhoc3',
  LINKS_TINHOC4: 'link_manager_links_tinhoc4',
  LINKS_TINHOC5: 'link_manager_links_tinhoc5',
  CATEGORIES: 'link_manager_categories',
  SETTINGS: 'link_manager_settings',
  AVATAR: 'link_manager_teacher_avatar',
};

const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  primaryColor: '#3B82F6',
  animationsEnabled: true,
  layout: 'grid',
  itemsPerPage: 12,
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
export const StorageService = {
  getLinks(): LinkItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LINKS);
      if (!data) {
        // Return some dummy starter links for first-time premium look
        const starterLinks: LinkItem[] = [
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
            isPinned: true,
            viewsCount: 25,
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'starter-2',
            title: 'Tailwind CSS Docs',
            url: 'https://tailwindcss.com',
            description: 'Tài liệu hướng dẫn sử dụng Tailwind CSS framework.',
            categoryId: 'cat-tech',
            color: '#8B5CF6',
            favicon: 'https://www.google.com/s2/favicons?sz=64&domain=tailwindcss.com',
            notes: 'Tra cứu nhanh các class tiện ích.',
            isFavorite: false,
            isPinned: true,
            viewsCount: 14,
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'starter-3',
            title: 'React Documentation',
            url: 'https://react.dev',
            description: 'Trang chủ tài liệu React phiên bản mới nhất.',
            categoryId: 'cat-doc',
            color: '#06B6D4',
            favicon: 'https://www.google.com/s2/favicons?sz=64&domain=react.dev',
            notes: 'Học React hooks và server components.',
            isFavorite: true,
            isPinned: false,
            viewsCount: 42,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date().toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=600&q=80',
          },
          {
            id: 'starter-4',
            title: 'Vite Guide',
            url: 'https://vite.dev',
            description: 'Công cụ build frontend thế hệ mới cực nhanh.',
            categoryId: 'cat-tech',
            color: '#8B5CF6',
            favicon: 'https://www.google.com/s2/favicons?sz=64&domain=vite.dev',
            notes: 'Tìm hiểu cấu hình Vite plugin.',
            isFavorite: false,
            isPinned: false,
            viewsCount: 8,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
          }
        ];
        this.saveLinks(starterLinks);
        return starterLinks;
      }
      const loaded = JSON.parse(data) as LinkItem[];
      return loaded.filter((l) => !l.subCategoryId);
    } catch (e) {
      console.error('Error loading links', e);
      return [];
    }
  },

  saveLinks(links: LinkItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LINKS, JSON.stringify(links.filter((l) => !l.subCategoryId)));
    } catch (e) {
      console.error('Error saving links', e);
    }
  },

  getTinHoc3Links(): LinkItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LINKS_TINHOC3);
      if (!data) {
        const starter: LinkItem[] = [
          {
            id: 'tinhoc3-starter-1',
            title: 'Học gõ 10 ngón - TypingClub',
            url: 'https://www.typingclub.com',
            description: 'Phần mềm trực tuyến giúp học sinh lớp 3 luyện gõ bàn phím bằng 10 ngón tay cực nhanh và chính xác.',
            categoryId: 'cat-work',
            subCategoryId: 'tinhoc3',
            color: '#3B82F6',
            favicon: 'https://www.google.com/s2/favicons?sz=64&domain=typingclub.com',
            notes: 'Hướng dẫn học sinh ngồi đúng tư thế và đặt tay đúng vị trí xuất phát.',
            isFavorite: true,
            isPinned: true,
            viewsCount: 15,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
          }
        ];
        this.saveTinHoc3Links(starter);
        return starter;
      }
      const loaded: LinkItem[] = JSON.parse(data);
      return loaded.map((l) => ({ ...l, categoryId: 'cat-work' }));
    } catch (e) {
      console.error('Error loading Tin học 3 links', e);
      return [];
    }
  },

  saveTinHoc3Links(links: LinkItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LINKS_TINHOC3, JSON.stringify(links));
    } catch (e) {
      console.error('Error saving Tin học 3 links', e);
    }
  },

  getTinHoc4Links(): LinkItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LINKS_TINHOC4);
      if (!data) {
        const starter: LinkItem[] = [
          {
            id: 'tinhoc4-starter-1',
            title: 'Trang chủ lập trình Scratch',
            url: 'https://scratch.mit.edu',
            description: 'Nền tảng lập trình trực quan kéo thả dành cho học sinh lớp 4 làm quen với tư duy máy tính.',
            categoryId: 'cat-work',
            subCategoryId: 'tinhoc4',
            color: '#10B981',
            favicon: 'https://www.google.com/s2/favicons?sz=64&domain=scratch.mit.edu',
            notes: 'Thực hành tạo tài khoản và làm quen với giao diện sân khấu.',
            isFavorite: true,
            isPinned: true,
            viewsCount: 20,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80',
          }
        ];
        this.saveTinHoc4Links(starter);
        return starter;
      }
      const loaded: LinkItem[] = JSON.parse(data);
      return loaded.map((l) => ({ ...l, categoryId: 'cat-work' }));
    } catch (e) {
      console.error('Error loading Tin học 4 links', e);
      return [];
    }
  },

  saveTinHoc4Links(links: LinkItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LINKS_TINHOC4, JSON.stringify(links));
    } catch (e) {
      console.error('Error saving Tin học 4 links', e);
    }
  },

  getTinHoc5Links(): LinkItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LINKS_TINHOC5);
      if (!data) {
        const starter: LinkItem[] = [
          {
            id: 'tinhoc5-starter-1',
            title: 'Lập trình Scratch nâng cao',
            url: 'https://scratch.mit.edu/ideas',
            description: 'Các ý tưởng và hướng dẫn lập trình trò chơi, phim hoạt hình sáng tạo cho học sinh lớp 5.',
            categoryId: 'cat-work',
            subCategoryId: 'tinhoc5',
            color: '#F59E0B',
            favicon: 'https://www.google.com/s2/favicons?sz=64&domain=scratch.mit.edu',
            notes: 'Tập trung vào phần vẽ hình bằng bút vẽ và cấu trúc lặp.',
            isFavorite: true,
            isPinned: true,
            viewsCount: 25,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=600&q=80',
          }
        ];
        this.saveTinHoc5Links(starter);
        return starter;
      }
      const loaded: LinkItem[] = JSON.parse(data);
      return loaded.map((l) => ({ ...l, categoryId: 'cat-work' }));
    } catch (e) {
      console.error('Error loading Tin học 5 links', e);
      return [];
    }
  },

  saveTinHoc5Links(links: LinkItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LINKS_TINHOC5, JSON.stringify(links));
    } catch (e) {
      console.error('Error saving Tin học 5 links', e);
    }
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
  }
};
