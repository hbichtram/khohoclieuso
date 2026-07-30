import React from 'react';
import { motion } from 'motion/react';
import { Category, LinkItem } from '../types';
import { ArrowRight, Sparkles } from 'lucide-react';

interface LearningPortalProps {
  allLinks: LinkItem[];
  tinhoc3Links: LinkItem[];
  tinhoc4Links: LinkItem[];
  tinhoc5Links: LinkItem[];
  categories: Category[];
  onSelectSubCategory: (subCatId: 'tinhoc3' | 'tinhoc4' | 'tinhoc5' | null) => void;
  onSelectCategory: (catId: string | null) => void;
  onChangeFilter: (filter: 'all' | 'favorites' | 'pinned') => void;
}

export const LearningPortal: React.FC<LearningPortalProps> = ({
  allLinks,
  tinhoc3Links,
  tinhoc4Links,
  tinhoc5Links,
  categories,
  onSelectSubCategory,
  onSelectCategory,
  onChangeFilter,
}) => {
  // Find matching categories
  const gameCategory = categories.find(
    (c) =>
      c.name.toLowerCase().includes('trò chơi') ||
      c.name.toLowerCase().includes('game') ||
      c.id === 'cat-ent'
  );

  const videoCategory = categories.find(
    (c) => c.id === 'cat-video' || c.name.toLowerCase().includes('video')
  );

  const docCategory = categories.find(
    (c) => c.id === 'cat-doc' || c.name.toLowerCase().includes('tài liệu')
  );

  const elearningCategory = categories.find(
    (c) => c.id === 'cat-work' || c.id === 'cat-tech' || c.name.toLowerCase().includes('e-learning') || c.name.toLowerCase().includes('tin học')
  );

  // Calculate dynamic counts
  const countTinHoc3 = tinhoc3Links.length;
  const countTinHoc4 = tinhoc4Links.length;
  const countTinHoc5 = tinhoc5Links.length;

  const countGames = allLinks.filter(
    (l) => (gameCategory && l.categoryId === gameCategory.id) || l.resourceType === 'game'
  ).length;

  const countVideos = allLinks.filter(
    (l) => (videoCategory && l.categoryId === videoCategory.id) || l.resourceType === 'video'
  ).length;

  const countDocs = allLinks.filter(
    (l) =>
      (docCategory && l.categoryId === docCategory.id) ||
      l.resourceType === 'lecture' ||
      l.resourceType === 'exercise'
  ).length;

  // Handlers for cards
  const handleOpenTinHoc3 = () => {
    onChangeFilter('all');
    if (elearningCategory) {
      onSelectCategory(elearningCategory.id);
    } else {
      onSelectCategory('cat-work');
    }
    onSelectSubCategory('tinhoc3');
    scrollToLinksSection();
  };

  const handleOpenTinHoc4 = () => {
    onChangeFilter('all');
    if (elearningCategory) {
      onSelectCategory(elearningCategory.id);
    } else {
      onSelectCategory('cat-work');
    }
    onSelectSubCategory('tinhoc4');
    scrollToLinksSection();
  };

  const handleOpenTinHoc5 = () => {
    onChangeFilter('all');
    if (elearningCategory) {
      onSelectCategory(elearningCategory.id);
    } else {
      onSelectCategory('cat-work');
    }
    onSelectSubCategory('tinhoc5');
    scrollToLinksSection();
  };

  const handleOpenGames = () => {
    onChangeFilter('all');
    onSelectSubCategory(null);
    if (gameCategory) {
      onSelectCategory(gameCategory.id);
    }
    scrollToLinksSection();
  };

  const handleOpenVideos = () => {
    onChangeFilter('all');
    onSelectSubCategory(null);
    if (videoCategory) {
      onSelectCategory(videoCategory.id);
    } else {
      onSelectCategory('cat-video');
    }
    scrollToLinksSection();
  };

  const handleOpenDocs = () => {
    onChangeFilter('all');
    onSelectSubCategory(null);
    if (docCategory) {
      onSelectCategory(docCategory.id);
    } else {
      onSelectCategory('cat-doc');
    }
    scrollToLinksSection();
  };

  const handleExploreAll = () => {
    onChangeFilter('all');
    onSelectCategory(null);
    onSelectSubCategory(null);
    scrollToLinksSection();
  };

  const scrollToLinksSection = () => {
    const target = document.getElementById('links-directory-section') || document.getElementById('links-directory-title');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const cardsData = [
    {
      id: 'card-tinhoc3',
      icon: '💻',
      title: 'TIN HỌC 3',
      subText: '📘 Bài giảng E-Learning lớp 3',
      countText: `${countTinHoc3} bài giảng`,
      buttonLabel: '▶ MỞ HỌC LIỆU',
      onClick: handleOpenTinHoc3,
      color: 'from-blue-500/10 via-indigo-500/5 to-blue-600/10 hover:from-blue-500/20 hover:to-indigo-500/20',
      borderColor: 'border-blue-200/60 dark:border-blue-800/40 hover:border-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      btnBg: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20',
    },
    {
      id: 'card-tinhoc4',
      icon: '💻',
      title: 'TIN HỌC 4',
      subText: '📘 Bài giảng E-Learning lớp 4',
      countText: `${countTinHoc4} bài giảng`,
      buttonLabel: '▶ MỞ HỌC LIỆU',
      onClick: handleOpenTinHoc4,
      color: 'from-emerald-500/10 via-teal-500/5 to-emerald-600/10 hover:from-emerald-500/20 hover:to-teal-500/20',
      borderColor: 'border-emerald-200/60 dark:border-emerald-800/40 hover:border-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      btnBg: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20',
    },
    {
      id: 'card-tinhoc5',
      icon: '💻',
      title: 'TIN HỌC 5',
      subText: '📘 Bài giảng E-Learning lớp 5',
      countText: `${countTinHoc5} bài giảng`,
      buttonLabel: '▶ MỞ HỌC LIỆU',
      onClick: handleOpenTinHoc5,
      color: 'from-amber-500/10 via-orange-500/5 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-500/20',
      borderColor: 'border-amber-200/60 dark:border-amber-800/40 hover:border-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      btnBg: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20',
    },
    {
      id: 'card-games',
      icon: '🎮',
      title: 'TRÒ CHƠI HỌC TẬP',
      subText: '🎮 Game & Trò chơi học tập sinh động',
      countText: `${countGames} liên kết`,
      buttonLabel: '▶ KHÁM PHÁ',
      onClick: handleOpenGames,
      color: 'from-purple-500/10 via-fuchsia-500/5 to-purple-600/10 hover:from-purple-500/20 hover:to-fuchsia-500/20',
      borderColor: 'border-purple-200/60 dark:border-purple-800/40 hover:border-purple-500',
      textColor: 'text-purple-600 dark:text-purple-400',
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      btnBg: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20',
    },
    {
      id: 'card-video',
      icon: '🎥',
      title: 'VIDEO BÀI GIẢNG',
      subText: '🎥 Video bài giảng trực quan',
      countText: `${countVideos} video`,
      buttonLabel: '▶ XEM VIDEO',
      onClick: handleOpenVideos,
      color: 'from-red-500/10 via-rose-500/5 to-red-600/10 hover:from-red-500/20 hover:to-rose-500/20',
      borderColor: 'border-red-200/60 dark:border-red-800/40 hover:border-red-500',
      textColor: 'text-red-600 dark:text-red-400',
      badgeColor: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800',
      btnBg: 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20',
    },
    {
      id: 'card-doc',
      icon: '📄',
      title: 'TÀI LIỆU THAM KHẢO',
      subText: '📄 Tài liệu, giáo án & sách giáo khoa',
      countText: `${countDocs} tài liệu`,
      buttonLabel: '▶ MỞ TÀI LIỆU',
      onClick: handleOpenDocs,
      color: 'from-cyan-500/10 via-teal-500/5 to-cyan-600/10 hover:from-cyan-500/20 hover:to-teal-500/20',
      borderColor: 'border-cyan-200/60 dark:border-cyan-800/40 hover:border-cyan-500',
      textColor: 'text-cyan-600 dark:text-cyan-400',
      badgeColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
      btnBg: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20',
    },
  ];

  return (
    <div className="space-y-6 pt-2" id="learning-portal-section">
      {/* SECTION HEADER */}
      <div className="text-left space-y-1">
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
          <span>📚</span>
          <span>CỔNG HỌC LIỆU SỐ</span>
        </h2>
        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-3xl">
          Truy cập nhanh các học liệu số, video bài giảng, trò chơi học tập và tài liệu tham khảo môn Tin học.
        </p>
      </div>

      {/* 06 CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cardsData.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.35 }}
            onClick={card.onClick}
            className={`group relative p-6 rounded-[20px] bg-gradient-to-br ${card.color} border ${card.borderColor} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between items-center text-center overflow-hidden min-h-[250px] active:scale-[0.99]`}
            id={`portal-card-${card.id}`}
          >
            {/* Top icon */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md bg-white/80 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-zinc-700/50 transition-transform duration-300 group-hover:scale-110 mb-3">
              {card.icon}
            </div>

            {/* Content info */}
            <div className="flex flex-col items-center w-full space-y-1.5 mb-4">
              <h3 className={`text-xl font-black tracking-wide ${card.textColor}`}>
                {card.title}
              </h3>
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {card.subText}
              </p>

              {/* Badge count */}
              <div className={`mt-2 text-[11px] font-extrabold px-3 py-0.5 rounded-full border shadow-2xs ${card.badgeColor}`}>
                {card.countText}
              </div>
            </div>

            {/* Action button */}
            <div className="w-full pt-3 border-t border-zinc-200/30 dark:border-white/10">
              <button
                className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all duration-200 ${card.btnBg} group-hover:scale-[1.02] cursor-pointer`}
              >
                <span>{card.buttonLabel}</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* DISCOVER ALL BUTTON BELOW THE 06 CARDS */}
      <div className="flex justify-center pt-2">
        <button
          onClick={handleExploreAll}
          className="group relative px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm md:text-base shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-3 border border-white/20 cursor-pointer"
          id="btn-explore-all-learning-portal"
        >
          <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
          <span>🚀 KHÁM PHÁ TOÀN BỘ HỌC LIỆU</span>
          <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
