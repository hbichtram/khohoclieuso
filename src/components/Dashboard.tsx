import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  Globe,
  Star,
  Layers,
  Sparkles,
  TrendingUp,
  ExternalLink,
  Flame,
  BookOpen,
  FolderTree,
  FileText,
  Video,
  Gamepad2,
  Cpu,
  Monitor,
  Pin,
  FolderOpen,
  ArrowRight,
  Eye,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { LinkItem, Category, Settings } from '../types';

interface DashboardProps {
  links: LinkItem[];
  tinhoc3Links?: LinkItem[];
  tinhoc4Links?: LinkItem[];
  tinhoc5Links?: LinkItem[];
  categories: Category[];
  role?: 'admin' | 'viewer';
  settings?: Settings;
  onOpenLink: (link: LinkItem) => void;
  onNavigateGrade?: (grade: 'tinhoc3' | 'tinhoc4' | 'tinhoc5') => void;
  onNavigateCategory?: (categoryId: string) => void;
  onBackToPortal?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  links,
  tinhoc3Links = [],
  tinhoc4Links = [],
  tinhoc5Links = [],
  categories,
  role = 'viewer',
  settings,
  onOpenLink,
  onNavigateGrade,
  onNavigateCategory,
  onBackToPortal,
}) => {
  // Combine all active links ensuring no duplicates by ID
  const allLinks = useMemo(() => {
    const map = new Map<string, LinkItem>();
    
    // Add all links passed in
    links.forEach((l) => {
      if (l && l.id) map.set(l.id, l);
    });
    tinhoc3Links.forEach((l) => {
      if (l && l.id) map.set(l.id, { ...l, subCategoryId: 'tinhoc3' });
    });
    tinhoc4Links.forEach((l) => {
      if (l && l.id) map.set(l.id, { ...l, subCategoryId: 'tinhoc4' });
    });
    tinhoc5Links.forEach((l) => {
      if (l && l.id) map.set(l.id, { ...l, subCategoryId: 'tinhoc5' });
    });

    const combined = Array.from(map.values());
    if (role !== 'admin') {
      return combined.filter((l) => !l.isHidden);
    }
    return combined;
  }, [links, tinhoc3Links, tinhoc4Links, tinhoc5Links, role]);

  // Overall counts
  const totalLinks = allLinks.length;
  const totalCategories = categories.length;
  const favoriteCount = allLinks.filter((l) => l.isFavorite).length;
  const pinnedCount = allLinks.filter((l) => l.isPinned).length;
  const totalViews = allLinks.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0);

  // Grade level links calculation
  const grade3List = useMemo(() => {
    return allLinks.filter(
      (l) =>
        l.subCategoryId === 'tinhoc3' ||
        (l.url?.includes('lop-3') || l.title?.toLowerCase().includes('lớp 3') || l.lesson?.toLowerCase().includes('lớp 3'))
    );
  }, [allLinks]);

  const grade4List = useMemo(() => {
    return allLinks.filter(
      (l) =>
        l.subCategoryId === 'tinhoc4' ||
        (l.url?.includes('lop-4') || l.title?.toLowerCase().includes('lớp 4') || l.lesson?.toLowerCase().includes('lớp 4'))
    );
  }, [allLinks]);

  const grade5List = useMemo(() => {
    return allLinks.filter(
      (l) =>
        l.subCategoryId === 'tinhoc5' ||
        (l.url?.includes('lop-5') || l.title?.toLowerCase().includes('lớp 5') || l.lesson?.toLowerCase().includes('lớp 5'))
    );
  }, [allLinks]);

  const grade3Count = grade3List.length;
  const grade4Count = grade4List.length;
  const grade5Count = grade5List.length;
  const totalGradeLinks = grade3Count + grade4Count + grade5Count;

  // Grade views count
  const grade3Views = grade3List.reduce((acc, l) => acc + (l.viewsCount || 0), 0);
  const grade4Views = grade4List.reduce((acc, l) => acc + (l.viewsCount || 0), 0);
  const grade5Views = grade5List.reduce((acc, l) => acc + (l.viewsCount || 0), 0);

  // Group links by Category to construct data
  const categoryStats = useMemo(() => {
    return categories.map((cat) => {
      let count = 0;
      let views = 0;

      allLinks.forEach((l) => {
        // E-Learning includes subcategories or specific categoryId
        const isElearningCat =
          cat.id === 'cat-work' ||
          cat.name.toLowerCase().includes('e-learning') ||
          cat.name.toLowerCase().includes('bài giảng');

        if (isElearningCat) {
          if (l.categoryId === cat.id || l.subCategoryId === 'tinhoc3' || l.subCategoryId === 'tinhoc4' || l.subCategoryId === 'tinhoc5') {
            count++;
            views += (l.viewsCount || 0);
          }
        } else if (l.categoryId === cat.id) {
          count++;
          views += (l.viewsCount || 0);
        }
      });

      const percentage = totalLinks > 0 ? Math.round((count / totalLinks) * 100) : 0;
      return {
        ...cat,
        count,
        views,
        percentage,
      };
    }).sort((a, b) => b.count - a.count);
  }, [categories, allLinks, totalLinks]);

  const maxCategoryCount = Math.max(...categoryStats.map((c) => c.count), 1);

  // Subfolder breakdown (Grade 3, Grade 4, Grade 5 and other topic clusters)
  const subFolderStats = useMemo(() => {
    const folders = [
      {
        id: 'tinhoc3',
        name: 'Tin học 3 (Lớp 3)',
        parent: 'Bài giảng E-Learning',
        count: grade3Count,
        views: grade3Views,
        color: '#3B82F6',
        icon: '📘',
        grade: 'tinhoc3' as const,
      },
      {
        id: 'tinhoc4',
        name: 'Tin học 4 (Lớp 4)',
        parent: 'Bài giảng E-Learning',
        count: grade4Count,
        views: grade4Views,
        color: '#10B981',
        icon: '📗',
        grade: 'tinhoc4' as const,
      },
      {
        id: 'tinhoc5',
        name: 'Tin học 5 (Lớp 5)',
        parent: 'Bài giảng E-Learning',
        count: grade5Count,
        views: grade5Views,
        color: '#F59E0B',
        icon: '📙',
        grade: 'tinhoc5' as const,
      },
    ];

    return folders;
  }, [grade3Count, grade4Count, grade5Count, grade3Views, grade4Views, grade5Views]);

  // Resource Type breakdown (Video, Lecture, Game, Exercise, Software, Website)
  const resourceTypeStats = useMemo(() => {
    const typeMap: Record<string, { label: string; count: number; color: string; icon: any }> = {
      lecture: { label: 'Bài giảng E-Learning', count: 0, color: '#3B82F6', icon: BookOpen },
      video: { label: 'Video bài giảng', count: 0, color: '#EF4444', icon: Video },
      game: { label: 'Trò chơi học tập', count: 0, color: '#EC4899', icon: Gamepad2 },
      exercise: { label: 'Bài tập & Ôn luyện', count: 0, color: '#8B5CF6', icon: FileText },
      software: { label: 'Phần mềm & Ứng dụng', count: 0, color: '#10B981', icon: Monitor },
      website: { label: 'Website tham khảo', count: 0, color: '#F59E0B', icon: Globe },
    };

    allLinks.forEach((l) => {
      if (l.resourceType && typeMap[l.resourceType]) {
        typeMap[l.resourceType].count++;
      } else {
        // Fallback deduce by category or url
        if (l.categoryId === 'cat-video' || l.url.includes('youtube') || l.url.includes('youtu.be')) {
          typeMap.video.count++;
        } else if (l.categoryId === 'cat-ent' || l.categoryId === 'cat-game') {
          typeMap.game.count++;
        } else if (l.subCategoryId || l.categoryId === 'cat-work') {
          typeMap.lecture.count++;
        } else if (l.categoryId === 'cat-doc') {
          typeMap.exercise.count++;
        } else {
          typeMap.website.count++;
        }
      }
    });

    return Object.entries(typeMap).map(([key, data]) => ({
      key,
      ...data,
      percentage: totalLinks > 0 ? Math.round((data.count / totalLinks) * 100) : 0,
    }));
  }, [allLinks, totalLinks]);

  // Topic clustering (Topics within grade lessons)
  const topicStats = useMemo(() => {
    const topicsMap = new Map<string, number>();
    allLinks.forEach((l) => {
      if (l.topic && l.topic.trim()) {
        const t = l.topic.trim();
        topicsMap.set(t, (topicsMap.get(t) || 0) + 1);
      }
    });

    return Array.from(topicsMap.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [allLinks]);

  // Calculate top visited links (viewsCount > 0, ordered descending)
  const sortedByViews = useMemo(() => {
    return [...allLinks]
      .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0))
      .slice(0, 6);
  }, [allLinks]);

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-container">
      {/* Top Header info and quick navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100" id="dashboard-title">
                Bảng thống kê học liệu số
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Thống kê số lượng thực tế được đồng bộ trực tiếp từ cơ sở dữ liệu
              </p>
            </div>
          </div>
        </div>

        {onBackToPortal && (
          <button
            onClick={onBackToPortal}
            className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-2xs"
            id="btn-dashboard-back-portal"
          >
            <span>← Cổng học liệu</span>
          </button>
        )}
      </div>

      {/* 1. OVERVIEW STAT CARDS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-overview-grid">
        {/* Total Links Card */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl glass-card border border-blue-200/50 dark:border-blue-900/30 shadow-sm flex items-center justify-between"
          id="stat-card-total-links"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider">
              Tổng số học liệu
            </p>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              {totalLinks}
            </p>
            <p className="text-[10px] text-zinc-400">
              {totalGradeLinks} bài giảng lớp + {totalLinks - totalGradeLinks} liên kết khác
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
            <Globe className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Categories Card */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl glass-card border border-purple-200/50 dark:border-purple-900/30 shadow-sm flex items-center justify-between"
          id="stat-card-total-categories"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider">
              Danh mục học liệu
            </p>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {totalCategories}
            </p>
            <p className="text-[10px] text-zinc-400">
              3 khối lớp & {totalCategories} chủ đề
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Total Views Card */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl glass-card border border-orange-200/50 dark:border-orange-900/30 shadow-sm flex items-center justify-between"
          id="stat-card-total-views"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider">
              Tổng lượt truy cập
            </p>
            <p className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400">
              {totalViews}
            </p>
            <p className="text-[10px] text-zinc-400">
              Lượt xem thực tế
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
            <Flame className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Favorites & Pinned Card */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl glass-card border border-amber-200/50 dark:border-amber-900/30 shadow-sm flex items-center justify-between"
          id="stat-card-favorites-pinned"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider">
              Yêu thích & Đã ghim
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-500">
                {favoriteCount}
              </span>
              <span className="text-xs text-zinc-400">
                / {pinnedCount} ghim
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              Học liệu nổi bật
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <Star className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* 2. GRADE LEVEL BREAKDOWN (TIN HỌC 3, 4, 5) */}
      <div className="space-y-4" id="section-grade-stats">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
              Thống kê học liệu theo Khối Lớp
            </h2>
          </div>
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Tổng cộng {totalGradeLinks} bài giảng
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tin học 3 */}
          <div
            className="glass-panel p-5 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 relative overflow-hidden group hover:shadow-md transition-all flex flex-col justify-between"
            id="grade-stat-card-3"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-bold shadow-inner">
                    📘
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                      Tin học 3
                    </h3>
                    <p className="text-[11px] text-zinc-400">Khối Lớp 3</p>
                  </div>
                </div>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                  {grade3Count} bài giảng
                </span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Lượt truy cập:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{grade3Views} lượt</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Tỷ lệ khối lớp:</span>
                  <span className="font-bold text-blue-600">
                    {totalGradeLinks > 0 ? Math.round((grade3Count / totalGradeLinks) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {onNavigateGrade && (
              <button
                onClick={() => onNavigateGrade('tinhoc3')}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                id="btn-stat-goto-tinhoc3"
              >
                <span>Mở thư viện Lớp 3</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tin học 4 */}
          <div
            className="glass-panel p-5 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 relative overflow-hidden group hover:shadow-md transition-all flex flex-col justify-between"
            id="grade-stat-card-4"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold shadow-inner">
                    📗
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                      Tin học 4
                    </h3>
                    <p className="text-[11px] text-zinc-400">Khối Lớp 4</p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {grade4Count} bài giảng
                </span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Lượt truy cập:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{grade4Views} lượt</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Tỷ lệ khối lớp:</span>
                  <span className="font-bold text-emerald-600">
                    {totalGradeLinks > 0 ? Math.round((grade4Count / totalGradeLinks) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {onNavigateGrade && (
              <button
                onClick={() => onNavigateGrade('tinhoc4')}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                id="btn-stat-goto-tinhoc4"
              >
                <span>Mở thư viện Lớp 4</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tin học 5 */}
          <div
            className="glass-panel p-5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 relative overflow-hidden group hover:shadow-md transition-all flex flex-col justify-between"
            id="grade-stat-card-5"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl font-bold shadow-inner">
                    📙
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                      Tin học 5
                    </h3>
                    <p className="text-[11px] text-zinc-400">Khối Lớp 5</p>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                  {grade5Count} bài giảng
                </span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Lượt truy cập:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{grade5Views} lượt</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Tỷ lệ khối lớp:</span>
                  <span className="font-bold text-amber-600">
                    {totalGradeLinks > 0 ? Math.round((grade5Count / totalGradeLinks) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {onNavigateGrade && (
              <button
                onClick={() => onNavigateGrade('tinhoc5')}
                className="mt-4 w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                id="btn-stat-goto-tinhoc5"
              >
                <span>Mở thư viện Lớp 5</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. CATEGORY DISTRIBUTION & SUBFOLDERS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Categories Distribution */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl shadow-sm flex flex-col border border-zinc-200/60 dark:border-zinc-800" id="section-category-stats">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Số lượng theo từng danh mục
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Phân bố học liệu theo các chủ đề chính
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md">
              Tỷ lệ %
            </span>
          </div>

          <div className="flex-1 space-y-4">
            {categoryStats.length === 0 ? (
              <p className="text-xs text-zinc-450 dark:text-zinc-500 text-center py-10">
                Không có dữ liệu danh mục nào.
              </p>
            ) : (
              categoryStats.map((stat, idx) => (
                <div
                  key={stat.id}
                  onClick={() => onNavigateCategory && onNavigateCategory(stat.id)}
                  className={`space-y-1.5 p-2 rounded-xl transition-all ${onNavigateCategory ? 'cursor-pointer hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40' : ''}`}
                  id={`stat-row-${stat.id}`}
                  title={onNavigateCategory ? `Nhấp để xem danh mục ${stat.name}` : undefined}
                >
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: stat.color }}
                      />
                      <span className="font-bold">{stat.name}</span>
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{stat.count}</span> học liệu ({stat.percentage}%)
                    </span>
                  </div>
                  {/* Styled Progress Bar representing distributions */}
                  <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(stat.count / maxCategoryCount) * 100}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.08 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: stat.color }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Subfolder Breakdown and Resource Types */}
        <div className="lg:col-span-5 space-y-6">
          {/* Subfolders summary */}
          <div className="glass-panel p-5 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800" id="section-subfolder-stats">
            <div className="flex items-center gap-2 mb-4">
              <FolderTree className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Thống kê theo Thư mục con
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Số lượng bài giảng trong từng thư mục khối lớp
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {subFolderStats.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => onNavigateGrade && onNavigateGrade(folder.grade)}
                  className={`flex items-center justify-between p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all ${
                    onNavigateGrade ? 'cursor-pointer' : ''
                  }`}
                  id={`subfolder-stat-${folder.id}`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="text-lg">{folder.icon}</span>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                        {folder.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">
                        Thuộc: {folder.parent}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono">
                      {folder.count} bài
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resource Types breakdown */}
          <div className="glass-panel p-5 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800" id="section-resourcetype-stats">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-5 h-5 text-purple-500" />
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Phân loại theo loại học liệu
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Dạng tài nguyên: Video, Trò chơi, Bài giảng,...
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {resourceTypeStats.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.key}
                    className="p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${item.color}15`, color: item.color }}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 font-mono ml-1">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. TOP VISITED & POPULAR LEARNING MATERIALS */}
      <div className="glass-panel p-5 rounded-2xl shadow-sm border border-zinc-200/60 dark:border-zinc-800" id="section-popular-links">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Học liệu & Bài giảng được truy cập nhiều nhất
              </h3>
              <p className="text-[11px] text-zinc-400">
                Xếp hạng theo số lượt xem thực tế
              </p>
            </div>
          </div>
          <span className="text-xs text-orange-600 dark:text-orange-400 font-bold bg-orange-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Flame className="w-3 h-3" /> Top bài học
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedByViews.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center text-center py-10 space-y-2">
              <Sparkles className="w-7 h-7 text-zinc-350 dark:text-zinc-650 animate-pulse" />
              <p className="text-xs text-zinc-450 dark:text-zinc-500">
                Chưa có thống kê truy cập nào. Nhấp mở bài giảng để bắt đầu đếm lượt xem!
              </p>
            </div>
          ) : (
            sortedByViews.map((link, index) => (
              <div
                key={link.id}
                onClick={() => onOpenLink(link)}
                className="group flex items-center justify-between p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-all hover:scale-[1.01]"
                id={`dashboard-popular-${link.id}`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    index === 0 ? 'bg-amber-500 text-white' : index === 1 ? 'bg-zinc-400 text-white' : index === 2 ? 'bg-amber-700 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                  }`}>
                    {index + 1}
                  </span>
                  <img
                    src={link.favicon || 'https://www.google.com/s2/favicons?sz=64&domain=google.com'}
                    alt=""
                    className="w-6 h-6 object-contain rounded-md shrink-0 bg-white p-0.5 border border-zinc-200/50"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?sz=64&domain=google.com';
                    }}
                  />
                  <div className="overflow-hidden flex-1 pr-2">
                    <p className="text-xs font-bold text-zinc-850 dark:text-zinc-150 truncate group-hover:text-blue-500 transition-colors">
                      {link.title}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {link.subCategoryId ? `Tin học ${link.subCategoryId.replace('tinhoc', '')}` : (link.url || '')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-md flex items-center gap-1 font-mono">
                    <Eye className="w-3 h-3" />
                    {link.viewsCount || 0}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
