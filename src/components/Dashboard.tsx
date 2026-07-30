import React from 'react';
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
} from 'lucide-react';
import { LinkItem, Category } from '../types';

interface DashboardProps {
  links: LinkItem[];
  categories: Category[];
  onOpenLink: (link: LinkItem) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ links, categories, onOpenLink }) => {
  const totalLinks = links.length;
  const totalCategories = categories.length;
  const favoriteCount = links.filter((l) => l.isFavorite).length;
  const pinnedCount = links.filter((l) => l.isPinned).length;

  // Calculate most visited links (viewsCount > 0, ordered descending)
  const sortedByViews = [...links]
    .filter((l) => l.viewsCount > 0)
    .sort((a, b) => b.viewsCount - a.viewsCount)
    .slice(0, 5);

  // Group links by Category to construct data
  const categoryStats = categories.map((cat) => {
    const count = links.filter((l) => l.categoryId === cat.id).length;
    const percentage = totalLinks > 0 ? Math.round((count / totalLinks) * 100) : 0;
    return {
      ...cat,
      count,
      percentage,
    };
  }).sort((a, b) => b.count - a.count);

  const maxCategoryCount = Math.max(...categoryStats.map((c) => c.count), 1);

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Links Card */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl glass-card shadow-sm flex items-center justify-between"
          id="stat-card-total-links"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Tổng liên kết
            </p>
            <p className="text-2xl font-bold text-zinc-850 dark:text-zinc-50">
              {totalLinks}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center text-blue-500">
            <Globe className="w-6 h-6" />
          </div>
        </motion.div>

        {/* Categories Card */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl glass-card shadow-sm flex items-center justify-between"
          id="stat-card-total-categories"
        >
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Danh mục
            </p>
            <p className="text-2xl font-bold text-zinc-850 dark:text-zinc-50">
              {totalCategories}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 flex items-center justify-center text-purple-500">
            <Layers className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (custom styled visual bars graph) */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                Phân bố theo danh mục
              </h3>
            </div>
            <span className="text-xs text-zinc-400">Tỷ lệ %</span>
          </div>

          <div className="flex-1 space-y-4">
            {categoryStats.length === 0 ? (
              <p className="text-xs text-zinc-450 dark:text-zinc-500 text-center py-10">
                Không có dữ liệu danh mục nào.
              </p>
            ) : (
              categoryStats.map((stat, idx) => (
                <div key={stat.id} className="space-y-1.5" id={`stat-row-${stat.id}`}>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: stat.color }}
                      />
                      {stat.name}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {stat.count} liên kết ({stat.percentage}%)
                    </span>
                  </div>
                  {/* Styled Progress Bar representing distributions */}
                  <div className="w-full h-2.5 bg-white/20 dark:bg-black/25 rounded-full overflow-hidden border border-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(stat.count / maxCategoryCount) * 100}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: stat.color }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Most Visited Links (Popular Items) */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                Liên kết được truy cập nhiều nhất
              </h3>
            </div>
            <span className="text-xs text-orange-500 font-semibold bg-orange-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              Top 5
            </span>
          </div>

          <div className="flex-1 space-y-3.5">
            {sortedByViews.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-10 space-y-2">
                <Sparkles className="w-7 h-7 text-zinc-350 dark:text-zinc-650 animate-pulse" />
                <p className="text-xs text-zinc-450 dark:text-zinc-500">
                  Chưa có thống kê truy cập nào. Nhấp mở liên kết để bắt đầu đếm lượt xem!
                </p>
              </div>
            ) : (
              sortedByViews.map((link, index) => (
                <div
                  key={link.id}
                  onClick={() => onOpenLink(link)}
                  className="group flex items-center justify-between p-2.5 rounded-xl border border-white/10 dark:border-white/5 hover:bg-white/10 dark:hover:bg-white/5 cursor-pointer transition-all"
                  id={`dashboard-popular-${link.id}`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-650 w-4">
                      {index + 1}
                    </span>
                    <img
                      src={link.favicon}
                      alt=""
                      className="w-5 h-5 object-contain rounded shrink-0"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?sz=64&domain=google.com';
                      }}
                    />
                    <div className="overflow-hidden flex-1 pr-2">
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-250 truncate group-hover:text-blue-500 transition-colors">
                        {link.title}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {link.url}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded-md flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      {link.viewsCount} lượt xem
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
