import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Image as ImageIcon,
  Camera,
  Trash2,
  RotateCcw,
  X,
  Check,
  AlertTriangle,
  Info,
  ZoomIn,
  Move,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { BannerConfig, DEFAULT_BANNER_CONFIG } from '../types';

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'admin' | 'viewer';
  bannerConfig: BannerConfig;
  currentBannerUrl: string | null;
  onSaveBannerConfig: (config: BannerConfig, newImageDataUrl?: string | null) => Promise<void> | void;
  onDeleteBanner: () => Promise<void> | void;
  onRestoreDefaultBanner: () => Promise<void> | void;
  onAddToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

// Helper to compress image to lightweight base64 (Max 1600x600, ~100-200 KB) for ultra-fast Firestore sync
const compressBannerImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1600;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Try webp first, fallback to jpeg
        let resultUrl = canvas.toDataURL('image/webp', 0.85);
        if (!resultUrl || !resultUrl.startsWith('data:image/webp')) {
          resultUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
        resolve(resultUrl);
      };
      img.onerror = () => reject(new Error('Không thể tải dữ liệu ảnh'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh'));
    reader.readAsDataURL(file);
  });
};

export const BannerModal: React.FC<BannerModalProps> = ({
  isOpen,
  onClose,
  role,
  bannerConfig,
  currentBannerUrl,
  onSaveBannerConfig,
  onDeleteBanner,
  onRestoreDefaultBanner,
  onAddToast,
}) => {
  // Pending draft states for live preview and direct mouse adjustments
  const [draftUrl, setDraftUrl] = useState<string | null>(currentBannerUrl);
  const [pendingFileUrl, setPendingFileUrl] = useState<string | null>(null);
  const [posX, setPosX] = useState<number>(bannerConfig.posX ?? 50);
  const [posY, setPosY] = useState<number>(bannerConfig.posY ?? 50);
  const [scale, setScale] = useState<number>(bannerConfig.scale ?? 100);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'delete' | 'restore' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialPosX: 50, initialPosY: 50 });

  // Security guard: If not admin, do not allow viewing or using this modal
  if (role !== 'admin') {
    return null;
  }

  // Synchronize state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setDraftUrl(currentBannerUrl);
      setPendingFileUrl(null);
      setPosX(bannerConfig.posX ?? 50);
      setPosY(bannerConfig.posY ?? 50);
      setScale(bannerConfig.scale ?? 100);
      setIsUploading(false);
      setIsDragging(false);
      setConfirmMode(null);
      isDraggingRef.current = false;
    }
  }, [isOpen, currentBannerUrl, bannerConfig]);

  const activeImage = pendingFileUrl || draftUrl;
  const hasCustomBanner = Boolean(activeImage);

  // Handle File Selection (JPG, JPEG, PNG, WEBP <= 5MB)
  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate File Format
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => fileName.endsWith(ext));
    const isValidType = validTypes.includes(file.type);

    if (!isValidType && !isValidExt) {
      onAddToast('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, JPEG, PNG, WEBP).', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate File Size: Max 5MB
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      onAddToast('Ảnh quá lớn. Vui lòng chọn ảnh có dung lượng nhỏ hơn 5 MB.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);

    compressBannerImage(file)
      .then((compressedUrl) => {
        setPendingFileUrl(compressedUrl);
        setIsUploading(false);
        // Reset to center for new image
        setPosX(50);
        setPosY(50);
        setScale(100);
        onAddToast('Đã tải ảnh lên! Hãy dùng chuột nhấn giữ và kéo ảnh để căn vị trí.', 'info');
      })
      .catch(() => {
        setIsUploading(false);
        onAddToast('Không thể xử lý tệp hình ảnh. Vui lòng thử lại.', 'error');
      })
      .finally(() => {
        if (fileInputRef.current) fileInputRef.current.value = '';
      });
  };

  // Direct Mouse / Touch Dragging Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (role !== 'admin') return;
    e.preventDefault();

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {
      // Fallback
    }

    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPosX: posX,
      initialPosY: posY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();

    const container = containerRef.current;
    const containerWidth = container ? container.clientWidth : 600;
    const containerHeight = container ? container.clientHeight : 180;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Direct 1:1 intuitive dragging sensitivity:
    // Dragging right pulls left edge into view -> posX decreases
    // Dragging left pulls right edge into view -> posX increases
    const sensitivityX = (100 / containerWidth) * 0.95;
    const sensitivityY = (100 / containerHeight) * 0.95;

    const deltaPosX = -dx * sensitivityX;
    const deltaPosY = -dy * sensitivityY;

    // Strictly clamped to 0% - 100% to guarantee no empty gaps/borders
    const newPosX = Math.max(0, Math.min(100, Math.round(dragStartRef.current.initialPosX + deltaPosX)));
    const newPosY = Math.max(0, Math.min(100, Math.round(dragStartRef.current.initialPosY + deltaPosY)));

    setPosX(newPosX);
    setPosY(newPosY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // Reset Position to default center (50% 50%, Scale 100%)
  const handleResetPosition = () => {
    setPosX(50);
    setPosY(50);
    setScale(100);
    onAddToast('Đã đặt lại vị trí và độ phóng đại về mặc định (Căn giữa 50% 50%).', 'info');
  };

  // Save Position & Zoom Adjustments
  const handleSave = async () => {
    if (role !== 'admin' || isSaving) {
      if (role !== 'admin') {
        onAddToast('Từ chối thao tác! Bạn không có quyền Quản trị.', 'error');
      }
      return;
    }

    try {
      setIsSaving(true);
      const updatedConfig: BannerConfig = {
        ...bannerConfig,
        bgUrl: pendingFileUrl || draftUrl,
        posX,
        posY,
        scale,
      };

      await onSaveBannerConfig(updatedConfig, pendingFileUrl || undefined);
      setPendingFileUrl(null);
      onClose();
    } catch (err) {
      // Error toast is handled in caller, modal stays open for retry
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel & Discard uncommitted changes
  const handleCancel = () => {
    if (isSaving) return;
    setDraftUrl(currentBannerUrl);
    setPendingFileUrl(null);
    setPosX(bannerConfig.posX ?? 50);
    setPosY(bannerConfig.posY ?? 50);
    setScale(bannerConfig.scale ?? 100);
    setIsDragging(false);
    isDraggingRef.current = false;
    onClose();
  };

  // Confirm Delete Custom Image
  const handleConfirmDelete = async () => {
    if (role !== 'admin' || isSaving) {
      if (role !== 'admin') {
        onAddToast('Từ chối thao tác! Bạn không có quyền Quản trị.', 'error');
      }
      return;
    }
    try {
      setIsSaving(true);
      await onDeleteBanner();
      setDraftUrl(null);
      setPendingFileUrl(null);
      setPosX(50);
      setPosY(50);
      setScale(100);
      setConfirmMode(null);
    } catch (err) {
      // Handled
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Restore Default Banner
  const handleConfirmRestore = async () => {
    if (role !== 'admin' || isSaving) {
      if (role !== 'admin') {
        onAddToast('Từ chối thao tác! Bạn không có quyền Quản trị.', 'error');
      }
      return;
    }
    try {
      setIsSaving(true);
      await onRestoreDefaultBanner();
      setDraftUrl(null);
      setPendingFileUrl(null);
      setPosX(DEFAULT_BANNER_CONFIG.posX);
      setPosY(DEFAULT_BANNER_CONFIG.posY);
      setScale(DEFAULT_BANNER_CONFIG.scale);
      setConfirmMode(null);
    } catch (err) {
      // Handled
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
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

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 z-10 overflow-hidden my-auto max-h-[95vh] flex flex-col select-none"
            id="banner-modal-container"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-150 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                    <span>CHỈNH VỊ TRÍ BANNER</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Kéo ảnh trực tiếp bằng chuột để căn vị trí hiển thị đẹp mắt nhất
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Đóng"
                id="btn-close-banner-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto py-4 space-y-4 flex-1">
              {confirmMode === 'delete' ? (
                /* Sub-view: Delete Confirmation */
                <div className="flex flex-col items-center text-center py-8 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shadow-sm">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                      Bạn có chắc chắn muốn xóa ảnh Banner hiện tại không?
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Ảnh tùy chỉnh sẽ bị xóa và ứng dụng sẽ tự động chuyển về Banner mặc định của hệ thống.
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
                /* Sub-view: Restore Default Confirmation */
                <div className="flex flex-col items-center text-center py-8 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shadow-sm">
                    <RotateCcw className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 max-w-md">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                      Bạn có muốn khôi phục Banner mặc định không?
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Banner sẽ trở về thiết kế màu sắc mặc định và độ phóng đại sẽ được đưa về giá trị gốc.
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
                      <span>Khôi phục mặc định</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* MAIN DRAG & DROP VIEW */
                <div className="space-y-4">
                  {/* Top Bar with Instruction and Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-200">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                        <Move className="w-3.5 h-3.5" />
                      </span>
                      <span>🖱️ Nhấn giữ chuột và kéo ảnh để căn vị trí</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                        id="btn-upload-banner-in-modal"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{hasCustomBanner ? 'Đổi ảnh khác' : 'Tải ảnh lên'}</span>
                      </button>

                      {hasCustomBanner && (
                        <button
                          type="button"
                          onClick={() => setConfirmMode('delete')}
                          className="h-8 px-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                          id="btn-delete-banner-in-modal"
                          title="Xóa ảnh tùy chỉnh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa ảnh</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* INTERACTIVE DRAGGABLE BANNER PREVIEW CONTAINER */}
                  <div className="relative group">
                    <div
                      ref={containerRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      className={`relative w-full rounded-2xl overflow-hidden shadow-lg border-2 text-white min-h-[175px] sm:min-h-[195px] p-6 flex flex-col items-center justify-center text-center transition-shadow select-none touch-none ${
                        isDragging
                          ? 'cursor-grabbing border-blue-500 shadow-xl ring-2 ring-blue-500/30'
                          : 'cursor-grab border-blue-300 dark:border-blue-700/60 hover:border-blue-400'
                      } bg-zinc-900`}
                      id="interactive-banner-preview"
                    >
                      {/* Dynamic Background Image Layer with direct mouse coordinates */}
                      {hasCustomBanner && activeImage ? (
                        <>
                          <div
                            className="absolute inset-0 z-0 pointer-events-none"
                            style={{
                              backgroundImage: `url(${activeImage})`,
                              backgroundPosition: `${posX}% ${posY}%`,
                              backgroundSize: 'cover',
                              backgroundRepeat: 'no-repeat',
                              transform: `scale(${scale / 100})`,
                              transformOrigin: `${posX}% ${posY}%`,
                              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                            }}
                          />
                          {/* Protected overlay for readability */}
                          <div className="absolute inset-0 z-1 bg-gradient-to-t from-black/60 via-black/35 to-black/45 backdrop-blur-[0.5px] pointer-events-none" />
                        </>
                      ) : (
                        /* System Default CSS Banner when no custom image is loaded */
                        <div 
                          className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600"
                          style={{
                            transform: `scale(${scale / 100})`,
                            transformOrigin: `${posX}% ${posY}%`,
                            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                          }}
                        >
                          <div 
                            className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:20px_20px]" 
                            style={{
                              backgroundPosition: `${posX}% ${posY}%`,
                            }}
                          />
                          <div 
                            className="absolute top-0 left-1/4 w-80 h-80 bg-cyan-400/25 rounded-full blur-3xl -translate-y-1/2" 
                            style={{
                              transform: `translate(${(posX - 50) * 1.5}px, ${(posY - 50) * 1.5}px)`,
                            }}
                          />
                          <div 
                            className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl translate-y-1/2" 
                            style={{
                              transform: `translate(${(posX - 50) * 1.5}px, ${(posY - 50) * 1.5}px)`,
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/10" />
                        </div>
                      )}

                      {/* FIXED CENTERED TEXT OVERLAY (Strictly stationary & locked) */}
                      <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center justify-center text-center space-y-2 select-none pointer-events-none">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans">
                          HỌC LIỆU SỐ MÔN TIN HỌC
                        </h2>
                        <p className="text-xs sm:text-sm font-bold tracking-normal text-cyan-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-sans">
                          Kết nối tri thức - Chạm tới tương lai
                        </p>
                      </div>

                      {/* Floating Drag Indicator Badge */}
                      <div className="absolute bottom-2.5 right-2.5 z-20 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white/90 shadow-sm">
                        <Move className="w-3 h-3 text-cyan-300" />
                        <span>{isDragging ? 'Đang kéo ảnh...' : 'Nhấn & kéo để căn vị trí'}</span>
                      </div>
                    </div>
                  </div>

                  {/* ZOOM SLIDER SECTION */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                        <ZoomIn className="w-4 h-4 text-blue-500" />
                        <span>Độ phóng đại ảnh (Zoom):</span>
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md text-xs">
                        {scale}%
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-semibold text-zinc-500 shrink-0">Thu nhỏ</span>
                      <input
                        type="range"
                        min="100"
                        max="220"
                        step="1"
                        value={scale}
                        onChange={(e) => setScale(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                        id="slider-banner-zoom"
                      />
                      <span className="text-[11px] font-semibold text-zinc-500 shrink-0">Phóng to</span>
                    </div>
                  </div>

                  {/* Helper notice */}
                  <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2.5">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                      Ảnh nền được tự động khống chế phạm vi để luôn phủ kín khung Banner mà không bị lộ viền trắng. Tiêu đề và slogan luôn được cố định ở trung tâm.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-3.5 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
              <div>
                <button
                  type="button"
                  onClick={handleResetPosition}
                  className="h-10 px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  id="btn-reset-banner-position"
                  title="Đặt lại vị trí căn giữa"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>↺ Đặt lại vị trí</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer"
                  id="btn-cancel-banner-adjust"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 sm:px-6 h-10 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed text-white text-xs font-black flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  id="btn-save-banner-adjust"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>ĐANG LƯU...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>LƯU THAY ĐỔI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
