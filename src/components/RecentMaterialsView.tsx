import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Search,
  BookOpen,
  Calendar,
  Eye,
  Star,
  Pin,
  Edit2,
  Trash2,
  ExternalLink,
  Plus,
  ArrowLeft,
  X,
  Share2,
  Check,
  EyeOff,
  AlertCircle,
  RefreshCw,
  Folder,
  Loader2,
} from 'lucide-react';
import { LinkItem, Category, Settings } from '../types';
import { isValidUrl } from '../storage';

interface RecentMaterialsViewProps {
  links: LinkItem[];
  categories: Category[];
  role: 'admin' | 'viewer';
  settings: Settings;
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  onOpenLink: (link: LinkItem) => void;
  onEditLink: (link: LinkItem) => void;
  onDeleteLink: (link: LinkItem) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePinned: (id: string) => void;
  onAddToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onAddNewLink?: () => void;
  onBackToPortal?: () => void;
}

const RESOURCE_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  video: { label: 'Video', icon: '🎥' },
  lecture: { label: 'Bài giảng', icon: '📖' },
  game: { label: 'Trò chơi', icon: '🎮' },
  exercise: { label: 'Bài tập', icon: '📝' },
  website: { label: 'Website', icon: '🌐' },
  software: { label: 'Phần mềm', icon: '💻' },
};

