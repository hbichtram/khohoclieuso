import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, Trash2, X, Check, User, AlertTriangle, RefreshCw } from 'lucide-react';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string | null;
  onSaveAvatar: (avatarDataUrl: string) => void;
  onDeleteAvatar: () => void;
  onAddToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  onSaveAvatar,
  onDeleteAvatar,
  onAddToast,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview when modal opens or currentAvatar changes
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentAvatar);
      setIsConfirmingDelete(false);
    }
  }, [isOpen, currentAvatar]);

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
      onAddToast('Định dạng file không hợp lệ! Vui lòng chọn ảnh JPG, PNG hoặc WEBP.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate File Size: Max 5MB (5 * 1024 * 1024 bytes)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      onAddToast('Dung lượng ảnh vượt quá 5 MB! Vui lòng chọn ảnh nhỏ hơn.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Convert to Data URL for preview & local storage
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPreviewUrl(dataUrl);
        onAddToast('Đã tải ảnh lên! Nhấn "Lưu" để cập nhật ảnh đại diện.', 'info');
      }
    };
    reader.readAsDataURL(file);

    // Reset file input so user can pick the same file again if desired
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    if (!previewUrl) {
      onDeleteAvatar();
      onAddToast('Đã xóa ảnh đại diện!', 'success');
      onClose();
      return;
    }
    onSaveAvatar(previewUrl);
    onAddToast('Lưu ảnh đại diện thành công!', 'success');
    onClose();
  };

  const handleConfirmDelete = () => {
    onDeleteAvatar();
    setPreviewUrl(null);
    setIsConfirmingDelete(false);
    onAddToast('Xóa ảnh đại diện thành công!', 'success');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            id="avatar-modal-backdrop"
          />

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleSelectFile}
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            id="avatar-file-input"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 z-10 overflow-hidden"
            id="avatar-modal-container"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800/80 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    Ảnh đại diện giáo viên
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Quản lý và thay đổi hình đại diện hồ sơ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Đóng"
                id="btn-close-avatar-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Preview Content */}
            {!isConfirmingDelete ? (
              <div className="flex flex-col items-center space-y-6 py-2">
                {/* Circular Avatar Frame (80-100px preview) */}
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-28 h-28 rounded-full border-4 border-blue-500/30 dark:border-blue-400/20 p-1 shadow-xl bg-zinc-50 dark:bg-zinc-800/80 transition-transform duration-300 group-hover:scale-105 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-zinc-100 dark:bg-zinc-850">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Avatar xem trước"
                          className="w-full h-full object-cover rounded-full"
                          id="avatar-preview-img"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800">
                          <User className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Overlay Camera Icon */}
                  <div
                    className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    title="Đổi ảnh đại diện"
                  >
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold">Đổi ảnh</span>
                  </div>
                </div>

                {/* Upload Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 min-w-[140px] px-4 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    id="btn-upload-avatar-file"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{previewUrl ? 'Chọn ảnh khác' : 'Tải ảnh từ máy'}</span>
                  </button>

                  {previewUrl && (
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(true)}
                      className="px-3.5 h-10 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      id="btn-delete-avatar-init"
                      title="Xóa ảnh đại diện"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa ảnh</span>
                    </button>
                  )}
                </div>

                {/* File Requirements Note */}
                <div className="w-full p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-150 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
                  <p className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                    <span>💡 Quy định về tệp ảnh:</span>
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    <li>Định dạng: <strong>JPG, JPEG, PNG, WEBP</strong>.</li>
                    <li>Dung lượng tối đa: <strong>5 MB</strong>.</li>
                    <li>Ảnh tự động được căn giữa và cắt hình tròn.</li>
                  </ul>
                </div>

                {/* Footer Save / Cancel Controls */}
                <div className="flex items-center justify-end gap-2.5 w-full pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    id="btn-cancel-avatar-modal"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-5 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    id="btn-save-avatar"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Delete Confirmation Sub-view */
              <div className="flex flex-col items-center text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center animate-bounce">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    Xác nhận xóa ảnh đại diện?
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                    Ảnh đại diện hiện tại sẽ bị xóa và quay về biểu tượng mặc định.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full pt-4">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="flex-1 h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    id="btn-cancel-delete-avatar"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                    id="btn-confirm-delete-avatar"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Đồng ý xóa</span>
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
