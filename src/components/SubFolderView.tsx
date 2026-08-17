import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, ArrowRight, Library, Sparkles } from 'lucide-react';
import { LinkItem } from '../types';

interface SubFolderViewProps {
  links: LinkItem[];
  role: 'admin' | 'viewer';
  onSelectSubCategory: (id: 'tinhoc3' | 'tinhoc4' | 'tinhoc5') => void;
}

export const SubFolderView: React.FC<SubFolderViewProps> = ({
  links,
  role,
  onSelectSubCategory,
}) => {
  // Count active/visible links in each subfolder
  const getCount = (subId: 'tinhoc3' | 'tinhoc4' | 'tinhoc5') => {
    return links.filter(
      (l) =>
        l.subCategoryId === subId &&
        (role === 'admin' || !l.isHidden)
    ).length;
  };

  const folders = [
    {
      id: 'tinhoc3' as const,
      title: 'TIN HỌC 3',
      subTitle: '📘 Học liệu lớp 3',
      description: 'Học liệu, phần mềm thực hành và trò chơi học tập sinh động dành cho học sinh lớp 3.',
      icon: '💻',
      color: 'from-blue-500/10 via-indigo-500/5 to-blue-600/10 hover:from-blue-500/20 hover:to-indigo-500/20',
      iconBg: 'bg-blue-500 text-white shadow-blue-500/30',
      borderColor: 'border-blue-200/60 dark:border-blue-800/40 hover:border-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    },
    {
      id: 'tinhoc4' as const,
      title: 'TIN HỌC 4',
      subTitle: '📗 Học liệu lớp 4',
      description: 'Học liệu trực quan, thiết kế bài tập thực hành và câu hỏi trắc nghiệm rèn luyện cho lớp 4.',
      icon: '💻',
      color: 'from-emerald-500/10 via-teal-500/5 to-emerald-600/10 hover:from-emerald-500/20 hover:to-teal-500/20',
      iconBg: 'bg-emerald-500 text-white shadow-emerald-500/30',
      borderColor: 'border-emerald-200/60 dark:border-emerald-800/40 hover:border-emerald-500',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
    {
      id: 'tinhoc5' as const,
      title: 'TIN HỌC 5',
      subTitle: '📙 Học liệu lớp 5',
      description: 'Kho bài giảng điện tử, lập trình Scratch nâng cao và phần mềm ứng dụng hữu ích lớp 5.',
      icon: '💻',
      color: 'from-amber-500/10 via-orange-500/5 to-amber-600/10 hover:from-amber-500/20 hover:to-orange-500/20',
      iconBg: 'bg-amber-500 text-white shadow-amber-500/30',
      borderColor: 'border-amber-200/60 dark:border-amber-800/40 hover:border-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="subfolder-view-panel">
      {/* Mini Breadcrumb Category Title */}
      <div className="flex items-center justify-between border-b border-zinc-200/40 dark:border-white/5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              Danh mục: 📁 Bài giảng E-Learning
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Vui lòng lựa chọn một trong các thư mục học liệu lớp bên dưới để tiếp tục tra cứu
            </p>
          </div>
        </div>
      </div>

      {/* Grid containing the folders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        {folders.map((folder, index) => {
          const count = getCount(folder.id);
          return (
            <motion.div
              key={folder.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4 }}
              onClick={() => onSelectSubCategory(folder.id)}
              className={`group relative p-6 rounded-3xl bg-gradient-to-br ${folder.color} border ${folder.borderColor} shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between items-center text-center min-h-[260px] overflow-hidden active:scale-[0.98]`}
              id={`subfolder-card-${folder.id}`}
            >
              {/* Soft decorative background circles */}
              <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-white/20 dark:bg-black/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-all duration-500" />
              
              <div className="flex flex-col items-center w-full">
                {/* 💻 Laptop Icon */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg font-bold select-none mb-3 bg-white/80 dark:bg-zinc-800/80 border border-zinc-200/50 dark:border-zinc-700/50">
                  {folder.icon}
                </div>

                {/* TIN HỌC Title */}
                <h3 className={`text-xl font-black tracking-wide mb-1 ${folder.textColor}`}>
                  {folder.title}
                </h3>

                {/* Subtitle Badge (e.g. 📘 Học liệu lớp 4) */}
                <div className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs mb-3 ${folder.badgeColor}`}>
                  {folder.subTitle}
                </div>

                {/* Lessons Counter */}
                <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 mb-2">
                  {count} bài giảng
                </p>
              </div>

              {/* Action Button: ▶ MỞ HỌC LIỆU */}
              <div className="w-full pt-4 mt-2 border-t border-zinc-200/30 dark:border-white/10 flex items-center justify-center">
                <button 
                  className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm group-hover:shadow-md transition-all ${folder.iconBg} group-hover:scale-[1.02]`}
                >
                  <span>▶ MỞ HỌC LIỆU</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
