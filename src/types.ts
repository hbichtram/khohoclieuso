export interface Category {
  id: string;
  name: string;
  color: string; // Hex color e.g., "#3B82F6"
  icon?: string;
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  description: string;
  categoryId: string; // links to Category.id
  color: string; // custom custom tag/badge color
  favicon: string;
  notes: string;
  isFavorite: boolean;
  isPinned: boolean;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  
  // Custom subfolder fields for Tin học 3/4/5
  subCategoryId?: 'tinhoc3' | 'tinhoc4' | 'tinhoc5' | '';
  topic?: string;
  lesson?: string;
  resourceType?: 'video' | 'lecture' | 'game' | 'exercise' | 'website' | 'software' | 'document' | '';
  keywords?: string;
  isHidden?: boolean;
  order?: number; // Custom drag/sort ordering for teachers

  // File Upload fields
  isUploadedFile?: boolean;
  fileName?: string;
  fileSize?: number; // in bytes
  fileSizeFormatted?: string; // e.g. "3.4 MB"
  fileType?: 'pdf' | 'word' | 'powerpoint' | 'excel' | 'image' | 'video' | 'audio' | 'archive' | 'other';
  mimeType?: string;
  storagePath?: string; // Firebase Storage reference path
  author?: string; // Teacher or author name
  grade?: string; // e.g. "Lớp 3", "Lớp 4", "Lớp 5"
}

export interface BannerConfig {
  bgUrl?: string | null;
  posX: number; // Horizontal position: 0% (Left) to 100% (Right), default: 50%
  posY: number; // Vertical position: 0% (Top) to 100% (Bottom), default: 50%
  scale: number; // Scale / Zoom: 80% to 200%, default: 100%
  marginTop: number; // Top spacing in px (0 - 48), default: 0
  marginBottom: number; // Bottom spacing in px (0 - 48), default: 24
}

export const DEFAULT_BANNER_CONFIG: BannerConfig = {
  bgUrl: null,
  posX: 50,
  posY: 50,
  scale: 100,
  marginTop: 0,
  marginBottom: 24,
};

export interface Settings {
  theme: 'light' | 'dark';
  primaryColor: string; // Accent color hex (e.g., "#3B82F6", "#EF4444", "#10B981")
  animationsEnabled: boolean;
  layout: 'grid' | 'list';
  itemsPerPage: number;
  bannerBgUrl?: string | null;
  bannerConfig?: BannerConfig;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-work', name: 'Bài giảng E-Learning', color: '#3B82F6', icon: '📘' }, // Blue
  { id: 'cat-tech', name: 'Tin học', color: '#8B5CF6', icon: '💻' }, // Purple
  { id: 'cat-ai', name: 'AI', color: '#EC4899', icon: '🤖' }, // Pink
  { id: 'cat-video', name: 'Video', color: '#EF4444', icon: '🎬' }, // Red
  { id: 'cat-web', name: 'Website', color: '#F59E0B', icon: '🌐' }, // Yellow
  { id: 'cat-doc', name: 'Tài liệu', color: '#06B6D4', icon: '📄' }, // Cyan
  { id: 'cat-game', name: 'Trò chơi', color: '#10B981', icon: '🎮' }, // Green
];

export const THEME_COLORS = [
  { name: 'Xanh Dương', hex: '#3B82F6' },
  { name: 'Xanh Lá', hex: '#10B981' },
  { name: 'Tím', hex: '#8B5CF6' },
  { name: 'Hồng', hex: '#EC4899' },
  { name: 'Đỏ', hex: '#EF4444' },
  { name: 'Cam', hex: '#F59E0B' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Chàm', hex: '#6366F1' },
];
