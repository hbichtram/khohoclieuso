import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
}) => {
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
            id="delete-confirm-backdrop"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 z-10"
            id="delete-confirm-container"
          >
            <div className="flex flex-col items-center text-center">
              {/* Warning Icon */}
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-500 mb-4 animate-bounce">
                <AlertTriangle className="w-6 h-6" />
              </div>

              {/* Message */}
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                Xác nhận xóa liên kết?
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                Bạn có chắc chắn muốn xóa liên kết <strong className="text-zinc-700 dark:text-zinc-300">"{title}"</strong>? Hành động này sẽ không thể hoàn tác.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 h-10 border border-zinc-200 dark:border-zinc-850 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                  id="delete-cancel-btn"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="flex-1 px-4 h-10 bg-rose-600 hover:bg-rose-500 rounded-xl text-sm font-semibold text-white shadow-lg shadow-rose-500/10 hover:shadow-rose-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id="delete-confirm-btn"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa bỏ
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
