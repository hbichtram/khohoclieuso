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
  Sliders,
  Move,
  ZoomIn,
  ArrowUpDown,
  ArrowLeftRight,
  Maximize2,
  Layers,
  LayoutTemplate,
} from 'lucide-react';
import { BannerConfig, DEFAULT_BANNER_CONFIG } from '../types';

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'admin' | 'viewer';
  bannerConfig: BannerConfig;
  currentBannerUrl: string | null;
  onSaveBannerConfig: (config: BannerConfig, newImageDataUrl?: string | null) => void;
  onDeleteBanner: () => void;
  onRestoreDefaultBanner: () => void;
  onAddToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

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
  // Pending draft states for live preview and adjustments
  const [draftUrl, setDraftUrl] = useState<string | null>(currentBannerUrl);
  const [pendingFileUrl, setPendingFileUrl] = useState<string | null>(null);
  const [posX, setPosX] = useState<number>(bannerConfig.posX ?? 50);
  const [posY, setPosY] = useState<number>(bannerConfig.posY ?? 50);
  const [scale, setScale] = useState<number>(bannerConfig.scale ?? 100);
  const [marginTop, setMarginTop] = useState<number>(bannerConfig.marginTop ?? 0);
  const [marginBottom, setMarginBottom] = useState<number>(bannerConfig.marginBottom ?? 24);

  const [activeTab, setActiveTab] = useState<'image' | 'container'>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'delete' | 'restore' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setMarginTop(bannerConfig.marginTop ?? 0);
      setMarginBottom(bannerConfig.marginBottom ?? 24);
      setIsUploading(false);
      setConfirmMode(null);
      setActiveTab('image');
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

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPendingFileUrl(dataUrl);
        setIsUploading(false);
        onAddToast('Đã tải ảnh lên để xem trước! Bạn có thể điều chỉnh vị trí ngay bên dưới.', 'info');
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Reset Positions & Scale to Center Defaults
  const handleResetPosition = () => {
    setPosX(50);
    setPosY(50);
    setScale(100);
    setMarginTop(0);
    setMarginBottom(24);
    onAddToast('Đã đặt lại vị trí về mặc định (Căn giữa 50% 50%, tỷ lệ 100%).', 'info');
  };

  // Save All Adjustments
  const handleSave = () => {
    if (role !== 'admin') {
      onAddToast('Từ chối thao tác! Bạn không có quyền Quản trị.', 'error');
      return;
    }

    try {
      const updatedConfig: BannerConfig = {
        bgUrl: pendingFileUrl || draftUrl,
        posX,
        posY,
        scale,
        marginTop,
        marginBottom,
      };

      onSaveBannerConfig(updatedConfig, pendingFileUrl || undefined);
      setPendingFileUrl(null);
      onClose();
    } catch (err) {
      onAddToast('Không thể cập nhật cấu hình Banner. Vui lòng thử lại.', 'error');
    }
  };

  // Confirm Delete Custom Image
  const handleConfirmDelete = () => {
    if (role !== 'admin') {
      onAddToast('Từ chối thao tác! Bạn không có quyền Quản trị.', 'error');
      return;
    }
    onDeleteBanner();
    setDraftUrl(null);
    setPendingFileUrl(null);
    setPosX(50);
    setPosY(50);
    setScale(100);
    setConfirmMode(null);
  };

  // Confirm Restore Default Banner
  const handleConfirmRestore = () => {
    if (role !== 'admin') {
      onAddToast('Từ chối thao tác! Bạn không có quyền Quản trị.', 'error');
      return;
    }
    onRestoreDefaultBanner();
    setDraftUrl(null);
    setPendingFileUrl(null);
    setPosX(DEFAULT_BANNER_CONFIG.posX);
    setPosY(DEFAULT_BANNER_CONFIG.posY);
    setScale(DEFAULT_BANNER_CONFIG.scale);
    setMarginTop(DEFAULT_BANNER_CONFIG.marginTop);
    setMarginBottom(DEFAULT_BANNER_CONFIG.marginBottom);
    setConfirmMode(null);
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
            onClick={onClose}
            className="fixed inset-0 bg-black/65 backdrop-blur-sm"
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
            className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 z-10 overflow-hidden my-auto max-h-[95vh] flex flex-col"
            id="banner-modal-container"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-150 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-md">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
                    <span>QUẢN LÝ & ĐIỀU CHỈNH BANNER</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Tùy chỉnh ảnh nền, vị trí tọa độ và khoảng cách hiển thị của Banner
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

            {/* Modal Content Scrollable Area */}
            <div className="overflow-y-auto pr-1 py-4 space-y-5 flex-1">
              {confirmMode === 'delete' ? (
                /* Sub-view: Delete Confirmation */
                <div className="flex flex-col items-center text-center py-8 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center animate-bounce shadow-sm">
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
                      Banner sẽ trở về thiết kế màu sắc mặc định, tất cả vị trí và độ phóng đại sẽ được đưa về giá trị gốc.
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
                /* MAIN MANAGEMENT & ADJUSTMENT VIEW */
                <div className="space-y-5">
                  {/* LIVE PREVIEW SECTION */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
                          Xem trước Banner trực tiếp (Live Preview)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            hasCustomBanner
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {hasCustomBanner ? (pendingFileUrl ? '📸 Ảnh mới tải lên' : '📸 Ảnh tùy chỉnh') : '🎨 Mặc định hệ thống'}
                        </span>
                      </div>
                    </div>

                    {/* Realistic Mini Homepage Simulation Box */}
                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-950/70 p-3 sm:p-4 overflow-hidden shadow-inner">
                      {/* Mini Header Mock */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400 font-bold uppercase tracking-wider select-none">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          <span>CỔNG HỌC LIỆU SỐ TIN HỌC</span>
                        </div>
                        <span className="text-[9px] bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-md">Trang chủ</span>
                      </div>

                      {/* LIVE BANNER CONTAINER */}
                      <div
                        className="relative w-full rounded-2xl overflow-hidden shadow-md border border-blue-200/50 dark:border-blue-900/30 text-white min-h-[160px] sm:min-h-[175px] p-5 flex flex-col items-center justify-center text-center transition-all bg-zinc-900"
                        style={{
                          marginTop: `${marginTop}px`,
                          marginBottom: `${marginBottom}px`,
                        }}
                        id="live-preview-banner-box"
                      >
                        {/* Dynamic Background Image Layer with Live Position & Zoom */}
                        {hasCustomBanner && activeImage ? (
                          <>
                            <div
                              className="absolute inset-0 z-0 transition-transform duration-75 ease-out"
                              style={{
                                backgroundImage: `url(${activeImage})`,
                                backgroundPosition: `${posX}% ${posY}%`,
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat',
                                transform: `scale(${scale / 100})`,
                                transformOrigin: `${posX}% ${posY}%`,
                              }}
                            />
                            {/* Layer overlay for text contrast */}
                            <div className="absolute inset-0 z-1 bg-gradient-to-t from-black/60 via-black/35 to-black/45 backdrop-blur-[0.5px]" />
                          </>
                        ) : (
                          /* System Default CSS Glowing Background */
                          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:20px_20px]" />
                            <div className="absolute top-0 left-1/4 w-80 h-80 bg-cyan-400/25 rounded-full blur-3xl -translate-y-1/2" />
                            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl translate-y-1/2" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/10" />
                          </div>
                        )}

                        {/* Centered Protected Text Overlay (Strictly Fixed & Centered) */}
                        <div className="relative z-10 max-w-xl mx-auto flex flex-col items-center justify-center text-center space-y-2 select-none pointer-events-none">
                          <h2 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans">
                            HỌC LIỆU SỐ MÔN TIN HỌC
                          </h2>
                          <p className="text-xs sm:text-sm font-bold tracking-normal text-cyan-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-sans">
                            Kết nối tri thức - Chạm tới tương lai
                          </p>
                        </div>
                      </div>

                      {/* Mini Portal Mock */}
                      <div className="mt-1 pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400 select-none">
                        <span className="font-bold flex items-center gap-1">
                          <span>📚 CỔNG HỌC LIỆU SỐ (Tin học 3, 4, 5...)</span>
                        </span>
                        <span className="text-[9px] text-zinc-400 italic">Vị trí thực tế trên trang chủ</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION TABS FOR FINE-TUNING */}
                  <div className="flex items-center gap-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/60">
                    <button
                      type="button"
                      onClick={() => setActiveTab('image')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'image'
                          ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200 dark:border-zinc-700'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                      id="tab-adjust-image"
                    >
                      <Move className="w-3.5 h-3.5" />
                      <span>1. ĐIỀU CHỈNH ẢNH NỀN</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('container')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'container'
                          ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200 dark:border-zinc-700'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                      id="tab-adjust-container"
                    >
                      <LayoutTemplate className="w-3.5 h-3.5" />
                      <span>2. ĐIỀU CHỈNH KHUNG BANNER</span>
                    </button>
                  </div>

                  {/* TAB 1: BACKGROUND IMAGE POSITION & ZOOM SLIDERS */}
                  {activeTab === 'image' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
                      {/* Top Action Row (Upload & Delete) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                            id="btn-upload-banner-in-tab"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>📷 Tải ảnh mới</span>
                          </button>

                          {hasCustomBanner && (
                            <button
                              type="button"
                              onClick={() => setConfirmMode('delete')}
                              className="h-9 px-3 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                              id="btn-delete-banner-in-tab"
                              title="Xóa ảnh tùy chỉnh"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xóa ảnh</span>
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleResetPosition}
                          className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                          id="btn-reset-pos-in-tab"
                          title="Đặt lại tọa độ căn giữa"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>↺ Đặt lại vị trí</span>
                        </button>
                      </div>

                      {/* 1. Horizontal Position Slider */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                            <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
                            <span>Vị trí ngang (Horizontal):</span>
                          </span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md text-[11px]">
                            {posX}% {posX === 50 ? '(Căn giữa)' : posX < 50 ? '(Lệch trái)' : '(Lệch phải)'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={posX}
                          onChange={(e) => setPosX(Number(e.target.value))}
                          className="w-full accent-blue-600 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                          id="slider-pos-x"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-400 font-medium px-0.5">
                          <span>Trái (0%)</span>
                          <span>Giữa (50%)</span>
                          <span>Phải (100%)</span>
                        </div>
                      </div>

                      {/* 2. Vertical Position Slider */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Vị trí dọc (Vertical):</span>
                          </span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md text-[11px]">
                            {posY}% {posY === 50 ? '(Căn giữa)' : posY < 50 ? '(Lệch trên)' : '(Lệch dưới)'}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={posY}
                          onChange={(e) => setPosY(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                          id="slider-pos-y"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-400 font-medium px-0.5">
                          <span>Trên (0%)</span>
                          <span>Giữa (50%)</span>
                          <span>Dưới (100%)</span>
                        </div>
                      </div>

                      {/* 3. Zoom / Scale Slider */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
                            <ZoomIn className="w-3.5 h-3.5 text-cyan-500" />
                            <span>Độ phóng đại ảnh (Zoom):</span>
                          </span>
                          <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded-md text-[11px]">
                            {scale}% {scale === 100 ? '(Vừa khung)' : `${scale}%`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="80"
                          max="200"
                          step="2"
                          value={scale}
                          onChange={(e) => setScale(Number(e.target.value))}
                          className="w-full accent-cyan-600 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                          id="slider-scale"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-400 font-medium px-0.5">
                          <span>Thu nhỏ (80%)</span>
                          <span>Vừa khung (100%)</span>
                          <span>Phóng to (200%)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: BANNER CONTAINER SPACING ADJUSTMENT */}
                  {activeTab === 'container' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-200">
                        <LayoutTemplate className="w-4 h-4 text-blue-500" />
                        <span>Khoảng cách khung Banner trên Trang chủ</span>
                      </div>

                      {/* Margin Top */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-zinc-700 dark:text-zinc-200">
                            Khoảng cách phía trên (Margin Top):
                          </span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md text-[11px]">
                            {marginTop} px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="48"
                          step="2"
                          value={marginTop}
                          onChange={(e) => setMarginTop(Number(e.target.value))}
                          className="w-full accent-blue-600 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                          id="slider-margin-top"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-400 font-medium px-0.5">
                          <span>Sát mép (0px)</span>
                          <span>Vừa phải (16px)</span>
                          <span>Rộng rãi (48px)</span>
                        </div>
                      </div>

                      {/* Margin Bottom */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-zinc-700 dark:text-zinc-200">
                            Khoảng cách phía dưới (Margin Bottom):
                          </span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md text-[11px]">
                            {marginBottom} px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="48"
                          step="2"
                          value={marginBottom}
                          onChange={(e) => setMarginBottom(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                          id="slider-margin-bottom"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-400 font-medium px-0.5">
                          <span>Sát cổng học liệu (0px)</span>
                          <span>Mặc định (24px)</span>
                          <span>Cách xa (48px)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Informational Guidance Box */}
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2.5">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                      <strong>Lưu ý:</strong> Mọi điều chỉnh vị trí ảnh và phóng đại sẽ chỉ tác động đến lớp nền. Dòng chữ <strong>"HỌC LIỆU SỐ MÔN TIN HỌC"</strong> và khẩu hiệu luôn được giữ cố định ở trung tâm và hiển thị sắc nét trên mọi thiết bị.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-3.5 border-t border-zinc-150 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div>
                {hasCustomBanner && (
                  <button
                    type="button"
                    onClick={() => setConfirmMode('restore')}
                    className="h-10 px-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    id="btn-restore-default-banner-footer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi phục mặc định</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 h-10 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  id="btn-cancel-banner-adjust"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 h-10 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
                  id="btn-save-banner-adjust"
                >
                  <Check className="w-4 h-4" />
                  <span>LƯU THAY ĐỔI</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
