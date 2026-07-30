import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Key, X, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onAddToast: (message: string, type: 'success' | 'error') => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onAddToast,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  const CORRECT_PIN = 'admin123!@#';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      onConfirm();
      setPin('');
      setError('');
      onClose();
    } else {
      setError('Mã PIN không chính xác. Vui lòng thử lại!');
      onAddToast('Mã PIN không đúng!', 'error');
    }
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
            id="admin-pin-backdrop"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 z-10"
            id="admin-pin-container"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-all cursor-pointer"
              title="Đóng"
              id="admin-pin-close-btn"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center">
              {/* Header Icon */}
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500 mb-4 shadow-sm">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>

              {/* Title & Info */}
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 text-center mb-1">
                Đăng nhập Quyền Quản trị viên
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-5 px-4">
                Nhập mã PIN xác minh bảo mật để truy cập toàn quyền chỉnh sửa tài nguyên học liệu.
              </p>

              {/* Form Input */}
              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="relative">
                  <label className="block text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Mã PIN Xác nhận
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      <Key className="w-4 h-4" />
                    </span>
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Nhập mã PIN để tiếp tục..."
                      className={`w-full pl-9 pr-10 h-11 text-sm bg-zinc-50 dark:bg-zinc-950 border ${
                        error
                          ? 'border-rose-500 focus:ring-rose-500/20'
                          : 'border-zinc-250 dark:border-zinc-800 focus:ring-blue-500/20'
                      } rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 placeholder-zinc-400 dark:placeholder-zinc-600 transition-all font-mono tracking-wider`}
                      autoFocus
                      id="admin-pin-input-field"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded transition-colors cursor-pointer"
                      id="btn-toggle-pin-visibility"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {error && (
                    <span className="block mt-1.5 text-xs text-rose-500 font-semibold animate-pulse">
                      {error}
                    </span>
                  )}
                </div>

                {/* Confirm/Cancel Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 h-10 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                    id="admin-pin-cancel"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 h-10 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    id="admin-pin-submit"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Xác nhận
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
