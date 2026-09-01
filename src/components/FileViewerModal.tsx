import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  Package,
  Eye,
  Check,
  Share2,
  Copy,
  Info,
} from 'lucide-react';
import { LinkItem } from '../types';
import { getFileTypeBadgeInfo, formatFileSize } from '../storage';

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: LinkItem | null;
  onAddToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  isOpen,
  onClose,
  link,
  onAddToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !link) return null;

  const fileType = link.fileType || 'other';
  const badgeInfo = getFileTypeBadgeInfo(fileType);
  const isVideo = fileType === 'video';
  const isAudio = fileType === 'audio';
  const isImage = fileType === 'image';
  const isPdf = fileType === 'pdf';
  const isOffice = ['word', 'powerpoint', 'excel'].includes(fileType);

  const handleDownload = () => {
    try {
      const a = document.createElement('a');
      a.href = link.url;
      a.download = link.fileName || link.title || 'hoc_lieu';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      onAddToast('Đang tải xuống tệp học liệu...', 'info');
    } catch (e) {
      window.open(link.url, '_blank');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(link.url);
    setCopied(true);
    onAddToast('Đã sao chép đường dẫn tệp!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenDirect = () => {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(link.url)}&embedded=true`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden z-10"
          id={`file-viewer-modal-${link.id}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 shrink-0">
            <div className="flex items-center gap-3 overflow-hidden">
              <span className="text-2xl">{badgeInfo.emoji}</span>
              <div className="overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeInfo.color}`}>
                    {badgeInfo.badge}
                  </span>
                  {link.fileSizeFormatted && (
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {link.fileSizeFormatted}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 truncate" title={link.title}>
                  {link.title}
                </h3>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Sao chép liên kết tệp"
                id="file-modal-copy-btn"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                id="file-modal-download-btn"
              >
                <Download className="w-4 h-4" />
                Tải xuống
              </button>

              <button
                type="button"
                onClick={handleOpenDirect}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Mở trong tab mới"
                id="file-modal-direct-open-btn"
              >
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer ml-1"
                id="file-modal-close-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Viewer */}
          <div className="flex-1 overflow-y-auto bg-zinc-100 dark:bg-zinc-950 p-4 flex flex-col items-center justify-center min-h-[350px]">
            {isImage && (
              <div className="max-w-full max-h-[65vh] flex items-center justify-center">
                <img
                  src={link.url}
                  alt={link.title}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-lg"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {isVideo && (
              <div className="w-full max-w-3xl aspect-video rounded-xl overflow-hidden shadow-2xl bg-black flex items-center justify-center">
                <video
                  src={link.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  Trình duyệt không hỗ trợ xem video trực tiếp. Vui lòng tải xuống tệp.
                </video>
              </div>
            )}

            {isAudio && (
              <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                  <Music className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{link.title}</h4>
                  <p className="text-xs text-zinc-500 mt-1">{link.fileName || 'Tệp âm thanh bài học'}</p>
                </div>
                <audio src={link.url} controls className="w-full mt-2" />
              </div>
            )}

            {isPdf && (
              <div className="w-full h-[65vh] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white shadow-inner">
                <iframe
                  src={`${link.url}#toolbar=1`}
                  className="w-full h-full border-none"
                  title={link.title}
                />
              </div>
            )}

            {isOffice && (
              <div className="w-full h-[65vh] flex flex-col items-center justify-center rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mb-4">
                  {fileType === 'word' && <FileText className="w-8 h-8" />}
                  {fileType === 'powerpoint' && <Presentation className="w-8 h-8 text-orange-500" />}
                  {fileType === 'excel' && <FileSpreadsheet className="w-8 h-8 text-emerald-500" />}
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">{link.title}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 max-w-md">
                  {link.fileName ? `Tệp: ${link.fileName}` : 'Tài liệu Office học tập'} • Dung lượng: {link.fileSizeFormatted || 'N/A'}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Tải tệp về máy ({badgeInfo.badge})
                  </button>

                  <a
                    href={googleViewerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl font-semibold text-xs transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Xem trước qua Google Docs
                  </a>
                </div>
              </div>
            )}

            {!isImage && !isVideo && !isAudio && !isPdf && !isOffice && (
              <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center mb-4">
                  <Package className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-base mb-1">{link.title}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">
                  {link.fileName || 'Tệp đính kèm học liệu'} • {link.fileSizeFormatted || ''}
                </p>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Tải tệp về máy tính
                </button>
              </div>
            )}
          </div>

          {/* Footer Info */}
          {(link.description || link.lesson || link.topic || link.notes) && (
            <div className="px-5 py-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {link.lesson && (
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    📚 {link.lesson}
                  </span>
                )}
                {link.topic && (
                  <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[11px]">
                    📍 {link.topic}
                  </span>
                )}
              </div>
              {link.description && (
                <p className="text-zinc-500 dark:text-zinc-400 line-clamp-1 italic max-w-md">
                  "{link.description}"
                </p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
