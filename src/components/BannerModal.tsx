import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Image as ImageIcon,
  Camera,
  Upload,
  Trash2,
  RotateCcw,
  X,
  Check,
  AlertTriangle,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'admin' | 'viewer';
  currentBannerUrl: string | null;
  onSaveBanner: (bannerDataUrl: string) => void;
  onDeleteBanner: () => void;
  onRestoreDefaultBanner: () => void;
  onAddToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const BannerModal: React.FC<BannerModalProps> = ({
  isOpen,
  onClose,
  role,
  currentBannerUrl,
  onSaveBanner,
  onDeleteBanner,
  onRestoreDefaultBanner,
  onAddToast,
}) => {
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'delete' | 'restore' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security guard: If not admin, do not allow viewing or using this modal
  if (role !== 'admin') {
    return null;
  }

  // Reset state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setSelectedFileUrl(null);
      setIsUploading(false);
      setConfirmMode(null);
    }
  }, [isOpen]);

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate File Format: JPG, JPEG, PNG, WEBP
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => fileName.endsWith(ext));
    const isValidType = validTypes.includes(file.type);

    if (!isValidType && !isValidExt) {
      onAddToast('Vui lòng chọn tệp hình ảnh hợp lệ.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate File Size: Max 5MB (5 * 1024 * 1024 bytes)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      onAddToast('Ảnh quá lớn. Vui lòng chọn ảnh có dung lượng nhỏ hơn giới hạn cho phép.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);

    // Read file as Data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSelectedFileUrl(dataUrl);
        setIsUploading(false);
        onAddToast('Đã tải ảnh lên để xem trước! Vui lòng kiểm tra và bấm "Lưu Banner".', 'info');
      } else {
        setIsUploading(false);
        onAddToast('Không thể đọc tệp hình ảnh. Vui lòng thử lại.', 'error');
      }
    };

    reader.onerror = () => {
      setIsUploading(false);
      onAddToast('Không thể cập nhật Banner. Vui lòng thử lại.', 'error');
    };

    reader.readAsDataURL(file);

    // Clear input value so same file can be re-selected if desired
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    if (role !== 'admin') {
      onAddToast('Từ chối thao tác! Bạn không có quyền Quản trị.', 'error');
      return;
    }

    if (!selectedFileUrl) {
      onAddToast('Vui lòng chọn ảnh trước khi lưu.', 'error');
      return;
    }

    try {
      onSaveBanner(selectedFileUrl);
      setSelectedFileUrl(null);
      onClose();
    } catch (err) {
      onAddToast('Không thể cập nhật Banner. Vui lòng thử lại.', 'error');
    }
  };

  const handleCancelPreview = () => {
    setSelectedFileUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmDelete = () => {
    if (role !== 'admin') {
      onAddToast('Từ chối thao tác! Bạn không có quyền Quản trị.', 'error');
      return;
    }
    onDeleteBanner();
    setConfirmMode(null);
    setSelectedFileUrl(null);
    onAddToast('Đã xóa ảnh Banner tùy chỉnh và khôi phục Banner mặc định.', 'success');
  };

  const handleConfirmRestore = () => {
    if (role !== 'admin') {
      onAddToast('Từ chối thao tác! Bạn không có quyền Quản trị.', 'error');
      return;
    }
    onRestoreDefaultBanner();
    setConfirmMode(null);
    setSelectedFileUrl(null);
    onAddToast('Đã khôi phục Banner mặc định thành công.', 'success');
  };

  const hasCustomBanner = Boolean(currentBannerUrl);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            id="banner-modal-backdrop"
          />

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleSelectFile}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            id="banner-file-input"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-7 z-10 overflow-hidden my-auto"
            id="banner-modal-container"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                    <span>QUẢN LÝ ẢNH NỀN BANNER</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Tùy chỉnh hình nền Banner cổng học liệu số cho toàn bộ người dùng
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Đóng"
                id="btn-close-banner-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            {confirmMode === 'delete' ? (
              /* Delete Confirmation Sub-view */
              <div className="flex flex-col items-center text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center animate-bounce shadow-sm">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    Bạn có chắc chắn muốn xóa ảnh Banner hiện tại không?
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Ảnh Banner tùy chỉnh sẽ bị xóa và ứng dụng sẽ tự động chuyển về Banner mặc định.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full max-w-sm pt-4">
                  <button
                    type="button"
                    onClick={() => setConfirmMode(null)}
                    className="flex-1 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    id="btn-cancel-delete-banner"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                    id="btn-confirm-delete-banner"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa ảnh</span>
                  </button>
                </div>
              </div>
            ) : confirmMode === 'restore' ? (
              /* Restore Default Confirmation Sub-view */
              <div className="flex flex-col items-center text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shadow-sm">
                  <RotateCcw className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-md">
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    Bạn có muốn khôi phục Banner mặc định không?
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Banner sẽ trở về thiết kế màu sắc mặc định và ảnh tùy chỉnh sẽ không còn được sử dụng.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full max-w-sm pt-4">
                  <button
                    type="button"
                    onClick={() => setConfirmMode(null)}
                    className="flex-1 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    id="btn-cancel-restore-banner"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    className="flex-1 h-10 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                    id="btn-confirm-restore-banner"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Khôi phục</span>
                  </button>
                </div>
              </div>
            ) : selectedFileUrl ? (
              /* PREVIEW MODE (When new file is picked before saving) */
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Xem trước Banner mới
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-zinc-400">
                    Ảnh chưa lưu (nhấn "Lưu Banner" để áp dụng)
                  </span>
                </div>

                {/* Simulated Real Banner Container */}
                <div
                  className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-700 min-h-[170px] sm:min-h-[190px] p-6 flex flex-col items-center justify-center text-center transition-all bg-zinc-900"
                  style={{
                    backgroundImage: `url(${selectedFileUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  id="banner-preview-box"
                >
                  {/* Subtle Adaptive Dark Overlay for Text Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/35 to-black/45 backdrop-blur-[0.5px]" />

                  {/* Real Typography Text Overlay */}
                  <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center justify-center text-center space-y-2 select-none">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans">
                      HỌC LIỆU SỐ MÔN TIN HỌC
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base font-bold tracking-normal text-cyan-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-sans">
                      Kết nối tri thức - Chạm tới tương lai
                    </p>
                  </div>
                </div>

                {/* Guidance Box */}
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2.5">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    Ảnh bạn vừa chọn chỉ dùng làm <strong>ẢNH NỀN</strong>. Tiêu đề và khẩu hiệu của ứng dụng được hệ thống tự động giữ nguyên và hiển thị sắc nét.
                  </p>
                </div>

                {/* Preview Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelPreview}
                    className="px-5 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    id="btn-cancel-preview-banner"
                  >
                    Hủy
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-6 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                    id="btn-save-new-banner"
                  >
                    <Check className="w-4 h-4" />
                    <span>LƯU BANNER</span>
                  </button>
                </div>
              </div>
            ) : (
              /* STANDARD MANAGEMENT VIEW (Current Banner + Action Buttons) */
              <div className="space-y-6">
                {/* Current Banner Display Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Ảnh Banner hiện tại
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        hasCustomBanner
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {hasCustomBanner ? '📸 Ảnh tùy chỉnh' : '🎨 Mặc định hệ thống'}
                    </span>
                  </div>

                  {/* Banner Simulation Container */}
                  <div
                    className={`relative w-full rounded-2xl overflow-hidden shadow-md border border-blue-200/50 dark:border-blue-900/30 min-h-[160px] sm:min-h-[180px] p-6 flex flex-col items-center justify-center text-center transition-all ${
                      hasCustomBanner
                        ? 'bg-zinc-900'
                        : 'bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 text-white'
                    }`}
                    style={
                      hasCustomBanner && currentBannerUrl
                        ? {
                            backgroundImage: `url(${currentBannerUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }
                        : undefined
                    }
                    id="banner-current-display-box"
                  >
                    {/* Layer overlay */}
                    {hasCustomBanner ? (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/35 to-black/45 backdrop-blur-[0.5px]" />
                    ) : (
                      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:20px_20px]" />
                        <div className="absolute top-0 left-1/4 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl -translate-y-1/2" />
                        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl translate-y-1/2" />
                      </div>
                    )}

                    {/* Slogan Text */}
                    <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center justify-center text-center space-y-2 select-none">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans">
                        HỌC LIỆU SỐ MÔN TIN HỌC
                      </h2>
                      <p className="text-xs sm:text-sm md:text-base font-bold tracking-normal text-cyan-100/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-sans">
                        Kết nối tri thức - Chạm tới tương lai
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload Status / Progress */}
                {isUploading && (
                  <div className="flex items-center justify-center gap-2 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Đang tải ảnh...</span>
                  </div>
                )}

                {/* Primary Action Buttons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* 1. Upload New Image */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                    id="btn-upload-banner-new"
                  >
                    <Camera className="w-4 h-4" />
                    <span>📷 TẢI ẢNH MỚI</span>
                  </button>

                  {/* 2. Delete Custom Banner */}
                  <button
                    type="button"
                    onClick={() => setConfirmMode('delete')}
                    disabled={!hasCustomBanner || isUploading}
                    className={`h-11 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      hasCustomBanner
                        ? 'border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer shadow-xs active:scale-[0.98]'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 opacity-50 cursor-not-allowed'
                    }`}
                    id="btn-delete-banner"
                    title={hasCustomBanner ? 'Xóa ảnh tùy chỉnh' : 'Đang dùng banner mặc định'}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>🗑 XÓA ẢNH</span>
                  </button>

                  {/* 3. Restore Default */}
                  <button
                    type="button"
                    onClick={() => setConfirmMode('restore')}
                    disabled={!hasCustomBanner || isUploading}
                    className={`h-11 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      hasCustomBanner
                        ? 'border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer shadow-xs active:scale-[0.98]'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 opacity-50 cursor-not-allowed'
                    }`}
                    id="btn-restore-default-banner"
                    title={hasCustomBanner ? 'Khôi phục về banner mặc định' : 'Đang dùng banner mặc định'}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>↩ KHÔI PHỤC MẶC ĐỊNH</span>
                  </button>
                </div>

                {/* Upload Specs Note */}
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-150 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1.5">
                  <p className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-500" />
                    <span>Quy định và hướng dẫn về ảnh nền:</span>
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
                    <li>
                      Định dạng hỗ trợ: <strong>JPG, JPEG, PNG, WEBP</strong>.
                    </li>
                    <li>
                      Tỷ lệ khuyến nghị: <strong>16:9</strong> (Ảnh ngang hiển thị đẹp nhất trên mọi thiết bị).
                    </li>
                    <li>
                      Dung lượng tối đa: <strong>5 MB</strong>.
                    </li>
                    <li>
                      Hệ thống tự động căn chỉnh và phủ lớp màu bảo vệ để chữ luôn rõ nét.
                    </li>
                  </ul>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    id="btn-close-banner-modal-footer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
