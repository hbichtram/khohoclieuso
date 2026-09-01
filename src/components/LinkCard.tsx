import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Star,
  Pin,
  Copy,
  ExternalLink,
  Edit2,
  Trash2,
  QrCode,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Eye,
  Globe,
  Share2,
  EyeOff,
  BookOpen,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  Package,
  Download,
  FolderOpen,
  Play,
  User,
} from 'lucide-react';
import { LinkItem, Category } from '../types';
import { isValidUrl, getFileTypeBadgeInfo, formatFileSize } from '../storage';

interface LinkCardProps {
  role: 'admin' | 'viewer';
  link: LinkItem;
  category: Category | undefined;
  onEdit: (link: LinkItem) => void;
  onDelete: (link: LinkItem) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePinned: (id: string) => void;
  onIncrementViews: (id: string) => void;
  onAddToast: (message: string, type: 'success' | 'error' | 'info') => void;
  layout: 'grid' | 'list';
  animationsEnabled: boolean;
  onOpenFileViewer?: (link: LinkItem) => void;
}

const RESOURCE_TYPE_MAP = {
  video: { label: 'Video bài học', emoji: '🎥', color: 'text-red-600 bg-red-500/10 border-red-200 dark:border-red-950/40' },
  lecture: { label: 'Bài giảng', emoji: '📖', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200 dark:border-emerald-950/40' },
  document: { label: 'Tài liệu', emoji: '📄', color: 'text-cyan-600 bg-cyan-500/10 border-cyan-200 dark:border-cyan-950/40' },
  game: { label: 'Trò chơi học tập', emoji: '🎮', color: 'text-amber-600 bg-amber-500/10 border-amber-200 dark:border-amber-950/40' },
  exercise: { label: 'Bài tập', emoji: '📝', color: 'text-purple-600 bg-purple-500/10 border-purple-200 dark:border-purple-950/40' },
  website: { label: 'Website', emoji: '🌐', color: 'text-blue-600 bg-blue-500/10 border-blue-200 dark:border-blue-950/40' },
  software: { label: 'Phần mềm', emoji: '💻', color: 'text-indigo-600 bg-indigo-500/10 border-indigo-200 dark:border-indigo-950/40' },
} as const;

export const LinkCard: React.FC<LinkCardProps> = ({
  role,
  link,
  category,
  onEdit,
  onDelete,
  onToggleFavorite,
  onTogglePinned,
  onIncrementViews,
  onAddToast,
  layout,
  animationsEnabled,
  onOpenFileViewer,
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const isFile = Boolean(link.isUploadedFile || link.storagePath || (link.fileName && link.fileSize));
  const fileBadge = getFileTypeBadgeInfo(link.fileType);

  // Copy url helper
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!link.url) {
      onAddToast('Liên kết bài giảng chưa được cấu hình.', 'error');
      return;
    }
    navigator.clipboard.writeText(link.url);
    onAddToast(isFile ? 'Đã sao chép liên kết tệp học liệu!' : 'Đã sao chép liên kết vào bộ nhớ tạm!', 'success');
  };

  // Open link trigger and view increment
  const handleOpen = () => {
    const rawUrl = link?.url?.trim();
    if (!rawUrl) {
      onAddToast('Liên kết học liệu chưa được cấu hình.', 'error');
      return;
    }
    onIncrementViews(link.id);

    // If it's a file, trigger modal viewer or appropriate handler
    if (isFile && onOpenFileViewer) {
      onOpenFileViewer(link);
      return;
    }

    let finalUrl = rawUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('/')) {
      finalUrl = 'https://' + finalUrl;
    }
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  // Dynamic colors for label accent borders
  const accentColor = link.color || category?.color || '#3B82F6';

  // Construct QR code image URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(link.url)}`;

  const subCatInfo = link.subCategoryId
    ? {
        tinhoc3: { label: 'Tin học Lớp 3', color: '#3B82F6', icon: '📘' },
        tinhoc4: { label: 'Tin học Lớp 4', color: '#10B981', icon: '📗' },
        tinhoc5: { label: 'Tin học Lớp 5', color: '#F59E0B', icon: '📙' },
      }[link.subCategoryId]
    : null;

  if (layout === 'list') {
    // List compact Row layout
    return (
      <motion.div
        layout={animationsEnabled}
        initial={animationsEnabled ? { opacity: 0, y: 10 } : undefined}
        animate={animationsEnabled ? { opacity: 1, y: 0 } : undefined}
        exit={animationsEnabled ? { opacity: 0, scale: 0.95 } : undefined}
        className={`group relative flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-2xl glass-card shadow-sm border-l-4 transition-all duration-300 ${
          link.isHidden ? 'opacity-70 bg-rose-50/50 dark:bg-rose-950/5 border-rose-500' : ''
        }`}
        style={{ borderLeftColor: accentColor }}
        id={`link-row-${link.id}`}
      >
        {/* Left side info */}
        <div className="flex items-start gap-3.5 overflow-hidden flex-1 cursor-pointer" onClick={handleOpen}>
          {/* File Icon or Favicon */}
          <div className="relative shrink-0 mt-0.5">
            {isFile ? (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm border border-zinc-150 dark:border-zinc-800 ${fileBadge.bgLight}`}>
                {fileBadge.emoji}
              </div>
            ) : (
              <img
                src={link.favicon || 'https://www.google.com/s2/favicons?sz=64&domain=google.com'}
                alt=""
                className="w-10 h-10 rounded-xl border border-zinc-100 dark:border-zinc-800 object-contain p-1 bg-white shadow-sm"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?sz=64&domain=google.com';
                }}
              />
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm"
              style={{ backgroundColor: accentColor }}
            />
          </div>

          <div className="overflow-hidden flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 truncate hover:text-blue-500 transition-colors">
                {link.title}
              </h3>

              {/* Tag indicator for file vs url */}
              {isFile && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-0.5">
                  📁 TỆP ĐÍNH KÈM
                </span>
              )}

              {link.isPinned && (
                <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 p-0.5 rounded" title="Đã ghim">
                  <Pin className="w-3 h-3 fill-current" />
                </span>
              )}
              {link.isFavorite && (
                <span className="text-pink-500 text-xs animate-pulse" title="Yêu thích">⭐</span>
              )}
              {link.isHidden && (
                <span className="bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[9px] font-bold px-1 rounded flex items-center gap-0.5">
                  <EyeOff className="w-2.5 h-2.5" /> Bị ẩn
                </span>
              )}
            </div>

            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5 font-mono max-w-sm">
              {isFile ? (link.fileName ? `Tệp: ${link.fileName} (${link.fileSizeFormatted || ''})` : 'Tệp học liệu') : link.url}
            </p>

            {/* Custom Lesson or Topic banner */}
            {(link.lesson || link.topic || link.author) && (
              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                {link.lesson && (
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    📚 {link.lesson}
                  </span>
                )}
                {link.topic && (
                  <span className="bg-zinc-200/50 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded text-[10px]">
                    📍 {link.topic}
                  </span>
                )}
                {link.author && (
                  <span className="text-zinc-400 text-[10px]">
                    👤 {link.author}
                  </span>
                )}
              </div>
            )}

            {link.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                {link.description}
              </p>
            )}
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex flex-wrap items-center gap-2 mt-3.5 md:mt-0 justify-end md:ml-4 shrink-0 border-t border-zinc-100 dark:border-zinc-800/60 pt-2 md:pt-0 md:border-none">
          {/* Subcategory folder indicator */}
          {subCatInfo && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1"
              style={{
                color: subCatInfo.color,
                borderColor: `${subCatInfo.color}35`,
                backgroundColor: `${subCatInfo.color}10`,
              }}
            >
              <span>{subCatInfo.icon}</span>
              <span>{subCatInfo.label}</span>
            </span>
          )}

          {/* Educational Resource type tag */}
          {link.resourceType && RESOURCE_TYPE_MAP[link.resourceType as keyof typeof RESOURCE_TYPE_MAP] && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${RESOURCE_TYPE_MAP[link.resourceType as keyof typeof RESOURCE_TYPE_MAP].color}`}>
              {RESOURCE_TYPE_MAP[link.resourceType as keyof typeof RESOURCE_TYPE_MAP].emoji} {RESOURCE_TYPE_MAP[link.resourceType as keyof typeof RESOURCE_TYPE_MAP].label}
            </span>
          )}

          {/* Category tag */}
          {category && !subCatInfo && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0"
              style={{
                color: category.color,
                borderColor: `${category.color}40`,
                backgroundColor: `${category.color}15`,
              }}
            >
              {category.name}
            </span>
          )}

          {/* Views count */}
          <span className="text-[10px] text-zinc-400 flex items-center gap-1 mr-1">
            <Eye className="w-3.5 h-3.5" />
            {link.viewsCount || 0}
          </span>

          {/* Action Open Button */}
          <button
            onClick={handleOpen}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow transition-all cursor-pointer"
            id={`row-btn-open-${link.id}`}
          >
            {isFile ? <Play className="w-3 h-3 fill-current" /> : <ExternalLink className="w-3 h-3" />}
            {isFile ? '▶ MỞ HỌC LIỆU' : 'Truy cập'}
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-blue-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
              title="Sao chép liên kết"
              id={`row-btn-copy-${link.id}`}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowQR(!showQR);
              }}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                showQR
                  ? 'text-purple-500 border-purple-200 bg-purple-500/10'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-purple-500 hover:bg-zinc-50 dark:hover:bg-zinc-850'
              }`}
              title="Chia sẻ mã QR"
              id={`row-btn-qr-${link.id}`}
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>

            {role === 'admin' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(link);
                  }}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-indigo-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                  title="Sửa thông tin"
                  id={`row-btn-edit-${link.id}`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(link);
                  }}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-rose-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                  title="Xóa học liệu"
                  id={`row-btn-delete-${link.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Floating QR display */}
        {showQR && (
          <div className="absolute right-3 top-14 bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow-xl z-20 flex flex-col items-center border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">Scan QR Code</span>
              <button onClick={() => setShowQR(false)} className="text-zinc-400 hover:text-zinc-600 text-xs">×</button>
            </div>
            <img src={qrCodeUrl} alt="QR Code" className="w-28 h-28 rounded border p-1 bg-white" />
            <p className="text-[9px] text-zinc-400 mt-1 truncate max-w-[120px]">{link.url}</p>
          </div>
        )}
      </motion.div>
    );
  }

  // --- Grid Card layout ---
  return (
    <motion.div
      layout={animationsEnabled}
      initial={animationsEnabled ? { opacity: 0, y: 12 } : undefined}
      animate={animationsEnabled ? { opacity: 1, y: 0 } : undefined}
      exit={animationsEnabled ? { opacity: 0, scale: 0.95 } : undefined}
      className={`group relative rounded-2xl glass-card p-5 shadow-sm flex flex-col justify-between overflow-hidden border border-zinc-200/60 dark:border-zinc-800/80 transition-all duration-300 ${
        link.isHidden ? 'opacity-70 bg-rose-50/50 dark:bg-rose-950/5 border-rose-500' : ''
      }`}
      id={`link-card-${link.id}`}
    >
      {/* Accent Top Color Line */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ backgroundColor: accentColor }}
      />

      {/* Cover Image preview if available */}
      {link.imageUrl && (
        <div
          onClick={handleOpen}
          className="relative w-full h-32 mt-2 mb-3 rounded-xl overflow-hidden cursor-pointer group-hover:opacity-95 transition-all border border-zinc-150 dark:border-zinc-800 shadow-sm shrink-0"
        >
          <img
            src={link.imageUrl}
            alt={link.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          {link.isHidden && (
            <div className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
              <EyeOff className="w-2.5 h-2.5" /> Bị ẩn
            </div>
          )}
        </div>
      )}

      {/* Card Header Info */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2.5">
          {/* Favicon / File Icon & Title */}
          <div className="flex items-center gap-3 overflow-hidden">
            {isFile ? (
              <div className={`w-10 h-10 rounded-xl border border-zinc-150 dark:border-zinc-800 flex items-center justify-center text-xl shrink-0 shadow-sm ${fileBadge.bgLight}`}>
                {fileBadge.emoji}
              </div>
            ) : (
              <img
                src={link.favicon || 'https://www.google.com/s2/favicons?sz=64&domain=google.com'}
                alt=""
                className="w-10 h-10 rounded-xl border border-zinc-150 dark:border-zinc-800 object-contain p-1 bg-white shrink-0 shadow-sm"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?sz=64&domain=google.com';
                }}
              />
            )}
            <div className="overflow-hidden">
              <h3
                onClick={handleOpen}
                className="font-bold text-sm text-zinc-850 dark:text-zinc-50 truncate hover:text-blue-500 cursor-pointer transition-colors"
                title={link.title}
              >
                {link.title}
              </h3>

              {isFile ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${fileBadge.color}`}>
                    {fileBadge.badge}
                  </span>
                  {link.fileSizeFormatted && (
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {link.fileSizeFormatted}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate max-w-[150px] font-mono">
                  {link.url.replace(/(^\w+:|^)\/\//, '')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Custom Lesson or Topic banner */}
        {(link.lesson || link.topic || link.author) && (
          <div className="flex flex-col gap-1 text-[11px] bg-slate-100/50 dark:bg-slate-900/40 p-2 rounded-xl border border-zinc-150/50 dark:border-zinc-800/40">
            {link.lesson && (
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                📚 {link.lesson}
              </span>
            )}
            {link.topic && (
              <span className="text-zinc-500 dark:text-zinc-400 truncate text-[10px]">
                📍 Chủ đề: {link.topic}
              </span>
            )}
            {link.author && (
              <span className="text-zinc-400 truncate text-[10px]">
                👤 Giáo viên: {link.author}
              </span>
            )}
          </div>
        )}

        {/* Description text */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 h-8.5 leading-relaxed">
          {link.description || <span className="text-zinc-300 dark:text-zinc-600 italic">Không có mô tả</span>}
        </p>

        {/* Keywords tags if exist */}
        {link.keywords && (
          <div className="flex flex-wrap gap-1">
            {link.keywords.split(',').map((kw) => (
              <span key={kw} className="text-[9px] bg-slate-100 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                #{kw.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Middle Meta Info (Category + views) */}
        <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/60 pt-2.5">
          <div className="flex items-center gap-1.5">
            {/* Subcategory folder indicator */}
            {subCatInfo ? (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-0.5 shrink-0"
                style={{
                  color: subCatInfo.color,
                  borderColor: `${subCatInfo.color}35`,
                  backgroundColor: `${subCatInfo.color}10`,
                }}
              >
                <span>{subCatInfo.icon}</span>
                <span>{subCatInfo.label}</span>
              </span>
            ) : category ? (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border truncate max-w-[100px]"
                style={{
                  color: category.color,
                  borderColor: `${category.color}40`,
                  backgroundColor: `${category.color}15`,
                }}
              >
                {category.name}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
                Chưa xếp loại
              </span>
            )}

            {/* Educational Resource type tag */}
            {link.resourceType && RESOURCE_TYPE_MAP[link.resourceType as keyof typeof RESOURCE_TYPE_MAP] && (
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${RESOURCE_TYPE_MAP[link.resourceType as keyof typeof RESOURCE_TYPE_MAP].color}`}>
                {RESOURCE_TYPE_MAP[link.resourceType as keyof typeof RESOURCE_TYPE_MAP].emoji} {RESOURCE_TYPE_MAP[link.resourceType as keyof typeof RESOURCE_TYPE_MAP].label}
              </span>
            )}

            {isFile && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                📁 TỆP ĐÍNH KÈM
              </span>
            )}
          </div>

          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 shrink-0">
            <Eye className="w-3.5 h-3.5" />
            {link.viewsCount || 0}
          </span>
        </div>

        {/* Private notes accordion toggler */}
        {link.notes && (
          <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-2">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="w-full flex items-center justify-between text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-blue-500 cursor-pointer"
              id={`card-btn-notes-${link.id}`}
            >
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-blue-500" />
                {showNotes ? 'Ẩn ghi chú giáo viên' : 'Xem ghi chú giáo viên'}
              </span>
              {showNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showNotes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-1.5 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono whitespace-pre-wrap"
                id={`card-notes-content-${link.id}`}
              >
                {link.notes}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Card Action Controls */}
      <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/60 mt-3.5 pt-3 gap-1">
        {/* Open Button */}
        <button
          onClick={handleOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer shadow-md shadow-blue-500/20 active:scale-95"
          id={`card-btn-open-${link.id}`}
        >
          {isFile ? (
            <>
              <Play className="w-3 h-3 fill-current" />
              ▶ MỞ HỌC LIỆU
            </>
          ) : (
            <>
              Truy cập
              <ExternalLink className="w-3 h-3" />
            </>
          )}
        </button>

        {/* Secondary controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Sao chép liên kết"
            id={`card-btn-copy-${link.id}`}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowQR(!showQR)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showQR
                ? 'text-purple-500 border-purple-200 bg-purple-500/10'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-purple-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
            title="Hiển thị QR Code"
            id={`card-btn-qr-${link.id}`}
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>

          {role === 'admin' && (
            <>
              <button
                onClick={() => onEdit(link)}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-indigo-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Sửa thông tin"
                id={`card-btn-edit-${link.id}`}
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onDelete(link)}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Xóa bỏ"
                id={`card-btn-delete-${link.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Floating QR Modal overlay */}
      {showQR && (
        <div className="absolute inset-0 bg-white/95 dark:bg-zinc-900/95 flex flex-col items-center justify-center p-4 z-10 text-center rounded-2xl">
          <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-2.5 flex items-center gap-1">
            <QrCode className="w-4 h-4" />
            MÃ QR HỌC LIỆU
          </p>
          <img
            src={qrCodeUrl}
            alt="QR Code"
            className="w-28 h-28 rounded-lg border p-1 bg-white shadow-md"
          />
          <p className="text-[10px] text-zinc-400 truncate max-w-[180px] mt-2 mb-3.5">{link.url}</p>
          <button
            onClick={() => setShowQR(false)}
            className="px-4 py-1 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 transition-colors cursor-pointer"
            id={`card-btn-qr-close-${link.id}`}
          >
            Đóng lại
          </button>
        </div>
      )}
    </motion.div>
  );
};