const GRADE_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  tinhoc3: { label: 'Tin học 3', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800/40' },
  tinhoc4: { label: 'Tin học 4', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800/40' },
  tinhoc5: { label: 'Tin học 5', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800/40' },
};

export const RecentMaterialsView: React.FC<RecentMaterialsViewProps> = ({
  links,
  categories,
  role,
  settings,
  isLoading = false,
  hasError = false,
  onRetry,
  onOpenLink,
  onEditLink,
  onDeleteLink,
  onToggleFavorite,
  onTogglePinned,
  onAddToast,
  onAddNewLink,
  onBackToPortal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<'all' | 'tinhoc3' | 'tinhoc4' | 'tinhoc5'>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isAdmin = role === 'admin';

  // Category lookup helper map
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  // Sort links strictly by createdAt DESC (newest first), fallback to updatedAt
  const allSortedRecentLinks = useMemo(() => {
    const visibleLinks = links.filter((l) => isAdmin || !l.isHidden);
    return [...visibleLinks].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
      const validA = !isNaN(timeA) ? timeA : 0;
      const validB = !isNaN(timeB) ? timeB : 0;
      if (validB !== validA) {
        return validB - validA;
      }
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [links, isAdmin]);

  // Filter sorted links by grade, category & search query
  const filteredLinks = useMemo(() => {
    let result = allSortedRecentLinks;

    // Grade filter
    if (selectedGradeFilter !== 'all') {
      result = result.filter((l) => l.subCategoryId === selectedGradeFilter);
    }

    // Category filter
    if (selectedCategoryFilter !== 'all') {
      result = result.filter((l) => l.categoryId === selectedCategoryFilter);
    }

    // Search query
    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      result = result.filter((item) => {
        const catName = categoryMap.get(item.categoryId)?.name || '';
        const titleMatch = item.title?.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        const notesMatch = item.notes?.toLowerCase().includes(query);
        const lessonMatch = item.lesson?.toLowerCase().includes(query);
        const topicMatch = item.topic?.toLowerCase().includes(query);
        const keywordsMatch = item.keywords?.toLowerCase().includes(query);
        const catMatch = catName.toLowerCase().includes(query);
        const subCatMatch = item.subCategoryId && item.subCategoryId.toLowerCase().includes(query);
        return (
          titleMatch ||
          descMatch ||
          notesMatch ||
          lessonMatch ||
          topicMatch ||
          keywordsMatch ||
          catMatch ||
          subCatMatch
        );
      });
    }

    return result;
  }, [allSortedRecentLinks, selectedGradeFilter, selectedCategoryFilter, searchTerm, categoryMap]);

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Gần đây';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return 'Gần đây';
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return 'Gần đây';
    }
  };

  const handleCopyLink = (link: LinkItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!link.url || !isValidUrl(link.url)) {
      onAddToast('Liên kết học liệu chưa được cấu hình.', 'error');
      return;
    }
    navigator.clipboard.writeText(link.url);
    setCopiedId(link.id);
    onAddToast('Đã sao chép liên kết vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpen = (link: LinkItem) => {
    const rawUrl = link?.url?.trim();
    if (!rawUrl || !isValidUrl(rawUrl)) {
      onAddToast('Liên kết học liệu chưa được cấu hình.', 'error');
      return;
    }
    onOpenLink(link);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="new-materials-page">
      {/* Top Header: Back Button & Page Title Banner */}
      <div className="relative rounded-2xl overflow-hidden shadow-sm bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 md:p-8 text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {onBackToPortal && (
                <button
                  onClick={onBackToPortal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 backdrop-blur-md text-white text-xs font-bold transition-all cursor-pointer border border-white/25 shadow-xs"
                  id="btn-back-to-dashboard"
                  title="Quay lại Dashboard / Trang trước"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>QUAY LẠI</span>
                </button>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-extrabold shadow-inner">
                <Sparkles className="w-3 h-3 text-amber-200 fill-amber-200" />
                MỚI CẬP NHẬT
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <span>🆕 HỌC LIỆU MỚI</span>
            </h1>
            <p className="text-sm text-amber-50/95 max-w-2xl font-medium">
              Khám phá những học liệu mới được cập nhật gần đây.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && onAddNewLink && (
              <button
                onClick={onAddNewLink}
                className="px-4 py-2.5 rounded-xl bg-white text-orange-600 hover:bg-amber-50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                id="btn-add-new-recent"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm học liệu mới</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-white/70 dark:bg-zinc-900/70 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Tìm kiếm học liệu mới..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 shadow-2xs"
              id="search-recent-materials"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Grade Level Filters: [Tất cả] [Tin học 3] [Tin học 4] [Tin học 5] */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0">
            <button
              onClick={() => setSelectedGradeFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedGradeFilter === 'all'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
              id="filter-grade-all"
            >
              Tất cả ({allSortedRecentLinks.length})
            </button>

            <button
              onClick={() => setSelectedGradeFilter('tinhoc3')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                selectedGradeFilter === 'tinhoc3'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
              }`}
              id="filter-grade-tinhoc3"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Tin học 3</span>
              <span className="text-[10px] opacity-80">
                ({allSortedRecentLinks.filter((l) => l.subCategoryId === 'tinhoc3').length})
              </span>
            </button>

            <button
              onClick={() => setSelectedGradeFilter('tinhoc4')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                selectedGradeFilter === 'tinhoc4'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
              id="filter-grade-tinhoc4"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Tin học 4</span>
              <span className="text-[10px] opacity-80">
                ({allSortedRecentLinks.filter((l) => l.subCategoryId === 'tinhoc4').length})
              </span>
            </button>

            <button
              onClick={() => setSelectedGradeFilter('tinhoc5')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                selectedGradeFilter === 'tinhoc5'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              }`}
              id="filter-grade-tinhoc5"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Tin học 5</span>
              <span className="text-[10px] opacity-80">
                ({allSortedRecentLinks.filter((l) => l.subCategoryId === 'tinhoc5').length})
              </span>
            </button>
          </div>
        </div>

        {/* Secondary Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none border-t border-zinc-100 dark:border-zinc-800/80">
          <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
            Danh mục:
          </span>
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
              selectedCategoryFilter === 'all'
                ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 font-bold shadow-2xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Tất cả danh mục
          </button>
          {categories.map((cat) => {
            const count = allSortedRecentLinks.filter((l) => l.categoryId === cat.id).length;
            if (count === 0 && selectedCategoryFilter !== cat.id) return null;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 font-bold shadow-2xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header Info */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
        <div className="flex items-center gap-2">
          <span>
            Hiển thị <strong className="text-zinc-800 dark:text-zinc-200 font-bold">{filteredLinks.length}</strong> học liệu mới nhất
          </span>
          {searchTerm && (
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              (kết quả cho &quot;{searchTerm}&quot;)
            </span>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-20 px-4 bg-white/40 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center mb-3">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            Đang tải học liệu mới...
          </p>
        </div>
      ) : hasError ? (
        /* Error State */
        <div className="text-center py-16 px-4 bg-rose-500/5 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/40">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center mb-4 shadow-inner">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1">
            Không thể tải học liệu mới. Vui lòng thử lại.
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-5">
            Đã xảy ra sự cố trong quá trình đồng bộ dữ liệu. Bạn có thể nhấn nút bên dưới để thử tải lại.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử lại</span>
            </button>
          )}
        </div>
      ) : allSortedRecentLinks.length === 0 ? (
        /* Total Empty State */
        <div className="text-center py-16 px-4 bg-white/40 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center mb-4 shadow-inner text-2xl">
            🆕
          </div>
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1">
            Chưa có học liệu mới
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-5">
            Những học liệu được thêm gần đây sẽ xuất hiện tại đây.
          </p>
          {isAdmin && onAddNewLink && (
            <button
              onClick={onAddNewLink}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm học liệu đầu tiên</span>
            </button>
          )}
        </div>
      ) : filteredLinks.length === 0 ? (
        /* Search/Filter Empty State */
        <div className="text-center py-16 px-4 bg-white/40 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center mb-4 shadow-inner">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1">
            Không tìm thấy học liệu phù hợp.
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-4">
            Vui lòng thử tìm với từ khóa khác hoặc xóa bộ lọc để xem toàn bộ danh sách.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedGradeFilter('all');
              setSelectedCategoryFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>Xóa bộ lọc</span>
          </button>
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" id="recent-materials-grid">
          {filteredLinks.map((item, index) => {
            const category = categoryMap.get(item.categoryId);
            const gradeInfo = item.subCategoryId ? GRADE_MAP[item.subCategoryId] : null;
            const resourceInfo = item.resourceType ? RESOURCE_TYPE_LABELS[item.resourceType] : null;
            const cardAccentColor = item.color || category?.color || settings.primaryColor;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: settings.animationsEnabled ? 0.25 : 0, delay: index * 0.025 }}
                className="group relative flex flex-col bg-white dark:bg-zinc-850 rounded-2xl p-4.5 border border-zinc-200/80 dark:border-zinc-750/70 shadow-sm hover:shadow-lg hover:border-amber-400/40 dark:hover:border-amber-500/40 transition-all duration-300 overflow-hidden"
                id={`recent-card-${item.id}`}
              >
                {/* Top Accent Strip */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: cardAccentColor }}
                />

                {/* Card Header: Badges & Actions */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* NEW Badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-xs">
                      <Sparkles className="w-2.5 h-2.5" />
                      MỚI
                    </span>

                    {/* Hidden Badge for Admin */}
                    {item.isHidden && isAdmin && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                        <EyeOff className="w-2.5 h-2.5" />
                        Ẩn
                      </span>
                    )}

                    {/* Grade Level Badge */}
                    {gradeInfo && (
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${gradeInfo.bg} ${gradeInfo.color} ${gradeInfo.border}`}>
                        {gradeInfo.label}
                      </span>
                    )}

                    {/* Resource Type Badge */}
                    {resourceInfo && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-700">
                        {resourceInfo.icon} {resourceInfo.label}
                      </span>
                    )}
                  </div>

                  {/* Top Right Quick Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleCopyLink(item, e)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
                      title="Sao chép liên kết"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => onToggleFavorite(item.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            item.isFavorite
                              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
                              : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-750'
                          }`}
                          title={item.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
                        >
                          <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-500' : ''}`} />
                        </button>

                        <button
                          onClick={() => onTogglePinned(item.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            item.isPinned
                              ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/30'
                              : 'text-zinc-400 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-750'
                          }`}
                          title={item.isPinned ? 'Bỏ ghim' : 'Ghim'}
                        >
                          <Pin className={`w-3.5 h-3.5 ${item.isPinned ? 'fill-blue-500' : ''}`} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Main: Icon/Favicon + Title */}
                <div className="flex items-start gap-3 mb-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs border border-black/5 dark:border-white/10 overflow-hidden"
                    style={{ backgroundColor: `${cardAccentColor}18` }}
                  >
                    {item.favicon ? (
                      <img
                        src={item.favicon}
                        alt=""
                        className="w-6 h-6 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <BookOpen className="w-5 h-5" style={{ color: cardAccentColor }} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3
                      className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug cursor-pointer"
                      onClick={() => handleOpen(item)}
                      title={item.title}
                    >
                      {item.title}
                    </h3>

                    {/* Category and Subcategory/Folder */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {category && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="truncate">{category.name}</span>
                        </span>
                      )}
                      {gradeInfo && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                          <span>•</span>
                          <Folder className="w-3 h-3 text-zinc-400" />
                          <span>{gradeInfo.label}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lesson / Topic Subtitle if present */}
                {(item.lesson || item.topic) && (
                  <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/50 text-[11px] text-zinc-650 dark:text-zinc-350">
                    {item.lesson && <p className="font-semibold truncate">{item.lesson}</p>}
                    {item.topic && <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{item.topic}</p>}
                  </div>
                )}

                {/* Description or Notes */}
                {(item.description || item.notes) && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3 flex-1">
                    {item.description || item.notes}
                  </p>
                )}

                {!item.description && !item.notes && <div className="flex-1" />}

                {/* Card Footer: Metadata (Date & Views) */}
                <div className="flex items-center justify-between pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-450 dark:text-zinc-500 mb-3">
                  <div className="flex items-center gap-1" title="Thời gian cập nhật / thêm">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Cập nhật: {formatDate(item.createdAt || item.updatedAt)}</span>
                  </div>

                  <div className="flex items-center gap-1" title="Lượt xem">
                    <Eye className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{item.viewsCount || 0} lượt</span>
                  </div>
                </div>

                {/* Prominent Action Button: "MỞ HỌC LIỆU" */}
                <button
                  onClick={() => handleOpen(item)}
                  style={{ backgroundColor: settings.primaryColor }}
                  className="w-full py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-sm hover:shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id={`btn-open-recent-${item.id}`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>MỞ HỌC LIỆU</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>

                {/* Admin Management Toolbar */}
                {isAdmin && (
                  <div className="flex items-center justify-end gap-1 pt-2 mt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={() => onEditLink(item)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Chỉnh sửa học liệu"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => onDeleteLink(item)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Xóa học liệu"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa</span>
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
