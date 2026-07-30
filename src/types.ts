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
  resourceType?: 'video' | 'lecture' | 'game' | 'exercise' | 'website' | 'software' | '';
  keywords?: string;
  isHidden?: boolean;
  order?: number; // Custom drag/sort ordering for teachers
}

export interface Settings {
  theme: 'light' | 'dark';
  primaryColor: string; // Accent color hex (e.g., "#3B82F6", "#EF4444", "#10B981")
  animationsEnabled: boolean;
  layout: 'grid' | 'list';
  itemsPerPage: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-work', name: 'Bài giảng E-Learning', color: '#3B82F6' }, // Blue
  { id: 'cat-edu', name: 'Giảng dạy', color: '#10B981' }, // Green
  { id: 'cat-tech', name: 'Tin học', color: '#8B5CF6' }, // Purple
  { id: 'cat-ai', name: 'AI', color: '#EC4899' }, // Pink
  { id: 'cat-video', name: 'Video', color: '#EF4444' }, // Red
  { id: 'cat-web', name: 'Website', color: '#F59E0B' }, // Yellow
  { id: 'cat-doc', name: 'Tài liệu', color: '#06B6D4' }, // Cyan
  { id: 'cat-ent', name: 'Giải trí', color: '#6B7280' }, // Gray
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
