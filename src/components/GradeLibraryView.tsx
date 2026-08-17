import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  QrCode,
  Eye,
  Star,
  Pin,
  Sparkles,
  BookOpen,
  FolderOpen,
  Plus,
  ArrowUpDown,
  Grid,
  List,
  EyeOff,
  Layers,
  HelpCircle,
  X,
} from 'lucide-react';
import { LinkItem, Category, Settings } from '../types';
import { normalizeVietnamese, isValidUrl } from '../storage';

interface GradeLibraryViewProps {
  grade: 'tinhoc3' | 'tinhoc4' | 'tinhoc5';
  links: LinkItem[];
  category?: Category;
  role: 'admin' | 'viewer';
  settings: Settings;
  onBack: () => void;
  onOpenLink: (link: LinkItem) => void;
  onEditLink: (link: LinkItem) => void;
  onDeleteLink: (link: LinkItem) => void;
  onAddLink: () => void;
  onToggleFavorite: (id: string) => void;
  onTogglePinned: (id: string) => void;
  onAddToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const GRADE_CONFIGS = {
  tinhoc3: {
    gradeNum: 3,
    title: 'THƯ VIỆN HỌC LIỆU TIN HỌC 3',
    subtitle: 'Khám phá các bài giảng E-Learning môn Tin học lớp 3.',
    icon: '💻',
    bookIcon: '📘',
    colorName: 'Xanh da trời',
    primaryHex: '#0284c7',
    gradientBg: 'from-blue-600 via-sky-600 to-indigo-600',
    lightCardBg: 'from-blue-500/10 via-sky-500/5 to-indigo-500/10 hover:from-blue-500/15 hover:to-sky-500/15',
    borderColor: 'border-blue-200/80 dark:border-blue-800/40 hover:border-blue-500',
    textColor: 'text-blue-600 dark:text-blue-400',
    badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    btnGradient: 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-blue-500/25',
    emptyMessage: 'Hiện chưa có bài giảng E-Learning cho Tin học 3.',
  },
  tinhoc4: {
    gradeNum: 4,
    title: 'THƯ VIỆN HỌC LIỆU TIN HỌC 4',
    subtitle: 'Khám phá các bài giảng E-Learning môn Tin học lớp 4.',
    icon: '💻',
    bookIcon: '📗',
    colorName: 'Xanh ngọc',
    primaryHex: '#059669',
    gradientBg: 'from-emerald-600 via-teal-600 to-green-600',
    lightCardBg: 'from-emerald-500/10 via-teal-500/5 to-emerald-600/10 hover:from-emerald-500/15 hover:to-teal-500/15',
    borderColor: 'border-emerald-200/80 dark:border-emerald-800/40 hover:border-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    btnGradient: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25',
    emptyMessage: 'Hiện chưa có bài giảng E-Learning cho Tin học 4.',
  },
  tinhoc5: {
    gradeNum: 5,
    title: 'THƯ VIỆN HỌC LIỆU TIN HỌC 5',
    subtitle: 'Khám phá các bài giảng E-Learning môn Tin học lớp 5.',
    icon: '💻',
    bookIcon: '📙',
    colorName: 'Vàng cam',
    primaryHex: '#d97706',
    gradientBg: 'from-amber-600 via-orange-600 to-amber-700',
    lightCardBg: 'from-amber-500/10 via-orange-500/5 to-amber-600/10 hover:from-amber-500/15 hover:to-orange-500/15',
    borderColor: 'border-amber-200/80 dark:border-amber-800/40 hover:border-amber-500',
    textColor: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    btnGradient: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-500/25',
    emptyMessage: 'Hiện chưa có bài giảng E-Learning cho Tin học 5.',
  },
};

const RESOURCE_TYPE_MAP = {
  video: { label: 'Video bài học', emoji: '🎥', color: 'text-red-600 bg-red-500/10 border-red-200 dark:border-red-950/40' },
  lecture: { label: 'Bài giảng', emoji: '📖', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200 dark:border-emerald-950/40' },
  game: { label: 'Trò chơi học tập', emoji: '🎮', color: 'text-amber-600 bg-amber-500/10 border-amber-200 dark:border-amber-950/40' },
  exercise: { label: 'Bài tập', emoji: '📝', color: 'text-purple-600 bg-purple-500/10 border-purple-200 dark:border-purple-950/40' },
  website: { label: 'Website học tập', emoji: '🌐', color: 'text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-950/40' },
  software: { label: 'Phần mềm', emoji: '💻', color: 'text-indigo-600 bg-indigo-500/10 border-indigo-200 dark:border-indigo-950/40' },
} as const;

export const GradeLibraryView: React.FC<GradeLibraryViewProps> = ({
  grade,
  links,
  category,
  role,
  settings,
  onBack,
  onOpenLink,
  onEditLink,
  onDeleteLink,
  onAddLink,
  onToggleFavorite,
  onTogglePinned,
  onAddToast,
}) => {
  const config = GRADE_CONFIGS[grade];
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'titleAZ' | 'titleZA' | 'viewsCount'>('createdAt');
  const [activeQrModalId, setActiveQrModalId] = useState<string | null>(null);

  // Filter links for this specific grade
  const gradeLinks = useMemo(() => {
    let list = links.filter((link) => {
      // Must match this grade
      const matchGrade = 
        link.subCategoryId === grade ||
        (grade === 'tinhoc3' && (link.url?.includes('lop-3') || link.title?.toLowerCase().includes('lớp 3') || link.title?.toLowerCase().includes('lop 3') || link.lesson?.toLowerCase().includes('lớp 3'))) ||
        (grade === 'tinhoc4' && (link.url?.includes('lop-4') || link.title?.toLowerCase().includes('lớp 4') || link.title?.toLowerCase().includes('lop 4') || link.lesson?.toLowerCase().includes('lớp 4'))) ||
        (grade === 'tinhoc5' && (link.url?.includes('lop-5') || link.title?.toLowerCase().includes('lớp 5') || link.title?.toLowerCase().includes('lop 5') || link.lesson?.toLowerCase().includes('lớp 5')));
        
      if (!matchGrade) return false;
      // Filter out hidden if viewer
      if (role !== 'admin' && link.isHidden) return false;
      return true;
    });

    // Multi-attribute search filter with Vietnamese accent support
    if (searchQuery.trim()) {
      const rawQ = searchQuery.toLowerCase().trim();
      const normQ = normalizeVietnamese(searchQuery);
      const queryWords = normQ.split(/\s+/).filter(Boolean);
      const rawWords = rawQ.split(/\s+/).filter(Boolean);

      const categoryName = category?.name || 'Bài giảng E-Learning';
      const gradeAlias = `Tin học ${config.gradeNum} Lớp ${config.gradeNum} Khối ${config.gradeNum} grade ${config.gradeNum}`;

      list = list.filter((l) => {
        const resourceTypeInfo = l.resourceType && RESOURCE_TYPE_MAP[l.resourceType] ? RESOURCE_TYPE_MAP[l.resourceType].label : '';

        // Combine all searchable attributes
        const searchableRaw = [
          l.title,
          l.description,
          l.url,
          categoryName,
          gradeAlias,
          l.lesson,
          l.topic,
          l.keywords,
          l.notes,
          resourceTypeInfo,
        ].filter(Boolean).join(' ').toLowerCase();

        const searchableNorm = normalizeVietnamese(searchableRaw);

        return (
          searchableRaw.includes(rawQ) ||
          searchableNorm.includes(normQ) ||
          queryWords.every((w) => searchableNorm.includes(w)) ||
          rawWords.every((w) => searchableRaw.includes(w))
        );
      });
    }

    // Sort links
    list.sort((a, b) => {
      if (sortBy === 'viewsCount') {
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      }
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'createdAt') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'updatedAt') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === 'titleAZ') {
        return a.title.localeCompare(b.title, 'vi');
      }
      if (sortBy === 'titleZA') {
        return b.title.localeCompare(a.title, 'vi');
      }
      return 0;
    });

    return list;
  }, [links, grade, role, searchQuery, sortBy, category, config.gradeNum]);

  const handleCopy = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (!url || !isValidUrl(url)) {
      onAddToast('Liên kết bài giảng chưa được cấu hình.', 'error');
      return;
    }
    navigator.clipboard.writeText(url);
    onAddToast('Đã sao chép liên kết vào bộ nhớ tạm!', 'success');
  };

  const handleOpenCardLink = (e: React.MouseEvent, link: LinkItem) => {
    e.stopPropagation();
    const rawUrl = link?.url?.trim();
    if (!rawUrl || !isValidUrl(rawUrl)) {
      onAddToast('Liên kết bài giảng chưa được cấu hình.', 'error');
      return;
    }
    onOpenLink(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in" id={`grade-library-${grade}`}>
      {/* TOP NAVIGATION / BREADCRUMB BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 glass-panel p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 text-xs md:text-sm font-bold border border-zinc-200/80 dark:border-zinc-700 shadow-sm hover:shadow transition-all cursor-pointer group shrink-0"
            id="btn-back-to-portal"
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            <span>← Quay lại Cổng học liệu</span>
          </button>

          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500">
            <span>Cổng học liệu</span>
            <span>/</span>
            <span>Bài giảng E-Learning</span>
            <span>/</span>
            <span className={config.textColor}>{config.bookIcon} Tin học {config.gradeNum}</span>
          </div>
        </div>

        {/* Quick actions on the right */}
        <div className="flex items-center gap-2">
          {role === 'admin' && (
            <button
              onClick={onAddLink}
              style={{ backgroundColor: config.primaryHex }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
              id={`btn-add-link-grade-${grade}`}
            >
              <Plus className="w-4 h-4" />
              <span>Thêm bài giảng lớp {config.gradeNum}</span>
            </button>
          )}
        </div>
      </div>

      {/* GRADE HERO BANNER */}
      <div
        className={`relative rounded-[24px] overflow-hidden shadow-lg border ${config.borderColor} bg-gradient-to-r ${config.gradientBg} text-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all`}
        id={`banner-grade-${grade}`}
      >
        {/* Subtle decorative background light & grid */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:20px_20px]" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl" />
        </div>

        {/* Banner Left Info */}
        <div className="relative z-10 space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-extrabold shadow-sm">
            <span>{config.icon}</span>
            <span>BÀI GIẢNG E-LEARNING LỚP {config.gradeNum}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white drop-shadow-md">
            {config.title}
          </h1>
          <p className="text-sm sm:text-base font-medium text-white/90 max-w-2xl drop-shadow-sm">
            {config.subtitle}
          </p>
        </div>

        {/* Banner Right Badge counter */}
        <div className="relative z-10 flex flex-col items-center justify-center p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-md shrink-0 min-w-[140px]">
          <span className="text-3xl sm:text-4xl font-black text-white">{gradeLinks.length}</span>
          <span className="text-xs font-bold text-white/90 uppercase tracking-wider mt-0.5">
            Bài giảng số
          </span>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3.5 glass-panel p-4 rounded-2xl shadow-sm">
        {/* Search within this grade */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Tìm kiếm bài giảng Tin học ${config.gradeNum}...`}
            className="w-full pl-10 pr-9 h-10 text-xs sm:text-sm glass-input rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent)]/20 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all shadow-2xs"
            id="search-input-grade-library"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              title="Xóa tìm kiếm"
              id="btn-clear-search-grade-input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter count & Sorting dropdown */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Hiển thị <strong className="text-zinc-900 dark:text-white font-bold">{gradeLinks.length}</strong> bài học
          </span>

          <div className="flex items-center gap-1.5 bg-white/40 dark:bg-zinc-800/50 px-3 py-2 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-bold bg-transparent text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
              id="sort-select-grade-library"
            >
              <option value="createdAt" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-slate-100">Mới nhất</option>
              <option value="updatedAt" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-slate-100">Mới cập nhật</option>
              <option value="titleAZ" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-slate-100">Tên bài (A → Z)</option>
              <option value="titleZA" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-slate-100">Tên bài (Z → A)</option>
              <option value="viewsCount" className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-slate-100">Lượt xem nhiều nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* CONTENT: EMPTY STATE OR CARDS GRID */}
      {gradeLinks.length === 0 ? (
        /* Empty State: Handle both Search empty and Total empty */
        searchQuery.trim() ? (
          <div className="p-12 text-center glass-panel rounded-3xl border border-zinc-200/60 dark:border-zinc-800 shadow-sm space-y-4 my-8 animate-fade-in" id="search-empty-state">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center text-4xl shadow-inner border border-amber-100 dark:border-amber-900">
              🔍
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                Không tìm thấy bài giảng phù hợp.
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                Không tìm thấy kết quả nào khớp với từ khóa <span className="font-bold text-zinc-800 dark:text-zinc-200">"{searchQuery}"</span>. Vui lòng thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setSearchQuery('')}
                className="px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                id="btn-clear-search-grade"
              >
                <X className="w-4 h-4" />
                <span>Xóa từ khóa tìm kiếm</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center glass-panel rounded-3xl border border-zinc-200/60 dark:border-zinc-800 shadow-sm space-y-4 my-8 animate-fade-in" id="library-empty-state">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center text-4xl shadow-inner border border-blue-100 dark:border-blue-900">
              📚
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                Chưa có học liệu
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                {config.emptyMessage}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs transition-all cursor-pointer"
              >
                ← Quay lại Cổng học liệu
              </button>
              {role === 'admin' && (
                <button
                  onClick={onAddLink}
                  style={{ backgroundColor: config.primaryHex }}
                  className="px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm bài giảng ngay</span>
                </button>
              )}
            </div>
          </div>
        )
      ) : (
        /* Links Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {gradeLinks.map((link, index) => {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(link.url || '')}`;
            const isQrOpen = activeQrModalId === link.id;

            return (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.35 }}
                className={`group relative rounded-[22px] glass-card p-5 shadow-sm hover:shadow-xl hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden border ${config.borderColor} transition-all duration-300 ${
                  link.isHidden ? 'opacity-70 bg-rose-50/50 dark:bg-rose-950/10 border-rose-400' : ''
                }`}
                id={`grade-link-card-${link.id}`}
              >
                {/* Top Accent Color Line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[4px]"
                  style={{ backgroundColor: link.color || config.primaryHex }}
                />

                {/* Cover Image / Thumbnail Preview */}
                {link.imageUrl ? (
                  <div
                    onClick={(e) => handleOpenCardLink(e, link)}
                    className="relative w-full h-36 mt-1 mb-3 rounded-2xl overflow-hidden cursor-pointer group-hover:opacity-95 transition-all border border-zinc-150 dark:border-zinc-800 shadow-sm shrink-0 bg-zinc-100 dark:bg-zinc-800"
                  >
                    <img
                      src={link.imageUrl}
                      alt={link.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    {link.isHidden && (
                      <div className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
                        <EyeOff className="w-2.5 h-2.5" /> Bị ẩn
                      </div>
                    )}
                  </div>
                ) : (
                  /* Fallback friendly lesson banner */
                  <div
                    onClick={(e) => handleOpenCardLink(e, link)}
                    className={`relative w-full h-24 mt-1 mb-3 rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all border border-zinc-200/50 dark:border-zinc-700/40 shadow-2xs shrink-0 bg-gradient-to-br ${config.lightCardBg}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-2xl border border-zinc-200/60 dark:border-zinc-700">
                        {config.icon}
                      </div>
                      <div>
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${config.badgeClass}`}>
                          Tin học {config.gradeNum}
                        </span>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1 mt-1">
                          {link.lesson || `Bài học Tin học ${config.gradeNum}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card Main Information */}
                <div className="space-y-3 flex-1 flex flex-col justify-start">
                  {/* Title & Favicon */}
                  <div className="flex items-start gap-2.5">
                    <img
                      src={link.favicon}
                      alt=""
                      className="w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-700 object-contain p-1 bg-white shrink-0 shadow-2xs mt-0.5"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?sz=64&domain=google.com';
                      }}
                    />
                    <div className="overflow-hidden flex-1">
                      <h3
                        onClick={(e) => handleOpenCardLink(e, link)}
                        className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors line-clamp-2 leading-snug"
                        title={link.title}
                      >
                        {link.title}
                      </h3>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate max-w-[180px] font-mono mt-0.5">
                        {(link.url || '').replace(/(^\w+:|^)\/\//, '')}
                      </p>
                    </div>
                  </div>

                  {/* Lesson or Topic badges if defined */}
                  {(link.lesson || link.topic) && (
                    <div className="flex flex-col gap-1 text-[11px] bg-slate-100/60 dark:bg-slate-800/40 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-700/40">
                      {link.lesson && (
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate">
                          📚 {link.lesson}
                        </span>
                      )}
                      {link.topic && (
                        <span className="text-zinc-500 dark:text-zinc-400 truncate text-[10px] font-medium">
                          📍 Chủ đề: {link.topic}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Description text */}
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {link.description || <span className="text-zinc-300 dark:text-zinc-600 italic">Bài giảng E-Learning môn Tin học</span>}
                  </p>

                  {/* Meta Tags / Resource Type & Views */}
                  <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-2.5 mt-auto">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${config.badgeClass}`}>
                        {config.bookIcon} Lớp {config.gradeNum}
                      </span>

                      {link.resourceType && RESOURCE_TYPE_MAP[link.resourceType] && (
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${RESOURCE_TYPE_MAP[link.resourceType].color}`}>
                          {RESOURCE_TYPE_MAP[link.resourceType].emoji} {RESOURCE_TYPE_MAP[link.resourceType].label}
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 shrink-0 font-medium">
                      <Eye className="w-3.5 h-3.5" />
                      {link.viewsCount || 0}
                    </span>
                  </div>
                </div>

                {/* CARD ACTION BUTTONS */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
                  {/* Big Prominent "MỞ BÀI GIẢNG" Button */}
                  <button
                    onClick={(e) => handleOpenCardLink(e, link)}
                    className={`w-full py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${config.btnGradient}`}
                    id={`btn-open-lesson-${link.id}`}
                  >
                    <span>▶ MỞ BÀI GIẢNG</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  {/* Secondary Tools: Copy, QR, Edit, Delete */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleCopy(e, link.url)}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-blue-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Sao chép liên kết"
                        id={`btn-copy-${link.id}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setActiveQrModalId(isQrOpen ? null : link.id)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          isQrOpen
                            ? 'text-purple-600 border-purple-300 bg-purple-50 dark:bg-purple-950/40'
                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-purple-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                        title="Mã QR liên kết"
                        id={`btn-qr-${link.id}`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {role === 'admin' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditLink(link)}
                          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Sửa bài giảng"
                          id={`btn-edit-${link.id}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteLink(link)}
                          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="Xóa bài giảng"
                          id={`btn-delete-${link.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating QR Modal overlay */}
                {isQrOpen && (
                  <div className="absolute inset-0 glass-modal flex flex-col items-center justify-center p-4 z-10 text-center animate-fade-in rounded-2xl">
                    <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-2.5 flex items-center gap-1">
                      <QrCode className="w-4 h-4" />
                      MÃ QR BÀI GIẢNG
                    </p>
                    <img
                      src={qrUrl}
                      alt="QR Code"
                      className="w-28 h-28 rounded-lg border p-1 bg-white shadow-md"
                    />
                    <p className="text-[10px] text-zinc-400 truncate max-w-[180px] mt-2 mb-3">{link.url}</p>
                    <button
                      onClick={() => setActiveQrModalId(null)}
                      className="px-4 py-1 text-[10px] font-bold rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 transition-colors cursor-pointer"
                    >
                      Đóng lại
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
