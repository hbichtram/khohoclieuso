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
      title: 'Tin học 3',
      description: 'Học liệu, phần mềm thực hành và trò chơi học tập sinh động dành cho học sinh lớp 3.',
      icon: '📘',
      color: 'from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 hover:to-indigo-500/20',
      iconBg: 'bg-blue-500 text-white shadow-blue-500/30',
      borderColor: 'border-blue-200/50 dark:border-blue-900/30 hover:border-blue-400',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'tinhoc4' as const,
      title: 'Tin học 4',
      description: 'Học liệu trực quan, thiết kế bài tập thực hành và câu hỏi trắc nghiệm rèn luyện cho lớp 4.',
      icon: '📗',
      color: 'from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20',
      iconBg: 'bg-emerald-500 text-white shadow-emerald-500/30',
      borderColor: 'border-emerald-200/50 dark:border-emerald-900/30 hover:border-emerald-400',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'tinhoc5' as const,
      title: 'Tin học 5',
      description: 'Kho bài giảng điện tử, lập trình Scratch nâng cao và phần mềm ứng dụng hữu ích lớp 5.',
      icon: '📙',
      color: 'from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20',
      iconBg: 'bg-amber-500 text-white shadow-amber-500/30',
      borderColor: 'border-amber-200/50 dark:border-amber-900/30 hover:border-amber-400',
      textColor: 'text-amber-600 dark:text-amber-400',
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
              className={`group relative p-6 rounded-3xl bg-gradient-to-br ${folder.color} border ${folder.borderColor} shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px] overflow-hidden active:scale-[0.98]`}
              id={`subfolder-card-${folder.id}`}
            >
              {/* Soft decorative background circles */}
              <div className="absolute top-[-30px] right-[-30px] w-24 h-24 bg-white/20 dark:bg-black/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-all duration-500" />
              
              <div>
                {/* Folder Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg font-bold select-none ${folder.iconBg}`}>
                    {folder.icon}
                  </div>
                  
                  {/* Total links tag */}
                  <span className="text-[11px] font-bold bg-white/60 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 px-3 py-1 rounded-full border border-zinc-200/40 dark:border-zinc-800 shadow-sm">
                    {count} học liệu
                  </span>
                </div>

                {/* Folder Text contents */}
                <h3 className={`text-lg font-extrabold mb-2 ${folder.textColor}`}>
                  {folder.title}
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans line-clamp-3">
                  {folder.description}
                </p>
              </div>

              {/* Action indicator link */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-200/20 dark:border-white/5">
                <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-850 dark:group-hover:text-zinc-200 transition-colors flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-violet-500 animate-pulse" />
                  Mở tài liệu lớp
                </span>
                <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 group-hover:bg-[var(--primary-accent)] group-hover:text-white transition-all duration-300 flex items-center justify-center text-zinc-400 shadow-sm border border-zinc-200/30 dark:border-zinc-800">
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
