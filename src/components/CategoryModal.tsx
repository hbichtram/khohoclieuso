import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Edit3, Check } from 'lucide-react';
import { Category } from '../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'admin' | 'viewer';
  categories: Category[];
  onSaveCategories: (categories: Category[]) => void;
  onAddToast: (message: string, type: 'success' | 'error') => void;
  linksCountByCategory: Record<string, number>;
}

const PRESET_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Yellow
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#6B7280', // Gray
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  role,
  categories,
  onSaveCategories,
  onAddToast,
  linksCountByCategory,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  // Reset fields
  const resetForm = () => {
    setEditingId(null);
    setNameInput('');
    setSelectedColor(PRESET_COLORS[0]);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleAddOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) {
      onAddToast('Vui lòng nhập tên danh mục!', 'error');
      return;
    }

    // Check duplicate
    const isDuplicate = categories.some(
      (cat) => cat.name.toLowerCase() === cleanName.toLowerCase() && cat.id !== editingId
    );
    if (isDuplicate) {
      onAddToast('Danh mục này đã tồn tại!', 'error');
      return;
    }

    if (editingId) {
      // Edit
      const updated = categories.map((cat) =>
        cat.id === editingId ? { ...cat, name: cleanName, color: selectedColor } : cat
      );
      onSaveCategories(updated);
      onAddToast('Đã cập nhật danh mục thành công!', 'success');
    } else {
      // Create
      const newId = `cat-${Date.now()}`;
      const newCat: Category = {
        id: newId,
        name: cleanName,
        color: selectedColor,
      };
      onSaveCategories([...categories, newCat]);
      onAddToast('Đã thêm danh mục mới!', 'success');
    }

    resetForm();
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setNameInput(cat.name);
    setSelectedColor(cat.color);
  };

  const handleDelete = (id: string) => {
    // If there are links in this category, warn or block or do not delete easily
    const linkCount = linksCountByCategory[id] || 0;
    if (linkCount > 0) {
      onAddToast(`Không thể xóa danh mục này vì đang có ${linkCount} liên kết trực thuộc!`, 'error');
      return;
    }

    if (categories.length <= 1) {
      onAddToast('Ứng dụng cần ít nhất một danh mục để hoạt động!', 'error');
      return;
    }

    const updated = categories.filter((cat) => cat.id !== id);
    onSaveCategories(updated);
    onAddToast('Đã xóa danh mục thành công!', 'success');
    if (editingId === id) {
      resetForm();
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            id="category-modal-backdrop"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 overflow-hidden max-h-[85vh] flex flex-col z-10"
            id="category-modal-container"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4 mb-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50" id="category-modal-title">
                Quản lý Danh mục
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                id="category-modal-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            {role === 'admin' ? (
              <form onSubmit={handleAddOrEdit} className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 mb-6">
                <h3 className="text-sm font-semibold text-zinc-850 dark:text-zinc-200 mb-3">
                  {editingId ? 'Sửa thông tin danh mục' : 'Thêm danh mục mới'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                      Tên danh mục <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Ví dụ: AI, Thiết kế, Du lịch..."
                      className="w-full px-3 h-10 text-sm bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-zinc-400"
                      id="category-input-name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                      Chọn màu sắc danh mục
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className="w-7 h-7 rounded-full border-2 transition-all relative flex items-center justify-center shrink-0 cursor-pointer"
                          style={{
                            backgroundColor: color,
                            borderColor: selectedColor === color ? '#FFFFFF' : 'transparent',
                            boxShadow: selectedColor === color ? `0 0 0 2px ${color}` : 'none',
                          }}
                          id={`category-color-${color.replace('#', '')}`}
                        >
                          {selectedColor === color && (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-zinc-150 dark:border-zinc-850">
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-3.5 h-9 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        id="category-btn-cancel-edit"
                      >
                        Hủy Sửa
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 h-9 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
                      id="category-btn-submit"
                    >
                      {editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      {editingId ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/15 p-3.5 rounded-xl text-xs text-blue-600 dark:text-blue-400 font-medium mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                Bạn đang truy cập ở chế độ Người xem. Chỉ có Quản trị viên mới được thêm, sửa, xóa danh mục.
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-1">
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">
                Danh sách danh mục hiện có ({categories.length})
              </h3>
              <div className="space-y-2">
                {categories.map((cat) => {
                  const count = linksCountByCategory[cat.id] || 0;
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                      id={`category-item-${cat.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-zinc-850 dark:text-zinc-200">
                            {cat.name}
                          </p>
                          <p className="text-xs text-zinc-450 dark:text-zinc-500">
                            {count} liên kết
                          </p>
                        </div>
                      </div>

                      {role === 'admin' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(cat)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            title="Sửa"
                            id={`category-btn-edit-${cat.id}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Xóa"
                            id={`category-btn-delete-${cat.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
